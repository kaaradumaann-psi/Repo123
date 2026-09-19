import { requireSupabase } from './supabaseClient';
import type { AuthenticatedUser } from './authTypes';

function rowToUser(row: unknown): AuthenticatedUser {
  const value = row as Partial<AuthenticatedUser> & { first_name?: string; last_name?: string };
  if (
    typeof value.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.id) ||
    typeof value.email !== 'string' || value.email.length > 254 || !value.email.trim() || /[\u0000-\u001f\u007f]/.test(value.email) ||
    typeof value.first_name !== 'string' || value.first_name.trim().length < 2 || value.first_name.length > 80 || /[\u0000-\u001f\u007f]/.test(value.first_name) ||
    typeof value.last_name !== 'string' || value.last_name.trim().length < 2 || value.last_name.length > 80 || /[\u0000-\u001f\u007f]/.test(value.last_name) ||
    (value.role !== 'ADMIN' && value.role !== 'PSYCHOLOG') ||
    typeof value.active !== 'boolean'
  ) {
    throw new Error('Kullanıcı kaydı geçersiz.');
  }
  return {
    id: value.id,
    email: value.email,
    firstName: value.first_name,
    lastName: value.last_name,
    role: value.role,
    active: value.active,
  };
}

export async function listPsychologists(): Promise<AuthenticatedUser[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id,email,first_name,last_name,role,active')
    .eq('role', 'PSYCHOLOG')
    .order('created_at', { ascending: true });
  if (error) throw new Error('Psikolog listesi alınamadı.');
  return (data ?? []).map(rowToUser);
}

export async function createPsychologist(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthenticatedUser> {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', {
    body: {
      action: 'create',
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    },
  });
  if (error) throw new Error('Psikolog hesabı oluşturulamadı.');
  if (!data?.profile) throw new Error('Psikolog hesabı oluşturuldu ancak profil bilgisi alınamadı.');
  return rowToUser(data.profile);
}

export async function setPsychologistActive(userId: string, active: boolean): Promise<AuthenticatedUser> {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', {
    body: { action: 'set_active', userId, active },
  });
  if (error) throw new Error('Hesap durumu değiştirilemedi.');
  if (!data?.profile) throw new Error('Güncel kullanıcı profili alınamadı.');
  return rowToUser(data.profile);
}

export async function deletePsychologist(userId: string): Promise<void> {
  // Account deletion is deliberately Edge-Function-only. A direct profile DELETE would leave an
  // orphaned Auth user (or cascade data without deleting the credentials) when the function is
  // unavailable, which is worse than showing an actionable deployment error.
  const { data, error } = await requireSupabase().functions.invoke('admin-users', {
    body: { action: 'delete', userId },
  });
  if (error || !data?.ok) throw new Error('Kullanıcı hesabı silinemedi. Edge Function bağlantısını kontrol edin.');
}
