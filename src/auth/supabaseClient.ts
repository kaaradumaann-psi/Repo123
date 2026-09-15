import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const viteEnv = import.meta.env ?? {};
const url = typeof viteEnv.VITE_SUPABASE_URL === 'string' ? viteEnv.VITE_SUPABASE_URL.trim() : '';
const anonKey = typeof viteEnv.VITE_SUPABASE_ANON_KEY === 'string' ? viteEnv.VITE_SUPABASE_ANON_KEY.trim() : '';

export const supabaseConfig = {
  url,
  anonKey,
  configured: Boolean(url && anonKey),
};

export const AUTH_STORAGE_KEY = 'mmpi-566-auth';

type AuthStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const memoryOnlyStorage: AuthStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

/**
 * Session lives in sessionStorage: F5 in the same tab keeps the user signed in,
 * closing the tab signs them out. Roles and record access still come from RLS.
 */
export function createAuthStorage(store?: AuthStorage | null): AuthStorage {
  if (store) return store;
  if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
  return memoryOnlyStorage;
}

export const supabase: SupabaseClient | null = supabaseConfig.configured
  ? createClient(url, anonKey, {
    auth: {
      persistSession: true,
      storage: createAuthStorage(),
      storageKey: AUTH_STORAGE_KEY,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Supabase bağlantısı yapılandırılmamış. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY değişkenlerini tanımlayın.');
  return supabase;
}
