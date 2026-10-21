export function PrivacyPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-lg">
      <h1 className="text-4xl font-black">Privacy policy</h1>
      <p>HandyHearts Care Tech helps families arrange technology help. You do not need an account to request a consultation or book a visit.</p>
      <h2 className="text-2xl font-black">Information you provide</h2>
      <p>A consultation or booking stores your name, the email or phone number you enter, the service or topic, the preferred date and time, notes you type, and an address when the visit is in the home. The record is keyed by that contact information and a reference such as HH- followed by letters and numbers. It is not attached to a customer account.</p>
      <h2 className="text-2xl font-black">Payment</h2>
      <p>When a price is on file and card payment is available, the card details are entered into Stripe. HandyHearts stores the amount and a payment reference. It does not store the card number.</p>
      <h2 className="text-2xl font-black">Who else handles it</h2>
      <p>Account sign-in for staff uses Supabase. Guest requests are stored by the HandyHearts service. Email and text confirmations are sent only when those delivery services are connected. Stripe processes card payments. The software does not include a feature that sells personal information.</p>
      <h2 className="text-2xl font-black">How long it is kept</h2>
      <p>Consultation, booking, and confirmation records are kept until the operator deletes them. A fixed retention period has not been set.</p>
      <h2 className="text-2xl font-black">Who operates the service</h2>
      <p>The public site name is HandyHearts Care Tech, at hhcaretech.com. The legal name, mailing address, and support email of the operator are not published on this page yet.</p>
    </main>
  );
}

export function TermsPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl space-y-6 px-4 py-12 text-lg">
      <h1 className="text-4xl font-black">Terms of use</h1>
      <p>These terms cover requesting a consultation and booking a visit on HandyHearts. You do not need an account to do either one.</p>
      <h2 className="text-2xl font-black">Requests</h2>
      <p>A consultation asks HandyHearts to follow up about a topic. A booking asks for a service at a preferred date and time. An in-home booking needs an address. You must leave an email or a phone number. The receipt reference is how you look the request up later.</p>
      <h2 className="text-2xl font-black">Price</h2>
      <p>When a rate is on file, the price is the hourly rate times the service minimum hours, in US dollars. A weekend adds 15% of that base amount, rounded to the nearest cent. The same calendar day adds $25. Expedited adds $15. Emergency adds $25. If no rate is on file, the receipt says the price is to be confirmed and no payment is taken.</p>
      <h2 className="text-2xl font-black">Payment</h2>
      <p>Card payment is collected only when a quoted total is at least $0.50 and card payment is available. The charge uses Stripe. If card payment is not available, the booking is still saved and no payment is taken.</p>
      <h2 className="text-2xl font-black">Staff</h2>
      <p>Staff and providers sign in separately. That sign-in is not required for a guest request. A provider does not see a booking until a staff member assigns it. Staff accounts can be suspended.</p>
      <h2 className="text-2xl font-black">Operator</h2>
      <p>A governing law, liability cap, and operator mailing address have not been published. The legal name and support email of the operator are not on this page yet.</p>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-black">Page not found</h1>
      <p className="mt-4 text-lg">That page is not on HandyHearts.</p>
      <a className="btn btn-primary mt-6" href="/">Back to the start</a>
    </main>
  );
}
