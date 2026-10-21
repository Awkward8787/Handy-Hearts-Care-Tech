export class SecurityPolicy {
  static readonly hstsMaxAge = 15552000;

  static helmetOptions(): {
    crossOriginEmbedderPolicy: false;
    strictTransportSecurity: { maxAge: number; includeSubDomains: boolean; preload: boolean };
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' };
    frameguard: { action: 'deny' };
    contentSecurityPolicy: { directives: Record<string, string[] | null> };
  } {
    return {
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity: { maxAge: SecurityPolicy.hstsMaxAge, includeSubDomains: false, preload: false },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", 'https://js.stripe.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://api.stripe.com'],
          frameSrc: ['https://js.stripe.com', 'https://hooks.stripe.com'],
          upgradeInsecureRequests: [],
        },
      },
    };
  }
}
