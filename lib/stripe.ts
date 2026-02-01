

/**
 * HANDYHEARTS STRIPE INFRASTRUCTURE
 * This utility manages the frontend connection to Stripe.
 */

// Replace this with your actual Publishable Key from the Stripe Dashboard
// Fix: Added quotes around the key to resolve the "Cannot find name" error.
const STRIPE_PUBLISHABLE_KEY = 'pk_live_CCg4la4IJkhKq3qE1zO1ujsI00bqA2q5vj';

let stripePromise: any = null;

export const getStripe = async () => {
  if (!stripePromise) {
    // @ts-ignore - Stripe is loaded via CDN in index.html
    if (window.Stripe) {
      // @ts-ignore
      stripePromise = window.Stripe(STRIPE_PUBLISHABLE_KEY);
    } else {
      console.error('Stripe.js failed to load. Check index.html script tags.');
    }
  }
  return stripePromise;
};
