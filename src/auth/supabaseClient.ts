import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabaseConfig = {
  url,
  anonKey,
  configured: Boolean(url && anonKey),
};

/**
 * Supabase Auth deliberately keeps its session in memory for this static client.
 * persistSession is false so the application never uses localStorage/sessionStorage
 * for identity, roles, or access decisions. RLS remains the authoritative boundary.
 */
const memoryOnlyStorage = {
  getItem: (_key: string) => null,
  setItem: (_key: string, _value: string) => {},
  removeItem: (_key: string) => {},
};

export const supabase: SupabaseClient | null = supabaseConfig.configured
  ? createClient(url, anonKey, {
    auth: {
      persistSession: false,
      storage: memoryOnlyStorage,
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
