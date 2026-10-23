import { FormEvent, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { GuestRequest } from '../../domain/guestRequest';
import { PreferredTimes } from '../../domain/preferredTimes';
import { PricingEngine } from '../../domain/pricingEngine';
import { SchedulePricing } from '../../domain/schedulePricing';
import { ServiceCatalog } from '../../domain/serviceCatalog';
import { ApiClient, QuoteResponse } from '../../lib/apiClient';
import { PublicConfig } from '../../lib/publicConfig';
import { Receipt } from '../../types/guest';
import { ErrorNote, Field } from '../components/Field';
import { Navigation } from '../routing';

const stripePromise = PublicConfig.isStripeConfigured() ? loadStripe(PublicConfig.stripePublishableKey()) : null;

export function BookPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceCategory, setServiceCategory] = useState('device_setup');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [serviceType, setServiceType] = useState<'in_home' | 'remote'>('in_home');
  const [address, setAddress] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [notes, setNotes] = useState('');
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const today = SchedulePricing.civilToday(PublicConfig.businessTimeZone());

  function draft() {
    return { fullName, email, phone, serviceCategory, urgency, serviceType, address, preferredDate, preferredTime, notes };
  }

  async function onReview(event: FormEvent) {
    event.preventDefault();
    const parsed = GuestRequest.order(draft(), PublicConfig.businessTimeZone());
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setPending(true);
    setError('');
    try {
      setQuote(await ApiClient.quote(parsed.value));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That request could not be completed. Please try again.');
    } finally {
      setPending(false);
    }
  }

  async function onPlace() {
    const parsed = GuestRequest.order(draft(), PublicConfig.businessTimeZone());
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await ApiClient.createOrder(parsed.value);
      if (result.clientSecret && stripePromise) {
        setReceipt(result.receipt);
        setClientSecret(result.clientSecret);
      } else {
        Navigation.go(`/receipt/${result.receipt.reference}`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That request could not be saved. Please try again.');
    } finally {
      setPending(false);
    }
  }

  if (receipt && clientSecret && stripePromise) {
    return (
      <main id="main" className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-black">Pay for this booking</h1>
        <p className="mt-4 text-lg">Reference {receipt.reference}. The quoted total is ${PricingEngine.formatDollars(receipt.totalCents)}.</p>
        <div className="neo-card mt-8 p-6">
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <CardPayment reference={receipt.reference} />
          </Elements>
        </div>
      </main>
    );
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-black md:text-5xl">Book a service</h1>
      <p className="mt-4 text-lg text-slate-700">No account needed. Choose the help, a time, and how to reach you. An address is required only for an in-home visit.</p>
      <form className="neo-card mt-8 space-y-5 p-6 md:p-8" onSubmit={onReview} noValidate>
        <ErrorNote message={error} />
        <Field id="book-service" label="Service">
          <select id="book-service" className="field" value={serviceCategory} onChange={(event) => { setServiceCategory(event.target.value); setQuote(null); }}>
            {ServiceCatalog.categories().map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold">How soon</legend>
          <p className="text-sm text-slate-600">When a rate is on file, expedited adds $15 and emergency adds $25. A weekend adds 15%. The same day adds $25.</p>
          <div className="flex flex-wrap gap-3">
            {([['low', 'Standard'], ['medium', 'Expedited'], ['high', 'Emergency']] as const).map(([value, label]) => (
              <label key={value} className="btn btn-quiet cursor-pointer">
                <input className="mr-2" type="radio" name="urgency" value={value} checked={urgency === value} onChange={() => { setUrgency(value); setQuote(null); }} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-bold">Where</legend>
          <div className="flex flex-wrap gap-3">
            <label className="btn btn-quiet cursor-pointer">
              <input className="mr-2" type="radio" name="where" value="in_home" checked={serviceType === 'in_home'} onChange={() => { setServiceType('in_home'); setQuote(null); }} />
              In-home visit
            </label>
            <label className="btn btn-quiet cursor-pointer">
              <input className="mr-2" type="radio" name="where" value="remote" checked={serviceType === 'remote'} onChange={() => { setServiceType('remote'); setQuote(null); }} />
              Remote help
            </label>
          </div>
        </fieldset>
        {serviceType === 'in_home' ? (
          <Field id="book-address" label="Address">
            <textarea id="book-address" className="field min-h-24" autoComplete="street-address" value={address} onChange={(event) => { setAddress(event.target.value); setQuote(null); }} />
          </Field>
        ) : null}
        <Field id="book-date" label="Preferred date">
          <input id="book-date" className="field" type="date" min={today} value={preferredDate} onChange={(event) => { setPreferredDate(event.target.value); setQuote(null); }} />
        </Field>
        <Field id="book-time" label="Preferred time">
          <select id="book-time" className="field" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)}>
            {PreferredTimes.values.map((value) => <option key={value} value={value}>{PreferredTimes.label(value)}</option>)}
          </select>
        </Field>
        <Field id="book-name" label="Your name">
          <input id="book-name" className="field" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        </Field>
        <Field id="book-email" label="Email" hint="Enter an email, a phone number, or both.">
          <input id="book-email" className="field" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby="book-email-hint" />
        </Field>
        <Field id="book-phone" label="Phone">
          <input id="book-phone" className="field" type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field id="book-notes" label="Anything else?">
          <textarea id="book-notes" className="field min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        {quote ? (
          <section aria-label="Price" className="border-4 border-black bg-slate-50 p-4">
            <h2 className="text-xl font-black">Review</h2>
            {quote.priced ? quote.items.map((item) => (
              <p key={item.label} className="mt-2 flex justify-between gap-4 font-semibold">
                <span>{item.label}</span>
                <span>${PricingEngine.formatDollars(item.amount)}</span>
              </p>
            )) : <p className="mt-2 font-semibold">Price to be confirmed. No payment will be taken when you place this booking.</p>}
            {quote.priced ? <p className="mt-3 flex justify-between text-2xl font-black"><span>Total</span><span>${PricingEngine.formatDollars(quote.totalCents)}</span></p> : null}
            <button type="button" className="btn btn-ink mt-4 w-full" onClick={onPlace} disabled={pending}>
              {pending ? 'Saving booking' : 'Place booking'}
            </button>
          </section>
        ) : null}
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending && !quote ? 'Checking price' : 'Review booking'}
        </button>
      </form>
    </main>
  );
}

function CardPayment({ reference }: { reference: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setError('');
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/receipt/${reference}` },
      redirect: 'if_required',
    });
    if (result.error) {
      const customerSafe = result.error.type === 'card_error' || result.error.type === 'validation_error';
      setError(customerSafe && result.error.message ? result.error.message : 'The card payment did not go through. No payment was taken.');
      setPending(false);
      return;
    }
    Navigation.go(`/receipt/${reference}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PaymentElement />
      <ErrorNote message={error} />
      <button type="submit" className="btn btn-primary w-full" disabled={!stripe || pending}>
        {pending ? 'Submitting payment' : 'Pay now'}
      </button>
    </form>
  );
}
