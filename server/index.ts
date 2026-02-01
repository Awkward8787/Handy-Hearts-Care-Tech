
import express from 'express';
import Stripe from 'stripe';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { PricingEngine } from '../domain/pricingEngine';

// Load environment variables from .env file
dotenv.config();

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27' as any });

app.use(cors());

// 1. PAYMENT INTENT ENDPOINT
app.post('/payments/create-intent', express.json() as any, async (req: any, res: any) => {
  try {
    const { serviceId, hours, familyUserId } = req.body;
    
    // Logic for hhcaretech.com pricing
    const service = { id: serviceId, name: 'Care Service', baseRate: 3500, minHours: 2 };
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

    res.json({
      client_secret: paymentIntent.client_secret,
      priceBreakdown: quote
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 2. WEBHOOKS
app.post('/stripe/webhook', express.raw({ type: 'application/json' }) as any, async (req: any, res: any) => {
  const sig = req.headers['stripe-signature']!;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    console.log('💰 HandyHearts: Payment Received');
  }
  res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`HandyHearts Node Server running on port ${PORT}`);
});
