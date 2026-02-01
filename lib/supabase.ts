
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS CORE CONNECTION
 * Prioritizes environment variables to avoid hardcoded key expiration.
 * 
 * IMPORTANT: SUPABASE_ANON_KEY and Gemini's API_KEY are different.
 * Do not fallback to API_KEY if Supabase key is missing.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://whfhisdlbovwggqiqhfr.supabase.co';

// Use specific Supabase key if available, otherwise use the project-specific fallback.
// We remove the fallback to process.env.API_KEY as that is strictly for Gemini.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '5pn3N5E4RZiXrsh6jrajLPPXM6xdKrLbkTycGJ5b412d5d6b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Production Link Initialized');
