
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS CORE CONNECTION
 * Prioritizes environment variables to avoid hardcoded key expiration.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://whfhisdlbovwggqiqhfr.supabase.co';

// Standard Supabase Anon Keys are long JWTs. 
// If the environment provides a generic API_KEY that is meant for Supabase, we fallback to it.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.API_KEY || '5pn3N5E4RZiXrsh6jrajLPPXM6xdKrLbkTycGJ5b412d5d6b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Production Link Initialized');
