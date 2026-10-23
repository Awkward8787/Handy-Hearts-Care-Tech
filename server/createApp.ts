import cors from 'cors';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ConfirmationCopy } from '../domain/confirmationCopy';
import { GuestRequest } from '../domain/guestRequest';
import { Money } from '../domain/money';
import { OrderReference } from '../domain/orderReference';
import { QuoteBuilder } from '../domain/quoteBuilder';
import { ReceiptBuilder } from '../domain/receiptBuilder';
import { RoleGate } from '../domain/roleGate';
import { VisitStatus } from '../domain/visitStatus';
import { FieldLimits } from '../domain/fieldLimits';
import { InquiryStatus } from '../types/entities';
import { ConfirmationRecord, ConsultationRecord, Receipt, ServiceOrderRecord, ServiceRecord } from '../types/guest';
import { ConfirmationSender } from './confirmationSender';
import { PaymentGateway } from './payments';
import { GuestRepository } from './repository';
import { SecurityPolicy } from './securityPolicy';
import { ServerLog } from './serverLog';
import { StaffAuthenticator, StaffUser } from './staffAuth';

export class RateLimits {
  static readonly windowMs = 15 * 60 * 1000;
  static readonly guestMax = 30;
  static readonly receiptMax = 60;
  static readonly staffMax = 120;
}

export interface AppDependencies {
  repo: GuestRepository;
  auth: StaffAuthenticator;
  payments: PaymentGateway;
  confirmations: ConfirmationSender;
  rateLimit: boolean;
  timeZone: string;
  corsOrigins: string[];
  trustProxy: boolean;
  publicSiteUrl: string;
  connectCountry: string | null;
  now?: () => Date;
}

export class ApiReply {
  static json(res: Response, status: number, code: string, message: string): void {
    res.status(status).json({ error: { code, message } });
  }
}

export class ReferenceAllocator {
  static async create(repo: GuestRepository): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const reference = OrderReference.create();
      if (!(await repo.referenceExists(reference))) return reference;
    }
    throw new Error('REFERENCE_EXHAUSTED');
  }
}

export class RequestParams {
  static one(value: string | string[] | undefined): string {
    return Array.isArray(value) ? value[0] ?? '' : value ?? '';
  }
}

function asyncRoute(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

export function createApp(deps: AppDependencies): express.Express {
  const now = deps.now ?? (() => new Date());
  const app = express();
  if (deps.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet(SecurityPolicy.helmetOptions()));
  app.use(cors({
    origin(origin, callback) {
      if (!origin || deps.corsOrigins.includes(origin)) callback(null, true);
      else callback(null, false);
    },
  }));

  const limiter = (limit: number): RequestHandler => {
    if (!deps.rateLimit) return (_req, _res, next) => next();
    return rateLimit({
      windowMs: RateLimits.windowMs,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait and try again.' } },
    });
  };
  const guestLimiter = limiter(RateLimits.guestMax);
  const receiptLimiter = limiter(RateLimits.receiptMax);
  const staffLimiter = limiter(RateLimits.staffMax);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      guestStore: deps.repo.ready(),
      staffSignIn: deps.auth.ready(),
      payments: deps.payments.isConfigured(),
      email: deps.confirmations.emailConfigured(),
      text: deps.confirmations.smsConfigured(),
    });
  });

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), asyncRoute(async (req, res) => {
    try {
      const event = deps.payments.constructEvent(req.body as Buffer, req.header('stripe-signature'));
      if (event.type === 'payment_intent.succeeded' && event.reference && event.id && event.amountCents !== null) {
        const order = await deps.repo.findOrder(event.reference);
        if (!order) {
          ApiReply.json(res, 404, 'NOT_FOUND', 'That booking was not found.');
          return;
        }
        if (order.totalPriceCents !== event.amountCents) {
          ServerLog.error('Payment amount did not match the booking.');
          ApiReply.json(res, 500, 'AMOUNT', 'The payment could not be recorded.');
          return;
        }
        await deps.repo.markOrderPaid(event.reference, {
          id: event.id,
          reference: event.reference,
          amountCents: event.amountCents,
          status: 'paid',
          createdAt: now().toISOString(),
        }, now().toISOString());
      }
      res.json({ received: true });
    } catch (error) {
      const unavailable = error instanceof Error && error.message === 'WEBHOOK_UNAVAILABLE';
      ServerLog.error(unavailable ? 'Webhook is not configured.' : 'Webhook verification failed.');
      ApiReply.json(res, unavailable ? 503 : 400, 'WEBHOOK', 'The payment notice could not be verified.');
    }
  }));

  app.use(express.json({ limit: '32kb' }));

  app.get('/api/services', asyncRoute(async (_req, res) => {
    if (!deps.repo.ready()) {
      res.json({ services: [] });
      return;
    }
    const services = (await deps.repo.listServices()).filter((service) => service.isActive);
    res.json({
      services: services.map((service) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        baseRateCents: service.baseRateCents,
        minHours: service.minHours,
      })),
    });
  }));

  app.post('/api/quotes', guestLimiter, asyncRoute(async (req, res) => {
    const parsed = GuestRequest.quote(req.body, deps.timeZone, now());
    if (!parsed.ok) {
      ApiReply.json(res, 400, 'VALIDATION', parsed.message);
      return;
    }
    const services = deps.repo.ready() ? await deps.repo.listServices() : [];
    const quote = QuoteBuilder.build({ services, ...parsed.value, timeZone: deps.timeZone, now: now() });
    res.json(quote.priced
      ? { priced: true, items: quote.quote.items, totalCents: quote.quote.total, serviceId: quote.service.id }
      : { priced: false, items: [], totalCents: 0, serviceId: null });
  }));

  app.post('/api/consultations', guestLimiter, asyncRoute(async (req, res) => {
    if (!deps.repo.ready()) {
      ApiReply.json(res, 503, 'UNAVAILABLE', 'That request could not be saved. Please try again.');
      return;
    }
    const parsed = GuestRequest.consultation(req.body, deps.timeZone, now());
    if (!parsed.ok) {
      ApiReply.json(res, 400, 'VALIDATION', parsed.message);
      return;
    }
    try {
      const reference = await ReferenceAllocator.create(deps.repo);
      const record: ConsultationRecord = {
        reference,
        ...parsed.value,
        status: 'submitted',
        createdAt: now().toISOString(),
      };
      await deps.repo.createConsultation(record);
      const receipt = await deliver(deps, record.reference, 'consultation', ConfirmationCopy.consultationSummary(record), record.email, record.phone, now);
      res.status(201).json({ receipt: ReceiptBuilder.fromConsultation(record, receipt.email, receipt.sms) });
    } catch {
      ServerLog.error('Consultation save failed.');
      ApiReply.json(res, 503, 'UNAVAILABLE', 'That request could not be saved. Please try again.');
    }
  }));

  app.post('/api/orders', guestLimiter, asyncRoute(async (req, res) => {
    if (!deps.repo.ready()) {
      ApiReply.json(res, 503, 'UNAVAILABLE', 'That request could not be saved. Please try again.');
      return;
    }
    const parsed = GuestRequest.order(req.body, deps.timeZone, now());
    if (!parsed.ok) {
      ApiReply.json(res, 400, 'VALIDATION', parsed.message);
      return;
    }
    try {
      const services = await deps.repo.listServices();
      const quote = QuoteBuilder.build({
        services,
        serviceCategory: parsed.value.serviceCategory,
        urgency: parsed.value.urgency,
        preferredDate: parsed.value.preferredDate,
        timeZone: deps.timeZone,
        now: now(),
      });
      const reference = await ReferenceAllocator.create(deps.repo);
      const createdAt = now().toISOString();
      const record: ServiceOrderRecord = {
        reference,
        fullName: parsed.value.fullName,
        email: parsed.value.email,
        phone: parsed.value.phone,
        serviceCategory: parsed.value.serviceCategory,
        serviceId: quote.priced ? quote.service.id : null,
        urgency: parsed.value.urgency,
        preferredDate: parsed.value.preferredDate,
        preferredTime: parsed.value.preferredTime,
        serviceType: parsed.value.serviceType,
        address: parsed.value.address,
        notes: parsed.value.notes,
        totalPriceCents: quote.priced ? quote.quote.total : 0,
        priceItems: quote.priced ? quote.quote.items : [],
        providerPayoutCents: 0,
        platformFeeCents: 0,
        paymentIntentId: null,
        paymentStatus: quote.priced && quote.quote.total > 0 ? 'unpaid' : 'not_due',
        status: 'submitted',
        assignedProviderUserId: null,
        createdAt,
        updatedAt: createdAt,
      };
      await deps.repo.createOrder(record);
      const sent = await deliver(deps, record.reference, 'order', ConfirmationCopy.orderSummary(record), record.email, record.phone, now);
      let clientSecret: string | null = null;
      if (record.paymentStatus === 'unpaid' && deps.payments.isConfigured() && Money.meetsStripeMinimum(record.totalPriceCents)) {
        try {
          const intent = await deps.payments.createIntent({
            amountCents: record.totalPriceCents,
            reference: record.reference,
            email: record.email,
          });
          clientSecret = intent.clientSecret;
        } catch {
          ServerLog.error('Payment intent failed.');
        }
      }
      res.status(201).json({
        receipt: ReceiptBuilder.fromOrder(record, sent.email, sent.sms),
        clientSecret,
      });
    } catch {
      ServerLog.error('Order save failed.');
      ApiReply.json(res, 503, 'UNAVAILABLE', 'That request could not be saved. Please try again.');
    }
  }));

  app.get('/api/receipts/:reference', receiptLimiter, asyncRoute(async (req, res) => {
    const reference = RequestParams.one(req.params.reference);
    if (!OrderReference.isValid(reference) || !deps.repo.ready()) {
      ApiReply.json(res, 404, 'NOT_FOUND', 'That receipt was not found.');
      return;
    }
    const consultation = await deps.repo.findConsultation(reference);
    if (consultation) {
      const status = await deps.repo.confirmationStatus(reference);
      res.json({ receipt: ReceiptBuilder.fromConsultation(consultation, status.email, status.sms) });
      return;
    }
    const order = await deps.repo.findOrder(reference);
    if (order) {
      const status = await deps.repo.confirmationStatus(reference);
      res.json({ receipt: ReceiptBuilder.fromOrder(order, status.email, status.sms) });
      return;
    }
    ApiReply.json(res, 404, 'NOT_FOUND', 'That receipt was not found.');
  }));

  app.use('/api/staff', staffLimiter);

  app.get('/api/staff/me', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user) return;
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isApproved: user.isApproved,
      isBanned: user.isBanned,
      portal: RoleGate.portalFor({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned }),
    });
  }));

  app.get('/api/staff/consultations', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    res.json({ consultations: await deps.repo.listConsultations() });
  }));

  app.get('/api/staff/orders', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user) return;
    const portal = RoleGate.portalFor({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned });
    const orders = await deps.repo.listOrders();
    res.json({ orders: portal === 'admin' ? orders : orders.filter((order) => order.assignedProviderUserId === user.id) });
  }));

  app.get('/api/staff/services', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    res.json({ services: await deps.repo.listServices() });
  }));

  app.post('/api/staff/services', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    const service = readService(req.body);
    if (!service) {
      ApiReply.json(res, 400, 'VALIDATION', 'Enter a service name, description, hourly rate, and minimum hours.');
      return;
    }
    await deps.repo.saveService(service);
    res.status(201).json({ service });
  }));

  app.patch('/api/staff/services/:id', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    const body = asRecord(req.body);
    const rate = body?.baseRateCents;
    if (typeof rate !== 'number' || !Number.isInteger(rate) || rate < 0) {
      ApiReply.json(res, 400, 'VALIDATION', 'Enter the hourly rate in cents.');
      return;
    }
    const updated = await deps.repo.updateServiceRate(RequestParams.one(req.params.id), rate);
    if (!updated) {
      ApiReply.json(res, 404, 'NOT_FOUND', 'That service was not found.');
      return;
    }
    res.json({ updated: true });
  }));

  app.get('/api/staff/providers', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    res.json({ providers: await deps.repo.listProviders() });
  }));

  app.post('/api/staff/orders/:reference/assign', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    const providerUserId = asRecord(req.body)?.providerUserId;
    if (typeof providerUserId !== 'string' || !providerUserId) {
      ApiReply.json(res, 400, 'VALIDATION', 'Choose a provider.');
      return;
    }
    const updated = await deps.repo.assignOrder(RequestParams.one(req.params.reference), providerUserId, now().toISOString());
    if (!updated) {
      ApiReply.json(res, 404, 'NOT_FOUND', 'That booking was not found.');
      return;
    }
    res.json({ updated: true });
  }));

  app.post('/api/staff/orders/:reference/status', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user) return;
    const portal = RoleGate.portalFor({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned });
    const status = asRecord(req.body)?.status;
    if (typeof status !== 'string' || !isOrderStatus(status)) {
      ApiReply.json(res, 400, 'VALIDATION', 'Choose a valid visit status.');
      return;
    }
    const reference = RequestParams.one(req.params.reference);
    const order = await deps.repo.findOrder(reference);
    if (!order) {
      ApiReply.json(res, 404, 'NOT_FOUND', 'That booking was not found.');
      return;
    }
    const allowed = status === 'cancelled'
      ? portal === 'admin' && order.status !== 'completed' && order.status !== 'cancelled'
      : VisitStatus.nextProviderAction(order.status)?.status === status;
    if (!allowed) {
      ApiReply.json(res, 403, 'FORBIDDEN', 'That status change is not allowed.');
      return;
    }
    const actor = portal === 'admin' ? null : user.id;
    const updated = await deps.repo.updateOrderStatus(reference, status, actor, now().toISOString());
    if (!updated) {
      ApiReply.json(res, 403, 'FORBIDDEN', 'That status change is not allowed.');
      return;
    }
    res.json({ updated: true });
  }));

  app.post('/api/staff/consultations/:reference/close', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user || !requireAdmin(user, res)) return;
    const updated = await deps.repo.closeConsultation(RequestParams.one(req.params.reference));
    if (!updated) {
      ApiReply.json(res, 404, 'NOT_FOUND', 'That consultation was not found.');
      return;
    }
    res.json({ updated: true });
  }));

  app.post('/api/staff/connect-link', asyncRoute(async (req, res) => {
    const user = await requireStaff(deps, req, res);
    if (!user) return;
    const portal = RoleGate.portalFor({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned });
    if (portal !== 'provider') {
      ApiReply.json(res, 403, 'FORBIDDEN', 'Payout setup is for approved providers.');
      return;
    }
    if (!deps.payments.isConfigured() || !deps.connectCountry || !deps.publicSiteUrl || !deps.repo.supportsProviderAccounts()) {
      ApiReply.json(res, 503, 'UNAVAILABLE', 'Payout setup is not available right now.');
      return;
    }
    if (!/^[A-Z]{2}$/.test(deps.connectCountry)) {
      ApiReply.json(res, 503, 'UNAVAILABLE', 'Payout setup is not available right now.');
      return;
    }
    try {
      const existing = await deps.repo.providerAccount(user.id);
      const link = await deps.payments.createConnectLink({
        email: user.email,
        userId: user.id,
        country: deps.connectCountry,
        refreshUrl: `${deps.publicSiteUrl}/staff`,
        returnUrl: `${deps.publicSiteUrl}/staff`,
        existingAccountId: existing?.stripeAccountId ?? null,
      });
      await deps.repo.saveProviderAccount(user.id, link.accountId);
      res.json({ url: link.url });
    } catch {
      ServerLog.error('Connect link failed.');
      ApiReply.json(res, 503, 'UNAVAILABLE', 'Payout setup is not available right now.');
    }
  }));

  app.use('/api', (_req, res) => {
    ApiReply.json(res, 404, 'NOT_FOUND', 'That address was not found.');
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    ServerLog.error(error instanceof Error ? error.name : 'request error');
    if (res.headersSent) return;
    ApiReply.json(res, 500, 'INTERNAL', 'Something went wrong. Please try again.');
  });

  return app;
}

async function deliver(
  deps: AppDependencies,
  reference: string,
  kind: 'consultation' | 'order',
  summary: string,
  email: string | null,
  phone: string | null,
  now: () => Date,
): Promise<{ email: Receipt['emailConfirmation']; sms: Receipt['smsConfirmation'] }> {
  const subject = ConfirmationCopy.emailSubject(kind, reference);
  const sms = ConfirmationCopy.sms(summary);
  const emailStatus = await sendOne(deps, reference, email, 'email', subject, summary, now);
  const smsStatus = await sendOne(deps, reference, phone, 'sms', null, sms, now);
  return { email: emailStatus, sms: smsStatus };
}

async function sendOne(
  deps: AppDependencies,
  reference: string,
  destination: string | null,
  channel: 'email' | 'sms',
  subject: string | null,
  body: string,
  now: () => Date,
): Promise<Receipt['emailConfirmation']> {
  if (!destination) return 'skipped';
  const status = await deps.confirmations.send({ channel, to: destination, subject, body });
  const record: ConfirmationRecord = {
    reference,
    channel,
    destination,
    subject,
    body,
    status,
    createdAt: now().toISOString(),
  };
  await deps.repo.saveConfirmation(record);
  return status;
}

async function requireStaff(deps: AppDependencies, req: Request, res: Response): Promise<StaffUser | null> {
  if (!deps.auth.ready()) {
    ApiReply.json(res, 503, 'UNAVAILABLE', 'Staff sign-in is unavailable right now. Please try again later.');
    return null;
  }
  if (!deps.repo.ready()) {
    ApiReply.json(res, 503, 'UNAVAILABLE', 'Staff records are unavailable right now. Please try again later.');
    return null;
  }
  const user = await deps.auth.verify(req.header('authorization'));
  if (!user) {
    ApiReply.json(res, 401, 'UNAUTHORIZED', 'Sign in to continue.');
    return null;
  }
  const portal = RoleGate.portalFor({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned });
  if (portal === 'banned') {
    ApiReply.json(res, 403, 'FORBIDDEN', 'This account has been suspended.');
    return null;
  }
  if (portal === 'not-staff' || portal === 'staff-inactive') {
    ApiReply.json(res, 403, 'FORBIDDEN', 'This sign-in is for staff.');
    return null;
  }
  return user;
}

function requireAdmin(user: StaffUser, res: Response): boolean {
  if (RoleGate.canManagePlatform({ role: user.role, is_approved: user.isApproved, is_banned: user.isBanned })) return true;
  ApiReply.json(res, 403, 'FORBIDDEN', 'That action is for staff with admin access.');
  return false;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readService(value: unknown): ServiceRecord | null {
  const body = asRecord(value);
  if (!body) return null;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const baseRateCents = body.baseRateCents;
  const minHours = body.minHours;
  if (!name || name.length > FieldLimits.name || !description || description.length > 500) return null;
  if (typeof baseRateCents !== 'number' || !Number.isInteger(baseRateCents) || baseRateCents < 0) return null;
  if (typeof minHours !== 'number' || !Number.isFinite(minHours) || minHours <= 0 || minHours > 24) return null;
  return {
    id: crypto.randomUUID(),
    name,
    description,
    baseRateCents,
    minHours,
    isActive: true,
  };
}

function isOrderStatus(value: string): value is InquiryStatus {
  return value === 'draft' || value === 'submitted' || value === 'reviewing' || value === 'assigned'
    || value === 'scheduled' || value === 'in_progress' || value === 'completed' || value === 'cancelled';
}
