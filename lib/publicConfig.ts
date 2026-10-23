import { SchedulePricing } from '../domain/schedulePricing';

export class PublicConfig {
  static supabaseUrl(): string {
    return (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
  }

  static supabaseAnonKey(): string {
    return (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
  }

  static stripePublishableKey(): string {
    return (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '').trim();
  }

  static apiBaseUrl(): string {
    return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/$/, '');
  }

  static businessTimeZone(): string {
    const value = (import.meta.env.VITE_BUSINESS_TIMEZONE ?? '').trim();
    return value && SchedulePricing.isTimeZone(value) ? value : SchedulePricing.DEFAULT_TIME_ZONE;
  }

  static siteUrl(): string {
    const value = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').trim().replace(/\/$/, '');
    return value || 'https://hhcaretech.com';
  }

  static isSupabaseConfigured(): boolean {
    return Boolean(PublicConfig.supabaseUrl() && PublicConfig.supabaseAnonKey());
  }

  static isStripeConfigured(): boolean {
    return Boolean(PublicConfig.stripePublishableKey());
  }
}
