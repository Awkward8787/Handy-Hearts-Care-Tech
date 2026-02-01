
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS CORE CONNECTION
 * Project: Handy Hearts Care Tech (whfhisdlbovwggqiqhfr)
 */
const supabaseUrl = 'https://whfhisdlbovwggqiqhfr.supabase.co';
const supabaseAnonKey = '5pn3N5E4RZiXrsh6jrajLPPXM6xdKrLbkTycGJ5b412d5d6b';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Production Link Established with whfhisdlbovwggqiqhfr');
