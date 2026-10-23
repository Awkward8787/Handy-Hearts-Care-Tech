<p align="center">
  <img src="assets/banner.png" alt="HandyHearts Care Tech" width="100%">
</p>

# HandyHearts Care Tech

**Care-services platform UI for Families, Providers, and Admins, with pricing engine hooks and Stripe + Supabase wiring.**

[![License: All Rights Reserved](https://img.shields.io/badge/license-all%20rights%20reserved-lightgrey)](#license)
![Vite](https://img.shields.io/badge/Vite-646CFF&logo=vite&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E&logo=supabase&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-635BFF&logo=stripe&logoColor=white)

Vite/React front end plus a small Express server under `server/`. Includes family, provider, and admin portals and a service-request wizard. Stock AI Studio README was replaced.


## How it works

```mermaid
flowchart LR
  F[Families] --> UI[Vite care portal]
  P[Providers] --> UI
  A[Admins] --> UI
  UI --> SB[(Supabase)]
  UI -.->|Stripe hooks| Pay[Payments]
```

Multi-role care-services UI with pricing-engine hooks. Supabase + Stripe wiring present; treat as product UI / prototype unless a live deploy is confirmed.

## Features

- Multi-role portals (Family, Provider, Admin)
- Deterministic pricing engine module (`domain/pricingEngine.ts`)
- Stripe and Supabase client stubs
- Separate Express server for Stripe webhook / JWT

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS
- Supabase JS
- Stripe
- Optional @google/genai
- Express server

## How to run

```bash
npm install
npm run dev
```

Server:
```bash
cd server && npm install && npm start
```

Set server env from `server/.env.example` (names only: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET`, `PORT`). Front-end Gemini key goes in `.env.local` as `GEMINI_API_KEY` if used.

## Environment variables

Names only. Never commit values.

- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `JWT_SECRET`
- `PORT`

## Status

Public. Early platform scaffold. Not production-hardened.

## License

All rights reserved.
