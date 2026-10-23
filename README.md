<p align="center">
  <img src="docs/banner.png" alt="HandyHearts Care Tech" width="100%">
</p>

# HandyHearts Care Tech

Technology help for an older adult. A visitor can request a consultation or book a service without creating an account. Staff sign-in is a separate, internal path.

The public site name in the sitemap is [hhcaretech.com](https://hhcaretech.com). This repository does not deploy that site.

## What you need

- Node.js 22 (see `.nvmrc`). Node 20 or newer matches `engines`.
- npm 10, which ships with Node 22.
- For the iOS app: Xcode 16 on a Mac, an Apple Developer team, and the Stripe iOS package resolved by the Xcode project.

## Install

```bash
npm ci
```

## Environment

Copy the example files and leave values empty until you have them. Do not commit filled copies.

```bash
cp .env.example .env.local
cp server/.env.example server/.env
```

The browser only receives names that start with `VITE_`. The service-role key, Stripe secret, webhook secret, SMTP password, and Twilio token stay on the server.

| Name | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | web | Staff sign-in only |
| `VITE_SUPABASE_ANON_KEY` | web | Staff sign-in only |
| `VITE_STRIPE_PUBLISHABLE_KEY` | web | Card form, when a booking has a quoted price |
| `VITE_API_BASE_URL` | web | API origin. Empty uses the same origin |
| `VITE_BUSINESS_TIMEZONE` | web | Same-day and weekend pricing. Default `UTC` |
| `VITE_PUBLIC_SITE_URL` | web | Canonical origin. Default `https://hhcaretech.com` |
| `PORT` | server | Listen port. Default `3000` |
| `CORS_ORIGINS` | server | Allowed browser origins. Default `http://localhost:5173` |
| `TRUST_PROXY` | server | `true` or `1` behind a reverse proxy |
| `BUSINESS_TIMEZONE` | server | Must match the web time zone. Default `UTC` |
| `PUBLIC_SITE_URL` | server | Provider payout return URL. Default `https://hhcaretech.com` |
| `DATA_DRIVER` | server | `supabase` or `file`. See below |
| `SUPABASE_URL` | server | Staff token check and the guest store |
| `SUPABASE_ANON_KEY` | server | Staff token check |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Guest records and staff profile reads |
| `STRIPE_SECRET_KEY` | server | Payment intents |
| `STRIPE_WEBHOOK_SECRET` | server | `payment_intent.succeeded` notices |
| `STRIPE_CONNECT_COUNTRY` | server | ISO country for provider payout accounts |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` | server | Email is attempted only when all three are set |
| `SMTP_USER`, `SMTP_PASS` | server | Optional SMTP auth |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | server | Text is attempted only when all three are set |

Guest writes use Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set (or when `DATA_DRIVER=supabase` and those two are set). Otherwise a non-production process uses `server/data/store.json`. That path is next to the server package, including when `npm start` runs from the server workspace. Production without those keys refuses guest writes unless `DATA_DRIVER=file` is set on purpose. `server/data/` is gitignored.

Set `BUSINESS_TIMEZONE` and `VITE_BUSINESS_TIMEZONE` to the same IANA name. The code default is `UTC`. Do not assume a city time zone.

## Run locally

Two processes. The Vite dev server proxies `/api` to port 3000.

```bash
npm run dev:server
npm run dev
```

Open `http://localhost:5173`. Consultation is `/consult`. Booking is `/book`. Staff sign-in is `/staff`.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run build:server
```

`npm test` runs Vitest and `node scripts/check-ios.mjs`. The iOS script checks the Xcode project, privacy manifest, icons, and guest screens. It does not compile Swift. Compile on a Mac:

```bash
xcodebuild -project ios/HandyHearts.xcodeproj -scheme HandyHearts -destination 'generic/platform=iOS Simulator' -configuration Debug build CODE_SIGNING_ALLOWED=NO
```

Register the bundle id `com.hhcaretech.handyhearts` and set the Apple team id in Xcode before a signed build. Copy `ios/Config.example.xcconfig` values into `ios/Config.local.xcconfig` (gitignored). The local file is included after the empty assignments so it can override them.

## Production process

This repo does not deploy itself.

```bash
npm run build
npm run build:server
npm start
```

`npm start` serves the API and, when `dist/index.html` exists, the built site. Put TLS and a reverse proxy in front of it if you publish it. Set `TRUST_PROXY` when the proxy is trusted. Set `NODE_ENV=production`.

## Database

Apply `supabase/migrations/20261021000000_guest_records.sql` in the Supabase SQL editor or CLI. It creates guest consultation and booking tables keyed by an order reference and contact details. Those tables have no customer user id. Staff and provider profiles live in `app_user`. Signup metadata cannot create an admin. Promote an admin yourself after you create that person's auth user:

```sql
insert into public.app_user (id, email, name, role, is_approved, is_banned)
values ('<auth user uuid>', '<email>', '<name>', 'ADMIN', true, false);
```

No service prices are seeded. An admin adds rates from `/staff`. Until a rate matches a catalog name, a booking receipt says the price is to be confirmed and no payment is taken.

## Owner actions before a public launch

- Rotate any Stripe key that was previously committed in this repository, then set the new publishable, secret, and webhook values.
- Confirm which Supabase project is in use, set its URL, anon key, and service-role key, and apply the migration.
- Promote one admin with the SQL above, using that person's own email.
- Choose `BUSINESS_TIMEZONE` and set the same value on the web and the server.
- Set `STRIPE_CONNECT_COUNTRY` before provider payout links.
- Set SMTP and Twilio values before email and text confirmations can send. A receipt is still saved when they are unset.
- Register `com.hhcaretech.handyhearts`, set the Apple team, and fill `ios/Config.local.xcconfig`.
- Publish the legal name, mailing address, support email, governing law, and retention period on the privacy and terms pages. Those facts are not in this repo.
- Decide the platform-fee split. The code stores the fee and the provider payout as `0`.
- Have counsel review the privacy policy and terms before the site is public.

## Product paths

| Path | Who |
| --- | --- |
| `/`, `/services`, `/consult`, `/book`, `/privacy`, `/terms` | Anyone, no account |
| `/receipt`, `/receipt/HH-…` | Anyone with the reference |
| `/staff` | Staff and providers only |

## License

All rights reserved.
