import { useEffect, useState } from 'react';
import { PricingEngine } from '../../domain/pricingEngine';
import { ServiceCatalog } from '../../domain/serviceCatalog';
import { ApiClient, PublicService } from '../../lib/apiClient';
import { AppPaths, Navigation } from '../routing';

export function ServicesPage() {
  const [services, setServices] = useState<PublicService[]>([]);

  useEffect(() => {
    let active = true;
    ApiClient.services().then((rows) => {
      if (active) setServices(rows);
    }).catch(() => {
      if (active) setServices([]);
    });
    return () => { active = false; };
  }, []);

  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl font-black md:text-5xl">Services</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-700">
        HandyHearts helps with everyday technology. You can request a consultation or book a visit without an account. A price is shown only when a rate is on file for that service.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {ServiceCatalog.categories().map((category) => {
          const priced = services.find((service) => service.name.trim().toLowerCase() === category.label.toLowerCase());
          return (
            <li key={category.id} className="neo-card p-6">
              <h2 className="text-2xl font-black">{category.label}</h2>
              <p className="mt-2 text-slate-700">{category.summary}</p>
              {priced ? (
                <p className="mt-4 font-bold">
                  ${PricingEngine.formatDollars(priced.baseRateCents)} per hour, {priced.minHours} hour minimum.
                </p>
              ) : (
                <p className="mt-4 font-bold text-slate-600">Price confirmed when you book, if a rate is on file.</p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <a className="btn btn-primary" href={AppPaths.href('consult')} onClick={(event) => { event.preventDefault(); Navigation.go(AppPaths.href('consult')); }}>Request a consultation</a>
        <a className="btn btn-quiet" href={AppPaths.href('book')} onClick={(event) => { event.preventDefault(); Navigation.go(AppPaths.href('book')); }}>Book a service</a>
      </div>
    </main>
  );
}
