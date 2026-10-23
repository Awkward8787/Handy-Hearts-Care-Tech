import Stripe from 'stripe';
import { Money } from '../domain/money';

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
}

export interface PaymentEvent {
  type: string;
  reference: string | null;
  amountCents: number | null;
  id: string | null;
}

export interface ConnectLink {
  url: string;
  accountId: string;
}

export interface PaymentGateway {
  isConfigured(): boolean;
  webhooksConfigured(): boolean;
  createIntent(input: { amountCents: number; reference: string; email: string | null }): Promise<PaymentIntentResult>;
  constructEvent(rawBody: Buffer, signature: string | undefined): PaymentEvent;
  createConnectLink(input: {
    email: string;
    userId: string;
    country: string;
    refreshUrl: string;
    returnUrl: string;
    existingAccountId: string | null;
  }): Promise<ConnectLink>;
}

export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe | null;

  constructor(
    secretKey: string | undefined,
    private readonly webhookSecret: string | undefined,
  ) {
    this.stripe = secretKey ? new Stripe(secretKey, { apiVersion: '2025-08-27.basil' }) : null;
  }

  isConfigured(): boolean {
    return this.stripe !== null;
  }

  webhooksConfigured(): boolean {
    return this.stripe !== null && Boolean(this.webhookSecret);
  }

  async createIntent(input: { amountCents: number; reference: string; email: string | null }): Promise<PaymentIntentResult> {
    if (!this.stripe || !Money.meetsStripeMinimum(input.amountCents)) {
      throw new Error('PAYMENTS_UNAVAILABLE');
    }
    const intent = await this.stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: Money.currency,
      receipt_email: input.email ?? undefined,
      metadata: { reference: input.reference },
      automatic_payment_methods: { enabled: true },
    }, { idempotencyKey: `order-${input.reference}-${input.amountCents}` });
    if (!intent.client_secret) throw new Error('PAYMENTS_UNAVAILABLE');
    return { id: intent.id, clientSecret: intent.client_secret };
  }

  constructEvent(rawBody: Buffer, signature: string | undefined): PaymentEvent {
    if (!this.stripe || !this.webhookSecret || !signature) throw new Error('WEBHOOK_UNAVAILABLE');
    const event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    if (event.type !== 'payment_intent.succeeded') {
      return { type: event.type, reference: null, amountCents: null, id: null };
    }
    const intent = event.data.object;
    return {
      type: event.type,
      reference: intent.metadata.reference || null,
      amountCents: intent.amount_received || intent.amount,
      id: intent.id,
    };
  }

  async createConnectLink(input: {
    email: string;
    userId: string;
    country: string;
    refreshUrl: string;
    returnUrl: string;
    existingAccountId: string | null;
  }): Promise<ConnectLink> {
    if (!this.stripe) throw new Error('PAYMENTS_UNAVAILABLE');
    const accountId = input.existingAccountId ?? (await this.stripe.accounts.create({
      type: 'express',
      country: input.country,
      email: input.email,
      capabilities: { transfers: { requested: true } },
      metadata: { userId: input.userId },
    })).id;
    const link = await this.stripe.accountLinks.create({
      account: accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: 'account_onboarding',
    });
    return { url: link.url, accountId };
  }
}
