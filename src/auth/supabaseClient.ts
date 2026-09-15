import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AUTH_STORAGE_KEY, createAuthStorage } from './authStorage';

export { AUTH_STORAGE_KEY, createAuthStorage } from './authStorage';

const url = import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

export const supabaseConfig = {
  url,
  anonKey,
  configured: Boolean(url && anonKey),
};

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
