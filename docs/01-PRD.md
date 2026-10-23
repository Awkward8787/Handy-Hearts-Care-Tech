# Product requirements

- Project: HandyHearts Care Tech
- Document title: Product requirements
- Document ID: HH-PRD
- Version: 1.0
- Status: Final (as shipped)
- Date last updated: 2026-10-21 (UTC)
- Author: Cursor cloud agent, for Dondon (owner)
- Repository: https://github.com/Awkward8787/Handy-Hearts-Care-Tech
- Commit described: `d0bdd0c2d4d18144129d93fd37faf5033f96c98f`
- Live URL: none. This repository was not deployed. The public origin recorded in `public/sitemap.xml` and `index.html` is `https://hhcaretech.com`.

## Contents

1. [Summary](#summary)
2. [Background and problem](#background-and-problem)
3. [Goals and non-goals](#goals-and-non-goals)
4. [Success metrics](#success-metrics)
5. [Audience and personas](#audience-and-personas)
6. [User stories](#user-stories)
7. [Functional requirements](#functional-requirements)
8. [Non-functional requirements](#non-functional-requirements)
9. [Content requirements](#content-requirements)
10. [Monetization or payments](#monetization-or-payments)
11. [Scope by release](#scope-by-release)
12. [Assumptions and constraints](#assumptions-and-constraints)
13. [Risks](#risks)
14. [Stakeholders and approvals](#stakeholders-and-approvals)
15. [Glossary](#glossary)
16. [Open questions](#open-questions)
17. [Changelog](#changelog)
18. [Sources](#sources)

## Summary

HandyHearts Care Tech lets a visitor request technology help for an older adult without creating an account. The visitor can request a consultation or book a service by leaving a name, an email or a phone number, the topic or service, a preferred date and time, and an address when someone is coming to the home. The product returns a receipt with an order reference. Email and text confirmations are sent when those delivery services are configured. Staff and providers sign in on a separate internal path.

## Background and problem

Families need someone to set up a phone, computer, television, printer, or home Wi-Fi, or to sit with an older adult who is learning a device. The previous code in this repository required a customer account, offered a public path that could create an administrator, and mixed a client-side assistant into the family portal. Dondon, the owner, required a different rule for this work and for this document: public customers of Handy Hearts must not need their own account, login, or private session. A visitor must be able to request a consultation or buy or book a service as a guest, with only the contact and booking details needed. Confirmations stay by email or text, plus a receipt. Staff sign-in, if it exists, stays internal.

The product name in the interface is HandyHearts. The owner’s wording in the request is “Handy Hearts.” This document uses HandyHearts for the product mark and quotes the owner’s wording only in this background.

## Goals and non-goals

### Goals

1. A guest can request a consultation without an account. Shipped. Implements FR-001.
2. A guest can book a service without an account. Shipped. Implements FR-002.
3. Every saved request has a reference and a receipt the guest can open again. Shipped. Implements FR-003.
4. Email and text confirmations are attempted when delivery is configured, and the receipt is still saved when it is not. Shipped. Implements FR-004.
5. A price is quoted only from a staff-entered rate whose name matches the catalog. Shipped. Implements FR-005.
6. Staff and approved providers can sign in and work assigned visits. Shipped. Implements FR-007.

### Non-goals

1. Customer accounts, customer passwords, and a private customer session. Removed.
2. A family portal, a device wizard that requires a signed-in user, and a client-side assistant. Removed.
3. Inventing a legal entity, support email, mailing address, governing law, retention period, business time zone, platform-fee percentage, or service price. Those stay with the owner.
4. Deploying the site, submitting the iOS app, or charging a real card from this repository.

## Success metrics

No analytics product is installed. Success for this release is observed manually:

| Signal | Method | Target |
| --- | --- | --- |
| Guest consultation saved | A `consultation_request` row or a file-store consultation, plus a receipt reference | No numeric target. UNCONFIRMED as a business goal. |
| Guest booking saved | A `service_order` row or a file-store order, plus a receipt | No numeric target. |
| Confirmation delivered | `confirmation_message.status = sent` | Depends on SMTP and Twilio, which are not configured in this repository. |
| Payment recorded | `payment_status = paid` after a verified Stripe notice | Only when Stripe is configured and a rate is on file. |
| Forced customer sign-up | Review of `/`, `/consult`, and `/book` | Must stay absent. Verified in `web/guestHome.test.tsx` and in the browser on 2026-10-21. |

## Audience and personas

| Persona | Context | Need | Device | Comfort | Accessibility |
| --- | --- | --- | --- | --- | --- |
| Guest requester | A family member or the older adult, arranging help | Submit a request with the least information that lets someone call or write back | Phone or computer browser. iOS app is in the repo and was not run in a simulator here. | Varies. The form uses plain labels. | 44px targets, visible focus, skip link, reduced motion. |
| Staff admin | Internal operator | See consultations and bookings, add rates, assign a provider | Desktop browser, `/staff` | Comfortable with a sign-in form | Same visual system. |
| Provider | Person who performs the visit | See assigned visits and move them from assigned to in progress to completed | Phone or desktop, `/staff` | Comfortable with a short task list | Same visual system. |

Age ranges are not stored. The audience described in the home page is “technology help for an older adult.” A numeric age band was not supplied by the owner and is UNCONFIRMED.

## User stories

### US-001 Guest consultation

As a guest, I want to request a consultation with my name, a way to reach me, a topic, and a time, so that someone can follow up without my creating an account.

- Given I am on `/consult` and I am not signed in
- When I enter a name, an email or a phone number, a topic, and a date that is today or later, and I choose Request consultation
- Then I see a receipt whose reference starts with `HH-` and the page does not ask me to sign in

### US-002 Guest booking

As a guest, I want to book a service, including an address for an in-home visit, so that the visit can be scheduled.

- Given I am on `/book`
- When I review the booking and choose Place booking
- Then a receipt is saved, payment is taken only when a quoted total is at least $0.50 and card payment is available, and otherwise the receipt says no payment was taken

### US-003 Receipt lookup

As a guest, I want to open my receipt later with the reference, so that I still have the confirmation without an account.

- Given I have a reference
- When I open `/receipt` and submit it, or open `/receipt/HH-…`
- Then I see the same summary, or “That receipt was not found.”

### US-004 Staff work

As staff, I want a sign-in that guests never have to use, so that I can assign visits and set rates.

- Given I have an approved admin profile
- When I sign in at `/staff`
- Then I can list consultations and bookings and assign a provider

## Functional requirements

| ID | Requirement | Priority | Status | Stories | Where |
| --- | --- | --- | --- | --- | --- |
| FR-001 | A guest can submit a consultation with name, email or phone, topic, preferred date, preferred time, and optional notes. No account. | Must | Shipped | US-001 | `web/pages/ConsultPage.tsx`, `POST /api/consultations` |
| FR-002 | A guest can book a catalog service with the same contact fields, urgency, in-home or remote, and an address when in-home. | Must | Shipped | US-002 | `web/pages/BookPage.tsx`, `POST /api/orders` |
| FR-003 | Each saved consultation or booking gets a reference `HH-` plus 10 characters, and a receipt page. | Must | Shipped | US-001, US-003 | `domain/orderReference.ts`, `GET /api/receipts/:reference` |
| FR-004 | Email and text are sent when configured. The receipt states that a message was sent only when the status is `sent`. | Must | Shipped | US-001 | `server/confirmationSender.ts`, `web/pages/ReceiptPage.tsx` |
| FR-005 | A price is calculated only when an active service name matches the catalog label. Otherwise the total is 0 and payment status is `not_due`. | Must | Shipped | US-002 | `domain/quoteBuilder.ts` |
| FR-006 | When the quote is at least 50 cents and Stripe is configured, the server creates a PaymentIntent and the browser can collect the card. | Must | Shipped | US-002 | `server/payments.ts`, `web/pages/BookPage.tsx` |
| FR-007 | Staff sign-in uses Supabase and is linked from the footer as Staff. The home page has no sign-in. | Must | Shipped | US-004 | `web/pages/StaffPage.tsx`, `web/components/PublicLayout.tsx` |
| FR-008 | A provider can apply at `/staff`. The application is not a customer account and is not an admin. | Should | Shipped | US-004 | `web/pages/StaffPage.tsx`, SQL trigger |
| FR-009 | An admin assigns a provider. A provider can start a visit and mark it complete. An admin can cancel a visit that is not completed or cancelled. | Should | Shipped | US-004 | `server/createApp.ts` |
| FR-010 | Privacy and terms pages explain the guest record, payment, and the unpublished operator identity. | Must | Shipped | US-001 | `web/pages/LegalPages.tsx` |
| FR-011 | The services page lists the five catalog categories and a live rate only when the name matches. | Must | Shipped | US-002 | `web/pages/ServicesPage.tsx` |
| FR-012 | Unknown paths show “Page not found.” | Must | Shipped | US-003 | `web/pages/LegalPages.tsx` |

## Non-functional requirements

| ID | Requirement | Status |
| --- | --- | --- |
| NFR-001 | Web typecheck, lint, Vitest, and production build run in GitHub Actions on Node 22. | Shipped. `.github/workflows/ci.yml` |
| NFR-002 | Touch targets use a 44px minimum (`.btn` in `index.css`). Focus is a 3px `#2563eb` ring. | Shipped |
| NFR-003 | Text contrast: `#2563eb` on white is 5.17:1 (WCAG AA). `#1d4ed8` on white is 6.70:1. `#475569` on white is 7.58:1. `#047857` on white is 5.48:1 and is used for provider-application notice text. `#10b981` is a fill, not body text on white. | Shipped |
| NFR-004 | `prefers-reduced-motion: reduce` shortens animation and turns off smooth scrolling. | Shipped. `index.css` |
| NFR-005 | Security headers are set by Helmet. The content security policy is in HH-TRD. HSTS max-age is 15552000 seconds, without includeSubDomains and without preload. | Shipped |
| NFR-006 | Guest POSTs are limited to 30 per 15 minutes, receipt GETs to 60, and `/api/staff` to 120, in production. | Shipped |
| NFR-007 | Guest personal data is written by the server with the service role, or by the local file store. The browser anon key cannot list those tables. | Shipped in SQL grants. The migration must be applied by the owner. |
| NFR-008 | Public pages have titles, descriptions, a canonical URL, and an Open Graph image. Staff, receipts, and the 404 are `noindex`. | Shipped |
| NFR-009 | The production build of commit `d0bdd0c` splits the booking and staff pages. Measured sizes: main JS 255,285 bytes, booking JS 20,041 bytes, staff JS 237,887 bytes, CSS 25,364 bytes. | Shipped |
| NFR-010 | English only. No other locale is shipped. | Shipped |
| NFR-011 | Browsers: current Chromium was used for the guest flows on 2026-10-21. A formal support matrix is in HH-TRD. | Shipped as far as that check |
| NFR-012 | Card numbers are entered in Stripe, not stored by HandyHearts. | Shipped |

NFR-009 was measured after `App.tsx` started lazy-loading the booking and staff pages. If that edit is in a commit after `d0bdd0c`, the measurement belongs to that later commit. The documents’ changelog records which commit contains the split.

## Content requirements

| Page | Purpose | Key copy |
| --- | --- | --- |
| `/` | Offer the two guest actions | “Request help without creating an account.” |
| `/services` | Explain the five services | “A price is shown only when a rate is on file for that service.” |
| `/consult` | Guest consultation form | “No account needed.” Button: “Request consultation” |
| `/book` | Guest booking form | “No account needed.” Buttons: “Review booking”, “Place booking” |
| `/receipt` | Look up a reference | “No account is required.” |
| `/privacy` | What a guest record stores | Operator legal name, address, and support email are stated as not published yet |
| `/terms` | Price rules and payment rules | Weekend 15%, same day $25, expedited $15, emergency $25 |
| `/staff` | Internal sign-in | “This sign-in is for staff and providers.” |

Tone is plain. Customer pages do not mention environment variables, terminals, or setup steps.

## Monetization or payments

The model is a one-time quoted visit, not a subscription and not an advertisement. Currency is US dollars (`Money.currency` is `usd`). There is no seeded price. A rate exists only after an admin adds a service whose name matches a catalog label: Device Setup, Fix/Repair, Learning, WiFi/Network, or Printers.

When a rate matches, the quote is `max(hours, minHours) * hourly rate`, and the hours used for a booking are the service minimum hours. A weekend adds 15% of that base, rounded to the nearest cent. The same civil day adds $25. Expedited (`medium`) adds $15. Emergency (`high` or `emergency`) adds $25. Same-day and emergency can both apply. If nothing matches, the receipt says the price is to be confirmed and no payment is taken.

Stripe automatic capture is used when the total is at least 50 cents and the server secret is set. The legal entity that receives the funds is UNCONFIRMED. Platform fee and provider payout are stored as 0. Refund copy is not published. Tax calculation is not implemented.

## Scope by release

| Item | Release | Status |
| --- | --- | --- |
| Guest consultation, guest booking, receipt, staff desk | This repository | Shipped |
| iOS guest screens calling the same API | This repository, not compiled here | Shipped as source |
| Operator legal identity on the legal pages | Owner | Deferred |
| Analytics | Not chosen | Deferred |
| Structured device and accessibility fields | Removed from the guest form. Notes remain. | Removed from the running flow |
| Customer account | Owner decision | Removed |

## Assumptions and constraints

- The owner supplies Supabase, Stripe, SMTP, Twilio, the Apple team, and the legal text. This repository ships names only in the example env files.
- The business time zone defaults to `UTC` until the owner sets `BUSINESS_TIMEZONE` and `VITE_BUSINESS_TIMEZONE` to the same IANA name.
- Hosting for `hhcaretech.com` is not recorded as a verified fact in the current code. An older comment in the prior tree is not treated as a current hosting contract.
- No timeline was requested. This document does not estimate one.

## Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| A receipt reference is the capability to read a guest’s contact details | Medium | High | The reference is 10 characters from a 32-character alphabet. Receipt reads are rate limited. The owner can add a second check later. |
| Legal pages ship without an operator identity | High until the owner publishes it | High for a public launch | Launch checklist blocks public launch. |
| Production starts without Supabase and without `DATA_DRIVER=file` | Medium | Guest writes return 503 | Health reports `guestStore: false`. README states the rule. |
| A previously committed Stripe publishable key remains usable | Unknown | Payments or reputation | Owner rotates it. The value is not repeated here. |

## Stakeholders and approvals

Dondon is the owner and the decision-maker for the guest rule. This document records that decision. No separate written sign-off beyond the request in this task is on file.

## Glossary

| Term | Meaning |
| --- | --- |
| Guest | A visitor with no HandyHearts account. |
| Reference | Public id shaped `HH-` plus 10 characters. It identifies one consultation or one booking. |
| Receipt | The page and payload the guest keeps. It includes the summary and the payment line. |
| Catalog | The five bookable services in `domain/serviceCatalog.ts`. Consultation also offers “Not sure yet.” |
| Staff | An `ADMIN` or `PROVIDER` row in `app_user`. |
| Priced | A booking whose service name matched an active rate. |

## Open questions

| Question | Owner | Blocked until answered |
| --- | --- | --- |
| Legal name, mailing address, support email, governing law, and retention period. UNCONFIRMED. | Dondon | Public launch of the privacy policy and terms. |
| Business IANA time zone. UNCONFIRMED. Code default is UTC. | Dondon | Same-day and weekend quotes for a real city. |
| Platform-fee split. UNCONFIRMED. Stored as 0. | Dondon | Provider payout amounts. |
| Whether a phone without `+` should assume a country. UNCONFIRMED. The code does not add a country prefix. | Dondon | Text delivery for national numbers. |
| Whether structured device fields should return. UNCONFIRMED. | Dondon | A richer intake form. |
| Who receives Stripe funds. UNCONFIRMED. | Dondon | Live charges. |

## Changelog

| Date | Version | Change |
| --- | --- | --- |
| 2026-10-21 | 1.0 | First final PRD. Customer accounts removed because Dondon required guest consultation and guest booking. |

## Sources

- Owner request in this task, including the guest rule from Dondon
- `d0bdd0c2d4d18144129d93fd37faf5033f96c98f`
- `web/pages/HomePage.tsx`, `ConsultPage.tsx`, `BookPage.tsx`, `LegalPages.tsx`, `StaffPage.tsx`
- `domain/guestRequest.ts`, `domain/pricingEngine.ts`, `domain/quoteBuilder.ts`
- Browser check on 2026-10-21 against `http://127.0.0.1:3000` with the file store
