import { lazy, Suspense, useEffect, useState } from 'react';
import { DocumentMeta } from './lib/documentMeta';
import { ErrorBoundary } from './web/components/ErrorBoundary';
import { PublicLayout } from './web/components/PublicLayout';
import { ConsultPage } from './web/pages/ConsultPage';
import { HomePage } from './web/pages/HomePage';
import { NotFoundPage, PrivacyPage, TermsPage } from './web/pages/LegalPages';
import { ReceiptLookupPage, ReceiptPage } from './web/pages/ReceiptPage';
import { ServicesPage } from './web/pages/ServicesPage';
import { AppPaths, RouteId } from './web/routing';

const BookPage = lazy(() => import('./web/pages/BookPage').then((module) => ({ default: module.BookPage })));
const StaffPage = lazy(() => import('./web/pages/StaffPage').then((module) => ({ default: module.StaffPage })));

function useRoute(): { id: RouteId; reference: string | null } {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return AppPaths.match(path);
}

function Outlet() {
  const route = useRoute();
  useEffect(() => {
    DocumentMeta.apply(route.id);
  }, [route.id]);

  let page = <NotFoundPage />;
  if (route.id === 'home') page = <HomePage />;
  if (route.id === 'services') page = <ServicesPage />;
  if (route.id === 'consult') page = <ConsultPage />;
  if (route.id === 'book') page = <Suspense fallback={<main id="main" className="px-4 py-12">Loading booking</main>}><BookPage /></Suspense>;
  if (route.id === 'privacy') page = <PrivacyPage />;
  if (route.id === 'terms') page = <TermsPage />;
  if (route.id === 'staff') page = <Suspense fallback={<main id="main" className="px-4 py-12">Loading staff</main>}><StaffPage /></Suspense>;
  if (route.id === 'receipt-lookup') page = <ReceiptLookupPage />;
  if (route.id === 'receipt' && route.reference) page = <ReceiptPage reference={route.reference} />;

  return <PublicLayout>{page}</PublicLayout>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <a className="skip-link" href="#main">Skip to content</a>
      <Outlet />
    </ErrorBoundary>
  );
}
