
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS CORE CONNECTION
 * Project: Handy Hearts Care Tech (whfhisdlbovwggqiqhfr)
 */
const supabaseUrl = 'https://whfhisdlbovwggqiqhfr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmhpc2RsYm92d2dncWlxaGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDI5MDAsImV4cCI6MjA4NTQ3ODkwMH0.XbTa_uBSW7z7mCb2k6F4ubILAP25cm383fqVGe62Lq4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Production Link Established with whfhisdlbovwggqiqhfr');
