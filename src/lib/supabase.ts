import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default project configuration for MIO Luxury Atelier
const DEFAULT_SUPABASE_URL = 'https://jfwjitqutdbueaxxxwld.supabase.co';

export function getSupabaseUrl(): string {
  return (
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    DEFAULT_SUPABASE_URL
  );
}

export function getSupabaseAnonKey(): string {
  // Check Vite env first, then localStorage fallback for admin convenience
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mio_supabase_anon_key') || '';
  }
  return '';
}

export function setStoredSupabaseAnonKey(key: string): void {
  if (typeof window !== 'undefined') {
    if (key.trim()) {
      localStorage.setItem('mio_supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('mio_supabase_anon_key');
    }
  }
}

// Create Supabase client instance
export function createSupabaseClient(overrideKey?: string): SupabaseClient {
  const url = getSupabaseUrl();
  const key = overrideKey || getSupabaseAnonKey() || 'public-anon-key-placeholder';
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Export default singleton instance
export const supabase = createSupabaseClient();
