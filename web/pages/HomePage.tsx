import { AppPaths, Navigation } from '../routing';

function ActionCard({ href, eyebrow, title, body }: { href: string; eyebrow: string; title: string; body: string }) {
  return (
    <a
      href={href}
      className="neo-card flex min-h-44 flex-col justify-between gap-6 p-8 hover:bg-brand-blue hover:text-white"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        Navigation.go(href);
      }}
    >
      <span>
        <span className="block text-sm font-bold uppercase tracking-wide">{eyebrow}</span>
        <span className="mt-3 block text-4xl font-black leading-none">{title}</span>
      </span>
      <span className="text-lg font-semibold">{body}</span>
    </a>
  );
}

export function HomePage() {
  return (
    <main id="main" className="mx-auto max-w-6xl px-4 py-12">
      <p className="text-sm font-bold uppercase tracking-wide text-brand-blueDark">Technology help for an older adult</p>
      <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-6xl">Request help without creating an account.</h1>
      <p className="mt-6 max-w-2xl text-xl text-slate-700">
        Tell us what you need, when you want it, and how to reach you. You get a receipt with a reference. Staff follow up by email or text.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <ActionCard
          href={AppPaths.href('consult')}
          eyebrow="No account needed"
          title="Request a consultation"
          body="Talk through the problem before you book a visit."
        />
        <ActionCard
          href={AppPaths.href('book')}
          eyebrow="No account needed"
          title="Book a service"
          body="Choose the help, a time, and an address if someone is coming to the home."
        />
      </div>
    </main>
  );
}
