import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { UserRole } from '../types/entities';
import { ConfirmationSender, OutboundMessage } from './confirmationSender';
import { createApp } from './createApp';
import { FileGuestRepository } from './fileRepository';
import { ConnectLink, PaymentEvent, PaymentGateway, PaymentIntentResult } from './payments';
import { StaffAuthenticator, StaffUser } from './staffAuth';

const now = () => new Date('2026-10-21T15:00:00.000Z');

class RecordingSender implements ConfirmationSender {
  readonly sent: OutboundMessage[] = [];

  emailConfigured(): boolean {
    return true;
  }

  smsConfigured(): boolean {
    return true;
  }

  async send(message: OutboundMessage): Promise<'sent'> {
    this.sent.push(message);
    return 'sent';
  }
}

class QueuedSender implements ConfirmationSender {
  emailConfigured(): boolean {
    return false;
  }

  smsConfigured(): boolean {
    return false;
  }

  async send(): Promise<'queued'> {
    return 'queued';
  }
}

class FakePayments implements PaymentGateway {
  configured = true;

  isConfigured(): boolean {
    return this.configured;
  }

  webhooksConfigured(): boolean {
    return this.configured;
  }

  async createIntent(input: { amountCents: number; reference: string; email: string | null }): Promise<PaymentIntentResult> {
    return { id: `pi_${input.reference}`, clientSecret: `secret_${input.reference}` };
  }

  constructEvent(): PaymentEvent {
    return { type: 'payment_intent.succeeded', reference: null, amountCents: null, id: null };
  }

  async createConnectLink(): Promise<ConnectLink> {
    return { url: 'https://example.test/connect', accountId: 'acct_123' };
  }
}

class FakeAuth implements StaffAuthenticator {
  constructor(private readonly user: StaffUser | null) {}

  ready(): boolean {
    return true;
  }

  async verify(authorization: string | undefined): Promise<StaffUser | null> {
    if (!authorization?.startsWith('Bearer ')) return null;
    return this.user;
  }
}

const directories: string[] = [];

async function build(options?: { sender?: ConfirmationSender; payments?: PaymentGateway; authUser?: StaffUser | null }) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'handyhearts-'));
  directories.push(dir);
  const repo = new FileGuestRepository(path.join(dir, 'store.json'));
  const sender = options?.sender ?? new RecordingSender();
  const payments = options?.payments ?? new FakePayments();
  const app = createApp({
    repo,
    auth: new FakeAuth(options?.authUser ?? null),
    payments,
    confirmations: sender,
    rateLimit: false,
    timeZone: 'UTC',
    corsOrigins: ['http://localhost:5173'],
    trustProxy: false,
    publicSiteUrl: 'https://hhcaretech.com',
    connectCountry: null,
    now,
  });
  return { app, repo, dir, sender };
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe('guest API', () => {
  it('saves a consultation without an account and returns a receipt', async () => {
    const { app, dir, sender } = await build();
    const response = await request(app).post('/api/consultations').send({
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      phone: '+15555550100',
      topic: 'device_setup',
      preferredDate: '2026-11-03',
      preferredTime: 'morning',
      notes: 'Calling for my dad',
    });
    expect(response.status).toBe(201);
    expect(response.body.receipt.reference).toMatch(/^HH-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{10}$/);
    expect(response.body.receipt.kind).toBe('consultation');
    expect(response.body.receipt.summary).toContain(response.body.receipt.reference);
    expect(response.body.receipt.emailConfirmation).toBe('sent');
    expect(response.body.receipt.smsConfirmation).toBe('sent');
    expect(JSON.stringify(response.body)).not.toContain('userId');
    expect(JSON.stringify(response.body)).not.toContain('user_id');
    const stored = JSON.parse(await readFile(path.join(dir, 'store.json'), 'utf8')) as { consultations: { reference: string }[] };
    expect(stored.consultations[0].reference).toBe(response.body.receipt.reference);
    expect(JSON.stringify(stored)).not.toContain('user_id');
    expect(sender).toBeInstanceOf(RecordingSender);
    const messages = (sender as RecordingSender).sent;
    expect(messages).toHaveLength(2);
    expect(messages[0].body).toContain(response.body.receipt.reference);
    expect(messages[1].channel).toBe('sms');

    const receipt = await request(app).get(`/api/receipts/${response.body.receipt.reference}`);
    expect(receipt.status).toBe(200);
    expect(receipt.body.receipt.fullName).toBe('Jane Morales');
  });

  it('saves a guest booking with a server-side quote and no sign-in', async () => {
    const { app, repo } = await build();
    await repo.saveService({
      id: 'svc-1',
      name: 'Device Setup',
      description: 'Setup help',
      baseRateCents: 3500,
      minHours: 2,
      isActive: true,
    });
    const created = await request(app).post('/api/orders').send({
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      phone: '5555550100',
      serviceCategory: 'device_setup',
      urgency: 'medium',
      serviceType: 'in_home',
      address: '100 Example Street',
      preferredDate: '2026-11-03',
      preferredTime: 'afternoon',
      notes: '',
    });
    expect(created.status).toBe(201);
    expect(created.body.receipt.totalCents).toBe(8500);
    expect(created.body.receipt.paymentStatus).toBe('unpaid');
    expect(created.body.clientSecret).toContain(created.body.receipt.reference);
    expect(created.body.receipt.items.map((item: { label: string }) => item.label)).toContain('Expedited Fee');
    expect(JSON.stringify(created.body)).not.toContain('userId');
  });

  it('does not invent a price or a payment when no rate is on file', async () => {
    const payments = new FakePayments();
    payments.configured = false;
    const { app } = await build({ payments, sender: new QueuedSender() });
    const created = await request(app).post('/api/orders').send({
      fullName: 'Jane Morales',
      phone: '5555550100',
      serviceCategory: 'printer_setup',
      urgency: 'high',
      serviceType: 'remote',
      preferredDate: '2026-11-03',
      preferredTime: 'evening',
    });
    expect(created.status).toBe(201);
    expect(created.body.receipt.priced).toBe(false);
    expect(created.body.receipt.totalCents).toBe(0);
    expect(created.body.receipt.paymentStatus).toBe('not_due');
    expect(created.body.clientSecret).toBeNull();
    expect(created.body.receipt.summary).toContain('No payment was taken');
    expect(created.body.receipt.emailConfirmation).toBe('skipped');
    expect(created.body.receipt.smsConfirmation).toBe('queued');
  });

  it('rejects a guest booking with no way to reply and does not require authorization', async () => {
    const { app } = await build();
    const response = await request(app).post('/api/consultations').send({
      fullName: 'Jane Morales',
      topic: 'unsure',
      preferredDate: '2026-11-03',
      preferredTime: 'anytime',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Enter an email or a phone number.');
  });

  it('keeps staff routes behind sign-in', async () => {
    const { app } = await build();
    const anonymous = await request(app).get('/api/staff/orders');
    expect(anonymous.status).toBe(401);
    const admin = await build({
      authUser: { id: 'staff-1', email: 'staff@example.com', name: 'Avery Staff', role: UserRole.ADMIN, isApproved: true, isBanned: false },
    });
    const signedIn = await request(admin.app).get('/api/staff/me').set('Authorization', 'Bearer staff-token');
    expect(signedIn.status).toBe(200);
    expect(signedIn.body.portal).toBe('admin');
  });

  it('sends security headers on the health check', async () => {
    const { app } = await build();
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    expect(response.headers['content-security-policy']).toContain('https://js.stripe.com');
    expect(response.headers['strict-transport-security']).toContain('max-age=15552000');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.body.guestStore).toBe(true);
  });
});
