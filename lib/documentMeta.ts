import { PublicConfig } from './publicConfig';
import { AppPaths, RouteId } from '../web/routing';

export class DocumentMeta {
  static apply(route: RouteId): void {
    const site = 'HandyHearts Care Tech';
    const titles: Record<RouteId, string> = {
      home: site,
      services: `Services | ${site}`,
      consult: `Request a consultation | ${site}`,
      book: `Book a service | ${site}`,
      privacy: `Privacy policy | ${site}`,
      terms: `Terms of use | ${site}`,
      staff: `Staff | ${site}`,
      'receipt-lookup': `Find a receipt | ${site}`,
      receipt: `Receipt | ${site}`,
      'not-found': `Page not found | ${site}`,
    };
    const descriptions: Record<RouteId, string> = {
      home: 'Book technology help for an older adult. Request a consultation or book a visit without an account.',
      services: 'Device setup, repairs, learning, Wi-Fi, and printers. No account is required to ask for help.',
      consult: 'Request a HandyHearts consultation. You only need your name, a way to reach you, and a preferred time.',
      book: 'Book a HandyHearts visit. You only need your name, a way to reach you, the service, and a preferred time.',
      privacy: 'How HandyHearts handles the contact and booking details a guest provides.',
      terms: 'The rules for requesting a consultation or booking a HandyHearts visit.',
      staff: 'Staff sign-in for HandyHearts.',
      'receipt-lookup': 'Look up a HandyHearts receipt with its reference.',
      receipt: 'A HandyHearts receipt.',
      'not-found': 'That HandyHearts page was not found.',
    };
    document.title = titles[route];
    DocumentMeta.setMeta('description', descriptions[route]);
    const noindex = route === 'staff' || route === 'receipt' || route === 'receipt-lookup' || route === 'not-found';
    DocumentMeta.setMeta('robots', noindex ? 'noindex' : 'index,follow');
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      const path = route === 'not-found' || route === 'receipt' ? '' : AppPaths.href(route);
      canonical.setAttribute('href', `${PublicConfig.siteUrl()}${path === '/' ? '/' : path}`);
    }
  }

  private static setMeta(name: string, content: string): void {
    const element = document.querySelector(`meta[name="${name}"]`);
    if (element) element.setAttribute('content', content);
  }
}
