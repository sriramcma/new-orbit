import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve credentials from environment or localStorage for runtime customization
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const storedUrl = typeof window !== 'undefined' ? localStorage.getItem('orbit_supabase_url') : null;
const storedKey = typeof window !== 'undefined' ? localStorage.getItem('orbit_supabase_key') : null;

const FALLBACK_PROJECT_URL = 'https://bhagajncyysjxytjsswf.supabase.co';
const FALLBACK_PROJECT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoYWdham5jeXlzanh5dGpzc3dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI4MzE1NjIsImV4cCI6MjEwODQwNzU2Mn0._DCSZs7sM5m7yEUe76DrkntlMiVN_-_KZywGPBHeidc';

export const supabaseUrl = (envUrl && !envUrl.includes('your-project') ? envUrl : storedUrl) || FALLBACK_PROJECT_URL;
export const supabaseAnonKey = (envKey && !envKey.includes('your-anon-key') ? envKey : storedKey) || FALLBACK_PROJECT_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey &&
  supabaseUrl.startsWith('http')
);

// Fallback dummy client if credentials are not configured yet, preventing app crashes
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'placeholder-key';

export const supabase: SupabaseClient = createClient(
  isSupabaseConfigured ? supabaseUrl : dummyUrl,
  isSupabaseConfigured ? supabaseAnonKey : dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export function saveCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('orbit_supabase_url', url.trim());
    localStorage.setItem('orbit_supabase_key', key.trim());
    window.location.reload();
  }
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('orbit_supabase_url');
    localStorage.removeItem('orbit_supabase_key');
    window.location.reload();
  }
}
