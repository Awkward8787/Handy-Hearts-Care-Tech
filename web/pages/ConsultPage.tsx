import { FormEvent, useState } from 'react';
import { GuestRequest } from '../../domain/guestRequest';
import { ServiceCatalog } from '../../domain/serviceCatalog';
import { PreferredTimes } from '../../domain/preferredTimes';
import { SchedulePricing } from '../../domain/schedulePricing';
import { ApiClient } from '../../lib/apiClient';
import { PublicConfig } from '../../lib/publicConfig';
import { ErrorNote, Field } from '../components/Field';
import { Navigation } from '../routing';

export function ConsultPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('device_setup');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const today = SchedulePricing.civilToday(PublicConfig.businessTimeZone());

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = GuestRequest.consultation({
      fullName, email, phone, topic, preferredDate, preferredTime, notes,
    }, PublicConfig.businessTimeZone());
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    setPending(true);
    setError('');
    try {
      const result = await ApiClient.createConsultation(parsed.value);
      Navigation.go(`/receipt/${result.receipt.reference}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'That request could not be saved. Please try again.');
      setPending(false);
    }
  }

  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-4xl font-black md:text-5xl">Request a consultation</h1>
      <p className="mt-4 text-lg text-slate-700">No account needed. Add your name, a way to reach you, and a time. You will get a receipt with a reference.</p>
      <form className="neo-card mt-8 space-y-5 p-6 md:p-8" onSubmit={onSubmit} noValidate>
        <ErrorNote message={error} />
        <Field id="consult-name" label="Your name">
          <input id="consult-name" className="field" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </Field>
        <Field id="consult-email" label="Email" hint="Enter an email, a phone number, or both.">
          <input id="consult-email" className="field" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-describedby="consult-email-hint" />
        </Field>
        <Field id="consult-phone" label="Phone">
          <input id="consult-phone" className="field" type="tel" autoComplete="tel" inputMode="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
        </Field>
        <Field id="consult-topic" label="What do you want to talk about?">
          <select id="consult-topic" className="field" value={topic} onChange={(event) => setTopic(event.target.value)}>
            {ServiceCatalog.consultationTopics().map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </Field>
        <Field id="consult-date" label="Preferred date">
          <input id="consult-date" className="field" type="date" min={today} value={preferredDate} onChange={(event) => setPreferredDate(event.target.value)} required />
        </Field>
        <Field id="consult-time" label="Preferred time">
          <select id="consult-time" className="field" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)}>
            {PreferredTimes.values.map((value) => (
              <option key={value} value={value}>{PreferredTimes.label(value)}</option>
            ))}
          </select>
        </Field>
        <Field id="consult-notes" label="Anything else?">
          <textarea id="consult-notes" className="field min-h-28" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? 'Saving request' : 'Request consultation'}
        </button>
      </form>
    </main>
  );
}
