import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { SchedulePricing } from '../domain/schedulePricing';
import { DeliveryConfirmationSender } from './confirmationSender';
import { createApp } from './createApp';
import { FileGuestRepository } from './fileRepository';
import { StripePaymentGateway } from './payments';
import { GuestRepository } from './repository';
import { ServerLog } from './serverLog';
import { SupabaseStaffAuth } from './staffAuth';
import { SupabaseGuestRepository } from './supabaseRepository';
import { UnavailableRepository } from './unavailableRepository';

const here = path.dirname(fileURLToPath(import.meta.url));
for (const candidate of [path.resolve(here, '.env'), path.resolve(here, '../.env'), path.resolve(here, '../../.env')]) {
  dotenv.config({ path: candidate });
}
dotenv.config();

function chooseRepository(): GuestRepository {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const driver = process.env.DATA_DRIVER;
  if ((driver === 'supabase' || !driver) && supabaseUrl && serviceRoleKey) {
    return new SupabaseGuestRepository(supabaseUrl, serviceRoleKey);
  }
  if (driver === 'file' || (!driver && process.env.NODE_ENV !== 'production')) {
    const storeFile = path.basename(here) === 'dist'
      ? path.resolve(here, '../data/store.json')
      : path.resolve(here, 'data/store.json');
    return new FileGuestRepository(storeFile);
  }
  return new UnavailableRepository();
}

const timeZone = process.env.BUSINESS_TIMEZONE && SchedulePricing.isTimeZone(process.env.BUSINESS_TIMEZONE)
  ? process.env.BUSINESS_TIMEZONE
  : SchedulePricing.DEFAULT_TIME_ZONE;

const app = createApp({
  repo: chooseRepository(),
  auth: new SupabaseStaffAuth(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY),
  payments: new StripePaymentGateway(process.env.STRIPE_SECRET_KEY, process.env.STRIPE_WEBHOOK_SECRET),
  confirmations: new DeliveryConfirmationSender(process.env),
  rateLimit: true,
  timeZone,
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((origin) => origin.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1',
  publicSiteUrl: (process.env.PUBLIC_SITE_URL ?? 'https://hhcaretech.com').replace(/\/$/, ''),
  connectCountry: process.env.STRIPE_CONNECT_COUNTRY?.trim().toUpperCase() || null,
});

const distCandidates = [path.resolve(here, '../dist'), path.resolve(here, '../../dist')];
const dist = distCandidates.find((candidate) => existsSync(path.join(candidate, 'index.html')));
if (dist) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const port = Number(process.env.PORT);
const listenPort = Number.isInteger(port) && port > 0 ? port : 3000;
app.listen(listenPort, () => {
  ServerLog.info(`HandyHearts server listening on port ${listenPort}`);
});
