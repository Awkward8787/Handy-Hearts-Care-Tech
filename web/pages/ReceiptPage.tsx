import { FormEvent, useEffect, useState } from 'react';
import { OrderReference } from '../../domain/orderReference';
import { PreferredTimes } from '../../domain/preferredTimes';
import { PricingEngine } from '../../domain/pricingEngine';
import { ApiClient } from '../../lib/apiClient';
import { Receipt } from '../../types/guest';
import { ErrorNote, Field } from '../components/Field';
import { Navigation } from '../routing';

export function ReceiptLookupPage() {
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = reference.trim().toUpperCase();
    if (!OrderReference.isValid(value)) {
      setError('That receipt was not found.');
      return;
    }
    Navigation.go(`/receipt/${value}`);
  }

  return (
    <main id="main" className="mx-auto max-w-xl px-4 py-12">
      <h1 className="text-4xl font-black">Find a receipt</h1>
      <p className="mt-4 text-lg text-slate-700">Enter the reference from your consultation or booking. No account is required.</p>
      <form className="neo-card mt-8 space-y-4 p-6" onSubmit={onSubmit}>
        <ErrorNote message={error} />
        <Field id="lookup-reference" label="Reference">
          <input id="lookup-reference" className="field" value={reference} onChange={(event) => setReference(event.target.value)} autoCapitalize="characters" />
        </Field>
        <button type="submit" className="btn btn-primary w-full">Show receipt</button>
      </form>
    </main>
  );
}

export function ReceiptPage({ reference }: { reference: string }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    ApiClient.receipt(reference).then((result) => {
      if (active) setReceipt(result.receipt);
    }).catch((caught: unknown) => {
      if (active) setError(caught instanceof Error ? caught.message : 'That receipt was not found.');
    });
    return () => { active = false; };
  }, [reference]);

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-black">Receipt</h1>
      {error ? <div className="mt-6"><ErrorNote message={error} /></div> : null}
      {!receipt && !error ? <p className="mt-6" role="status">Loading receipt</p> : null}
      {receipt ? <ReceiptCard receipt={receipt} /> : null}
    </main>
  );
}

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  const lines = [
    receipt.emailConfirmation === 'sent' ? 'A confirmation was sent to your email.' : '',
    receipt.smsConfirmation === 'sent' ? 'A text confirmation was sent to your phone.' : '',
  ].filter(Boolean);
  const payment = receipt.paymentStatus === 'paid'
    ? 'Payment received.'
    : 'No payment was taken.';

  return (
    <article className="neo-card mt-8 p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-600">{receipt.kind === 'consultation' ? 'Consultation' : 'Booking'}</p>
      <p className="mt-2 text-3xl font-black tracking-wide">{receipt.reference}</p>
      <p className="mt-6 text-lg">{receipt.summary}</p>
      <dl className="mt-6 space-y-3">
        <Row label="Name" value={receipt.fullName} />
        <Row label="For" value={receipt.title} />
        <Row label="When" value={`${PreferredTimes.formatCivilDate(receipt.preferredDate)}, ${receipt.preferredTimeLabel}`} />
        {receipt.serviceType ? <Row label="Visit" value={receipt.serviceType === 'in_home' ? 'In-home' : 'Remote'} /> : null}
        {receipt.address ? <Row label="Address" value={receipt.address} /> : null}
        {receipt.email ? <Row label="Email" value={receipt.email} /> : null}
        {receipt.phone ? <Row label="Phone" value={receipt.phone} /> : null}
        <Row label="Status" value={receipt.statusLabel} />
        <Row label="Payment" value={payment} />
      </dl>
      {receipt.items.length > 0 ? (
        <div className="mt-6 border-t-4 border-black pt-4">
          {receipt.items.map((item) => (
            <p key={item.label} className="flex justify-between gap-4 font-semibold">
              <span>{item.label}</span><span>${PricingEngine.formatDollars(item.amount)}</span>
            </p>
          ))}
          <p className="mt-3 flex justify-between text-2xl font-black"><span>Total</span><span>${PricingEngine.formatDollars(receipt.totalCents)}</span></p>
        </div>
      ) : null}
      {lines.map((line) => <p key={line} className="mt-4 font-bold text-brand-greenInk">{line}</p>)}
      <button type="button" className="btn btn-quiet no-print mt-6" onClick={() => window.print()}>Print receipt</button>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[8rem_1fr]">
      <dt className="font-bold">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
