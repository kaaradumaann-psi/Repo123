/**
 * Bulut hesap listesi (Ayarlar → "Psikolog hesabı").
 *
 * `profiles` tablosu yalnızca okunur: hesap açma/kapatma/silme işlemleri
 * service-role Edge Function'ından (`admin-users`) geçer. RLS gereği bu liste
 * yalnızca yönetici hesabında dolu döner; psikolog kendi satırını görür.
 */
import { requireSupabase } from '../auth/supabaseClient';

export type CloudProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

export const CLOUD_ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  ORG_ADMIN: 'Kurum yöneticisi',
  PSYCHOLOG: 'Psikolog',
};

export function cloudRoleLabel(role: string): string {
  return CLOUD_ROLE_LABEL[role] ?? role;
}

function toProfile(row: unknown): CloudProfile | null {
  if (typeof row !== 'object' || row === null) return null;
  const value = row as {
    id?: unknown;
    first_name?: unknown;
    last_name?: unknown;
    email?: unknown;
    role?: unknown;
    active?: unknown;
    created_at?: unknown;
  };
  if (typeof value.id !== 'string' || typeof value.role !== 'string' || typeof value.active !== 'boolean') return null;
  return {
    id: value.id,
    firstName: typeof value.first_name === 'string' ? value.first_name : '',
    lastName: typeof value.last_name === 'string' ? value.last_name : '',
    email: typeof value.email === 'string' ? value.email : '',
    role: value.role,
    active: value.active,
    createdAt: typeof value.created_at === 'string' ? value.created_at : '',
  };
}

export async function listCloudProfiles(): Promise<CloudProfile[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id,first_name,last_name,email,role,active,created_at')
    .order('created_at', { ascending: true });
  if (error) throw new Error('Hesap listesi alınamadı. Bağlantınızı kontrol edip tekrar deneyin.');
  return (data ?? []).map(toProfile).filter((profile): profile is CloudProfile => profile !== null);
}

export function cloudProfileCreatedAt(profile: CloudProfile): string {
  if (!profile.createdAt) return '—';
  const date = new Date(profile.createdAt);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
