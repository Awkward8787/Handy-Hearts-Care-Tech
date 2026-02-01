
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS SUPABASE CONFIGURATION
 * ---------------------------------
 * Project: whfhisdlbovwggqiqhfr
 * Using provided public credentials for the Handy Hearts Care Tech project.
 */
const supabaseUrl = 'https://whfhisdlbovwggqiqhfr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmhpc2RsYm92d2dncWlxaGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MDI5MDAsImV4cCI6MjA4NTQ3ODkwMH0.XbTa_uBSW7z7mCb2k6F4ubILAP25cm383fqVGe62Lq4';

// Initialize the client with explicit credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Supabase Node Connection Established.');
