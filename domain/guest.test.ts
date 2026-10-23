import { describe, expect, it } from 'vitest';
import { ConfirmationCopy } from './confirmationCopy';
import { GuestRequest } from './guestRequest';
import { OrderReference } from './orderReference';
import { QuoteBuilder } from './quoteBuilder';
import { ReceiptBuilder } from './receiptBuilder';
import { RoleGate } from './roleGate';
import { UserRole } from '../types/entities';
import { ConsultationRecord } from '../types/guest';

const now = new Date('2026-10-21T15:00:00.000Z');

describe('guest requests', () => {
  it('accepts a consultation with email only and no account id', () => {
    const result = GuestRequest.consultation({
      fullName: 'Jane Morales',
      email: 'Jane@Example.com',
      phone: '',
      topic: 'device_setup',
      preferredDate: '2026-11-03',
      preferredTime: 'morning',
      notes: 'Calling for my dad',
    }, 'UTC', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.email).toBe('jane@example.com');
    expect(result.value.phone).toBeNull();
    expect(result.value).not.toHaveProperty('userId');
  });

  it('accepts a booking with phone only when the visit is remote', () => {
    const result = GuestRequest.order({
      fullName: 'Jane Morales',
      email: '',
      phone: '5555550100',
      serviceCategory: 'wifi_setup',
      urgency: 'low',
      serviceType: 'remote',
      preferredDate: '2026-11-03',
      preferredTime: 'afternoon',
      address: '',
      notes: '',
    }, 'UTC', now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.phone).toBe('5555550100');
    expect(result.value.address).toBeNull();
  });

  it('requires an address for an in-home visit and a way to reply', () => {
    const missingAddress = GuestRequest.order({
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      serviceCategory: 'printer_setup',
      serviceType: 'in_home',
      preferredDate: '2026-11-03',
      preferredTime: 'anytime',
    }, 'UTC', now);
    expect(missingAddress).toEqual({ ok: false, message: 'Enter the address for an in-home visit.' });

    const missingContact = GuestRequest.consultation({
      fullName: 'Jane Morales',
      topic: 'unsure',
      preferredDate: '2026-11-03',
      preferredTime: 'anytime',
    }, 'UTC', now);
    expect(missingContact).toEqual({ ok: false, message: 'Enter an email or a phone number.' });
  });

  it('rejects past dates and unknown services', () => {
    expect(GuestRequest.order({
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      serviceCategory: 'device_setup',
      serviceType: 'remote',
      preferredDate: '2026-10-20',
      preferredTime: 'morning',
    }, 'UTC', now).ok).toBe(false);
    expect(GuestRequest.order({
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      serviceCategory: 'unsure',
      serviceType: 'remote',
      preferredDate: '2026-11-03',
      preferredTime: 'morning',
    }, 'UTC', now).ok).toBe(false);
  });
});

describe('order references', () => {
  it('builds an unguessable reference without a user id', () => {
    const reference = OrderReference.create(() => Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]));
    expect(reference).toBe('HH-ABCDEFGHJK');
    expect(OrderReference.isValid(reference)).toBe(true);
    expect(OrderReference.isValid('HH-0000000000')).toBe(false);
    expect(reference).not.toContain('user');
  });
});

describe('quotes and confirmations', () => {
  it('prices from a matching active service and leaves an unknown service unpriced', () => {
    const services = [{
      id: 'svc-1',
      name: 'Device Setup',
      description: 'Setup help',
      baseRateCents: 3500,
      minHours: 2,
      isActive: true,
    }];
    const priced = QuoteBuilder.build({
      services,
      serviceCategory: 'device_setup',
      urgency: 'medium',
      preferredDate: '2026-11-03',
      timeZone: 'UTC',
      now,
    });
    expect(priced.priced).toBe(true);
    if (!priced.priced) return;
    expect(priced.quote.total).toBe(8500);

    const missing = QuoteBuilder.build({
      services: [],
      serviceCategory: 'device_setup',
      urgency: 'high',
      preferredDate: '2026-11-03',
      timeZone: 'UTC',
      now,
    });
    expect(missing.priced).toBe(false);
  });

  it('writes a consultation confirmation that includes the reference and contact', () => {
    const record: ConsultationRecord = {
      reference: 'HH-ABCDEFGHJK',
      fullName: 'Jane Morales',
      email: 'jane@example.com',
      phone: '+15555550100',
      topic: 'training',
      preferredDate: '2026-11-03',
      preferredTime: 'morning',
      notes: null,
      status: 'submitted',
      createdAt: '2026-10-21T15:00:00.000Z',
    };
    const summary = ConfirmationCopy.consultationSummary(record);
    expect(summary).toContain('HH-ABCDEFGHJK');
    expect(summary).toContain('Jane Morales');
    expect(summary).toContain('jane@example.com');
    expect(summary).not.toMatch(/account|sign in|password/i);
    const receipt = ReceiptBuilder.fromConsultation(record, 'queued', 'queued');
    expect(receipt.kind).toBe('consultation');
    expect(receipt.summary).toBe(summary);
    expect(receipt).not.toHaveProperty('userId');
  });
});

describe('staff access', () => {
  it('does not give customers a portal', () => {
    expect(RoleGate.portalFor({ role: UserRole.ADMIN, is_approved: true })).toBe('admin');
    expect(RoleGate.portalFor({ role: UserRole.PROVIDER, is_approved: false })).toBe('provider-pending');
    expect(RoleGate.canViewAssignedJobs({ role: UserRole.PROVIDER, is_approved: true })).toBe(true);
    expect(RoleGate.canManagePlatform({ role: UserRole.PROVIDER, is_approved: true })).toBe(false);
  });
});
