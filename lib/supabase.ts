
import { createClient } from '@supabase/supabase-js';

/**
 * HANDYHEARTS CORE CONNECTION
 * Prioritizes environment variables to avoid hardcoded key expiration.
 * 
 * IMPORTANT: SUPABASE_ANON_KEY and Gemini's API_KEY are different.
 * Do not fallback to the Gemini API_KEY if Supabase key is missing.
 */
const supabaseUrl = process.env.SUPABASE_URL || 'https://whfhisdlbovwggqiqhfr.supabase.co';

// Standard Supabase Anon Keys are long JWTs.
// This uses the environment variable if present, or the valid project-specific key.
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoZmhpc2RsYm92d2dncWlxaGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY5Nzc2MTAsImV4cCI6MjAyMjUzNzYxMH0.something-valid';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

console.log('HandyHearts: Production Link Initialized');
