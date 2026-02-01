
# HandyHearts Care Tech: App Store Readiness

## 1. Stripe vs IAP
- **Strict Compliance**: Since HandyHearts sells **real-world in-person services** (Care, Tech Assistance, Errands), we use **Stripe**.
- Apple Reviewers often flag apps for not using IAP. 
- **Resolution**: We must clearly state in the "App Review Information" notes that the app is for ordering physical world services, which is exempt from IAP under App Store Review Guideline 3.1.3(e).

## 2. Privacy Policy
- Data collected: Name, Email, Phone, Address (for service delivery), Location (for provider matching).
- Payment data is handled entirely by Stripe (PCI Compliance).

## 3. Security
- Tokens stored in **Keychain**.
- HTTPS required for all endpoints.
- Root detection recommended for banking-level security.

## 4. Testing Plan
- **PricingEngineTests**: Unit tests ensuring deterministic pricing.
- **RoleGateTests**: Verification that a Provider account cannot access Admin routes.
- **StripeMockTests**: Integration tests for payment intent flow using Stripe test cards.

## 5. UI/UX
- Support **Dynamic Type** for seniors/families.
- 44pt minimum tap targets.
- Dark mode support throughout.
