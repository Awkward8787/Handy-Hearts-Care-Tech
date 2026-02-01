
/**
 * HANDYHEARTS BACKEND ARCHITECTURE
 * --------------------------------
 * This file serves as the specification for the Node.js backend logic.
 * Requirements: Node.js, Express, Stripe, Prisma/Postgres.
 */

/* 
// INSTRUCTIONS FOR SETUP:
// 1. npm init -y
// 2. npm install express stripe jsonwebtoken prisma @prisma/client body-parser cors
// 3. npx prisma init
*/

/*
// .env Template
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
JWT_SECRET=super_secret_handyhearts
*/

import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import { PricingEngine } from '../domain/pricingEngine';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27' as any });

// 1. PAYMENT INTENT ENDPOINT
// Accessed by Family App before showing PaymentSheet
// Added express.json() specifically here to ensure body parsing works for this route
// Fix: Casting express.json() to any to fix RequestHandler type mismatch error
app.post('/payments/create-intent', express.json() as any, async (req: any, res: any) => {
  try {
    // Fix: Access body via any cast to bypass missing property error
    const { serviceId, hours, familyUserId } = req.body;
    
    // In real app, fetch service from DB
    const service = { id: serviceId, name: 'Care', baseRate: 3500, minHours: 2 };
    const quote = PricingEngine.calculate(service as any, hours);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: quote.total,
      currency: 'usd',
      metadata: { 
        familyUserId, 
        serviceId,
        hours: hours.toString() 
      },
      automatic_payment_methods: { enabled: true },
    });

    // Fix: Access methods via any cast to bypass missing property error
    res.json({
      client_secret: paymentIntent.client_secret,
      priceBreakdown: quote
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 2. STRIPE WEBHOOK HANDLER
// Verifies signature and updates database
// Fix: Casting express.raw to any to fix RequestHandler type mismatch error
app.post('/stripe/webhook', express.raw({ type: 'application/json' }) as any, async (req: any, res: any) => {
  const sig = req.headers['stripe-signature']!;
  let event;

  try {
    // Stripe needs the raw body for signature verification
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log('💰 Payment Succeeded:', paymentIntent.id);
    // TODO: Update booking status to PAID in DB
  }

  res.json({ received: true });
});

// 3. ROLE-BASED AUTHORIZATION MIDDLEWARE
const authorize = (roles: string[]) => (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token provided');

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
    if (err || !roles.includes(decoded.role)) {
      return res.status(403).send('Forbidden');
    }
    req.user = decoded;
    next();
  });
};

// 4. ADMIN PROTECTED ROUTES
app.get('/admin/analytics', authorize(['ADMIN']), (req: any, res: any) => {
  res.json({ success: true, message: 'Welcome Admin' });
});

console.log('Server specification loaded.');
