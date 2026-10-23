export class Money {
  static readonly currency = 'usd';
  /** Stripe's minimum charge for USD card payments, in cents. */
  static readonly stripeMinimumCents = 50;

  static meetsStripeMinimum(cents: number): boolean {
    return Number.isInteger(cents) && cents >= Money.stripeMinimumCents;
  }
}
