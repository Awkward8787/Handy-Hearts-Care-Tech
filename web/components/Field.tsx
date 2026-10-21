import React from 'react';

export function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold">{label}</label>
      {children}
      {hint ? <p id={`${id}-hint`} className="text-sm text-slate-600">{hint}</p> : null}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border-4 border-brand-danger bg-red-50 px-4 py-3 font-bold text-brand-danger">
      {message}
    </p>
  );
}
