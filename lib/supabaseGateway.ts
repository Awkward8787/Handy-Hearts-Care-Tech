import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PublicConfig } from './publicConfig';

export class SupabaseGateway {
  private static instance: SupabaseClient | null | undefined;

  static client(): SupabaseClient | null {
    if (SupabaseGateway.instance !== undefined) return SupabaseGateway.instance;
    if (!PublicConfig.isSupabaseConfigured()) {
      SupabaseGateway.instance = null;
      return null;
    }
    SupabaseGateway.instance = createClient(PublicConfig.supabaseUrl(), PublicConfig.supabaseAnonKey(), {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    return SupabaseGateway.instance;
  }
}

export class StaffAuthCopy {
  static unavailable(): string {
    return 'Staff sign-in is unavailable right now. Please try again later.';
  }

  static failure(message: string): string {
    const lower = message.toLowerCase();
    if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
      return 'That email and password do not match.';
    }
    if (lower.includes('already registered') || lower.includes('already been registered')) {
      return 'An account with that email already exists. Sign in instead.';
    }
    if (lower.includes('password')) return 'Use a password of at least 8 characters.';
    if (lower.includes('email')) return 'Enter a valid email.';
    return StaffAuthCopy.unavailable();
  }
}
