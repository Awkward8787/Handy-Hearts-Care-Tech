import { FormEvent, useCallback, useEffect, useState } from 'react';
import { FieldLimits } from '../../domain/fieldLimits';
import { VisitStatus } from '../../domain/visitStatus';
import { ApiClient } from '../../lib/apiClient';
import { StaffAuthCopy, SupabaseGateway } from '../../lib/supabaseGateway';
import { UserRole } from '../../types/entities';
import { ConsultationRecord, ServiceOrderRecord, ServiceRecord } from '../../types/guest';
import { ErrorNote, Field } from '../components/Field';

interface StaffMe {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  portal: string;
}

interface ProviderOption {
  id: string;
  name: string;
}

export function StaffPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const client = SupabaseGateway.client();
    if (!client) return;
    client.auth.getSession().then(({ data }) => {
      const access = data.session?.access_token;
      if (access) setToken(access);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!token) return;
    ApiClient.staff<StaffMe>('/api/staff/me', token).then(setMe).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : StaffAuthCopy.unavailable());
    });
  }, [token]);

  async function onSignIn(event: FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    const client = SupabaseGateway.client();
    if (!client) {
      setError(StaffAuthCopy.unavailable());
      return;
    }
    setPending(true);
    const { data, error: signInError } = await client.auth.signInWithPassword({ email, password });
    setPending(false);
    if (signInError || !data.session) {
      setError(StaffAuthCopy.failure(signInError?.message ?? ''));
      return;
    }
    setToken(data.session.access_token);
  }

  async function onSignOut() {
    await SupabaseGateway.client()?.auth.signOut();
    setToken(null);
    setMe(null);
  }

  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-black">Staff</h1>
      <p className="mt-3 max-w-2xl text-lg text-slate-700">This sign-in is for staff and providers. Guests do not need it to request a consultation or book a service.</p>
      {me && token ? (
        <StaffDesk token={token} me={me} onSignOut={onSignOut} />
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form className="neo-card space-y-4 p-6" onSubmit={onSignIn}>
            <h2 className="text-2xl font-black">Sign in</h2>
            <ErrorNote message={error} />
            <Field id="staff-email" label="Email">
              <input id="staff-email" className="field" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field id="staff-password" label="Password">
              <input id="staff-password" className="field" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
            </Field>
            <button type="submit" className="btn btn-primary w-full" disabled={pending}>{pending ? 'Signing in' : 'Sign in'}</button>
          </form>
          <ProviderApply onNotice={setNotice} notice={notice} />
        </div>
      )}
    </main>
  );
}

function ProviderApply({ notice, onNotice }: { notice: string; onNotice: (value: string) => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    onNotice('');
    if (password.length < FieldLimits.passwordMin) {
      setError('Use a password of at least 8 characters.');
      return;
    }
    const client = SupabaseGateway.client();
    if (!client) {
      setError(StaffAuthCopy.unavailable());
      return;
    }
    const { error: signUpError } = await client.auth.signUp({
      email,
      password,
      options: { data: { role: 'PROVIDER', full_name: fullName } },
    });
    if (signUpError) {
      setError(StaffAuthCopy.failure(signUpError.message));
      return;
    }
    onNotice('Check your email for a confirmation link, then sign in.');
  }

  return (
    <form className="neo-card space-y-4 p-6" onSubmit={onSubmit}>
      <h2 className="text-2xl font-black">Apply as a provider</h2>
      <p className="text-slate-700">Provider applications are reviewed by staff. This is not a customer account.</p>
      <ErrorNote message={error} />
      {notice ? <p className="font-bold text-brand-greenInk">{notice}</p> : null}
      <Field id="apply-name" label="Your name">
        <input id="apply-name" className="field" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
      </Field>
      <Field id="apply-email" label="Email">
        <input id="apply-email" className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </Field>
      <Field id="apply-password" label="Password">
        <input id="apply-password" className="field" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      </Field>
      <button type="submit" className="btn btn-quiet w-full">Submit application</button>
    </form>
  );
}

function StaffDesk({ token, me, onSignOut }: { token: string; me: StaffMe; onSignOut: () => void }) {
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [orders, setOrders] = useState<ServiceOrderRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const orderPayload = await ApiClient.staff<{ orders: ServiceOrderRecord[] }>('/api/staff/orders', token);
      setOrders(orderPayload.orders);
      if (me.portal === 'admin') {
        const [consultationPayload, servicePayload, providerPayload] = await Promise.all([
          ApiClient.staff<{ consultations: ConsultationRecord[] }>('/api/staff/consultations', token),
          ApiClient.staff<{ services: ServiceRecord[] }>('/api/staff/services', token),
          ApiClient.staff<{ providers: ProviderOption[] }>('/api/staff/providers', token),
        ]);
        setConsultations(consultationPayload.consultations);
        setServices(servicePayload.services);
        setProviders(providerPayload.providers);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Those records could not be loaded. Please try again.');
    }
  }, [token, me.portal]);

  useEffect(() => { load().catch(() => undefined); }, [load]);

  return (
    <div className="mt-8 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-bold">{me.name} · {me.portal === 'admin' ? 'Admin' : me.portal === 'provider' ? 'Provider' : 'Waiting for approval'}</p>
        <button type="button" className="btn btn-quiet" onClick={onSignOut}>Sign out</button>
      </div>
      <ErrorNote message={error} />
      {me.portal === 'provider-pending' ? <p className="neo-card p-6 text-lg">Your provider application is waiting for approval.</p> : null}
      {me.portal === 'admin' ? (
        <>
          <RecordList title="Consultations" empty="No consultations yet." rows={consultations.map((item) => `${item.reference} · ${item.fullName} · ${item.topic} · ${item.status}`)} />
          <OrderList orders={orders} providers={providers} token={token} onChanged={load} />
          <ServiceEditor services={services} token={token} onChanged={load} />
        </>
      ) : null}
      {me.portal === 'provider' ? <ProviderOrders orders={orders} token={token} onChanged={load} /> : null}
    </div>
  );
}

function RecordList({ title, empty, rows }: { title: string; empty: string; rows: string[] }) {
  return (
    <section>
      <h2 className="text-2xl font-black">{title}</h2>
      {rows.length === 0 ? <p className="mt-3 text-slate-600">{empty}</p> : (
        <ul className="mt-3 space-y-2">
          {rows.map((row) => <li key={row} className="neo-card p-4 font-semibold">{row}</li>)}
        </ul>
      )}
    </section>
  );
}

function OrderList({ orders, providers, token, onChanged }: { orders: ServiceOrderRecord[]; providers: ProviderOption[]; token: string; onChanged: () => Promise<void> }) {
  const [choice, setChoice] = useState<Record<string, string>>({});
  return (
    <section>
      <h2 className="text-2xl font-black">Bookings</h2>
      {orders.length === 0 ? <p className="mt-3 text-slate-600">No bookings yet.</p> : (
        <ul className="mt-3 space-y-3">
          {orders.map((order) => (
            <li key={order.reference} className="neo-card space-y-3 p-4">
              <p className="font-bold">{order.reference} · {order.fullName} · {order.status} · {order.paymentStatus}</p>
              <div className="flex flex-wrap gap-2">
                <label className="sr-only" htmlFor={`provider-${order.reference}`}>Provider for {order.reference}</label>
                <select id={`provider-${order.reference}`} className="field max-w-xs" value={choice[order.reference] ?? ''} onChange={(event) => setChoice({ ...choice, [order.reference]: event.target.value })}>
                  <option value="">Choose a provider</option>
                  {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
                </select>
                <button
                  type="button"
                  className="btn btn-ink"
                  disabled={!choice[order.reference]}
                  onClick={() => {
                    ApiClient.staff(`/api/staff/orders/${order.reference}/assign`, token, { method: 'POST', body: { providerUserId: choice[order.reference] } }).then(onChanged).catch(() => undefined);
                  }}
                >
                  Assign provider
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ProviderOrders({ orders, token, onChanged }: { orders: ServiceOrderRecord[]; token: string; onChanged: () => Promise<void> }) {
  return (
    <section>
      <h2 className="text-2xl font-black">Assigned visits</h2>
      {orders.length === 0 ? <p className="mt-3 text-slate-600">No visits are assigned to you yet.</p> : (
        <ul className="mt-3 space-y-3">
          {orders.map((order) => {
            const action = VisitStatus.nextProviderAction(order.status);
            return (
              <li key={order.reference} className="neo-card space-y-3 p-4">
                <p className="font-bold">{order.reference} · {order.fullName} · {VisitStatus.label(order.status)}</p>
                {order.address ? <p>{order.address}</p> : null}
                {order.notes ? <p>{order.notes}</p> : null}
                {action ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      ApiClient.staff(`/api/staff/orders/${order.reference}/status`, token, { method: 'POST', body: { status: action.status } }).then(onChanged).catch(() => undefined);
                    }}
                  >
                    {action.label}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function ServiceEditor({ services, token, onChanged }: { services: ServiceRecord[]; token: string; onChanged: () => Promise<void> }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dollars, setDollars] = useState('');
  const [minHours, setMinHours] = useState('2');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const rate = Number(dollars);
    const hours = Number(minHours);
    if (!name.trim() || !description.trim() || !Number.isFinite(rate) || rate < 0 || !Number.isFinite(hours) || hours <= 0) {
      setError('Enter a name, description, hourly rate, and minimum hours.');
      return;
    }
    setError('');
    await ApiClient.staff('/api/staff/services', token, {
      method: 'POST',
      body: { name, description, baseRateCents: Math.round(rate * 100), minHours: hours },
    });
    setName('');
    setDescription('');
    setDollars('');
    await onChanged();
  }

  return (
    <section>
      <h2 className="text-2xl font-black">Service rates</h2>
      {services.length === 0 ? <p className="mt-3 text-slate-600">No services are listed yet.</p> : (
        <ul className="mt-3 space-y-2">
          {services.map((service) => (
            <li key={service.id} className="neo-card p-4 font-semibold">{service.name} · ${(service.baseRateCents / 100).toFixed(2)} / hour · {service.minHours} hour minimum</li>
          ))}
        </ul>
      )}
      <form className="neo-card mt-4 space-y-3 p-4" onSubmit={onSubmit}>
        <ErrorNote message={error} />
        <Field id="service-name" label="Service name"><input id="service-name" className="field" value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field id="service-description" label="Description"><input id="service-description" className="field" value={description} onChange={(event) => setDescription(event.target.value)} /></Field>
        <Field id="service-rate" label="Hourly rate in dollars"><input id="service-rate" className="field" inputMode="decimal" value={dollars} onChange={(event) => setDollars(event.target.value)} /></Field>
        <Field id="service-hours" label="Minimum hours"><input id="service-hours" className="field" inputMode="decimal" value={minHours} onChange={(event) => setMinHours(event.target.value)} /></Field>
        <button type="submit" className="btn btn-ink">Add service</button>
      </form>
    </section>
  );
}
