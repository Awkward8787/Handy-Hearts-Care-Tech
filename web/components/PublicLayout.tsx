import React from 'react';
import { AppPaths, Navigation } from '../routing';

function TextLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <a
      href={to}
      className={className ?? 'font-bold underline decoration-2 underline-offset-4'}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        Navigation.go(to);
      }}
    >
      {children}
    </a>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b-8 border-black bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
          <a href={AppPaths.href('home')} className="text-3xl font-black tracking-tight" onClick={(event) => { event.preventDefault(); Navigation.go('/'); }}>
            HandyHearts
          </a>
          <nav aria-label="Primary" className="flex flex-wrap gap-x-5 gap-y-2">
            <TextLink to={AppPaths.href('services')}>Services</TextLink>
            <TextLink to={AppPaths.href('consult')}>Consultation</TextLink>
            <TextLink to={AppPaths.href('book')}>Book</TextLink>
          </nav>
        </div>
      </header>
      <div className="flex-1">{children}</div>
      <footer className="border-t-8 border-black bg-white">
        <nav aria-label="Footer" className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-3 px-4 py-6 text-sm">
          <TextLink to={AppPaths.href('privacy')}>Privacy policy</TextLink>
          <TextLink to={AppPaths.href('terms')}>Terms of use</TextLink>
          <TextLink to={AppPaths.href('receipt-lookup')}>Look up a receipt</TextLink>
          <TextLink to={AppPaths.href('staff')}>Staff</TextLink>
        </nav>
      </footer>
    </div>
  );
}

export { TextLink };
