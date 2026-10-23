# App Store readiness

HandyHearts Care Tech is a real-world service app. Guests request a consultation or book a visit. They do not create an account. Card payment, when a price is on file and Stripe is configured, uses Stripe PaymentSheet. That matches App Store Review Guideline 3.1.3(e) for goods and services used outside the app. The app does not use In-App Purchase.

This file describes the project that is in the repository. It is not a claim that Apple has reviewed a build.

## Identity

| Item | Value |
| --- | --- |
| Display name | HandyHearts |
| Bundle id | `com.hhcaretech.handyhearts` |
| Version | 1.0.0 (1), same as the root `package.json` |
| Deployment target | iOS 15.0 |
| Devices | iPhone and iPad |
| URL scheme | `handyhearts` |
| Interface | Light |
| Export compliance | `ITSAppUsesNonExemptEncryption` is false |
| Apple team | Not set. The owner registers the bundle id and fills the team in Xcode. |

## What the first screen does

The first screen offers consultation, booking, and receipt lookup. Staff sign-in is a later link. A guest is not asked to create an account.

## Payments

`StaffViews.swift` sets `StripeAPI.defaultPublishableKey`, `merchantDisplayName` to HandyHearts Care Tech, and `returnURL` to `handyhearts://stripe-redirect`. The sheet is created with `PaymentSheet(paymentIntentClientSecret:configuration:)`, which matches the client secret returned by `POST /api/orders`. The package is `https://github.com/stripe/stripe-ios-spm` at exact version 26.14.0, product `StripePaymentSheet`.

The camera usage string is present because PaymentSheet can offer card scan: "The camera is used only if you choose to scan a card." The app does not request location.

## Privacy

`PrivacyInfo.xcprivacy` sets tracking to false. Collected types are email, name, phone, physical address, payment info, and other user content, each linked and used for app functionality. There is no user-id type, because a guest has no account. The staff access token is stored in the keychain (`StaffKeychain.swift`), not in UserDefaults.

## What this environment did not do

The iOS project was checked with `node scripts/check-ios.mjs`. It was not compiled, and it was not run in a simulator, because this workspace is Linux. A signed archive still needs the owner's Apple team.

## Before submission

- Fill `ios/Config.local.xcconfig` with the API origin, staff Supabase URL and anon key, and the Stripe publishable key.
- Point the API at the same guest endpoints the website uses.
- Confirm the legal entity, support URL, and privacy policy URL in App Store Connect. The in-app privacy facts match `web/pages/LegalPages.tsx`, and the operator's legal name is still unpublished.
- Do not mark the app as using location, tracking, or customer accounts.
