export type RouteId =
  | 'home'
  | 'services'
  | 'consult'
  | 'book'
  | 'privacy'
  | 'terms'
  | 'staff'
  | 'receipt-lookup'
  | 'receipt'
  | 'not-found';

export class AppPaths {
  static match(pathname: string): { id: RouteId; reference: string | null } {
    const path = decodeURIComponent(pathname.replace(/\/+$/, '') || '/');
    if (path.startsWith('/receipt/')) {
      return { id: 'receipt', reference: path.slice('/receipt/'.length) };
    }
    const table: Record<string, RouteId> = {
      '/': 'home',
      '/services': 'services',
      '/consult': 'consult',
      '/book': 'book',
      '/privacy': 'privacy',
      '/terms': 'terms',
      '/staff': 'staff',
      '/receipt': 'receipt-lookup',
    };
    return { id: table[path] ?? 'not-found', reference: null };
  }

  static href(id: RouteId, reference?: string): string {
    if (id === 'receipt' && reference) return `/receipt/${reference}`;
    const paths: Record<Exclude<RouteId, 'receipt' | 'not-found'>, string> = {
      home: '/',
      services: '/services',
      consult: '/consult',
      book: '/book',
      privacy: '/privacy',
      terms: '/terms',
      staff: '/staff',
      'receipt-lookup': '/receipt',
    };
    if (id === 'not-found' || id === 'receipt') return '/';
    return paths[id];
  }
}

export class Navigation {
  static go(path: string): void {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
