import { requireSupabase } from './supabaseClient';
import type { AuthenticatedUser } from './authTypes';

function rowToUser(row: unknown): AuthenticatedUser {
  const value = row as Partial<AuthenticatedUser> & { first_name?: string; last_name?: string };
  if (typeof value.id !== 'string' || typeof value.email !== 'string' || typeof value.first_name !== 'string' ||
    typeof value.last_name !== 'string' || (value.role !== 'ADMIN' && value.role !== 'PSYCHOLOG') || typeof value.active !== 'boolean') {
    throw new Error('Supabase kullanıcı kaydı geçersiz.');
  }
  return { id: value.id, email: value.email, firstName: value.first_name, lastName: value.last_name, role: value.role, active: value.active };
}

export async function listPsychologists(): Promise<AuthenticatedUser[]> {
  const { data, error } = await requireSupabase().from('profiles')
    .select('id,email,first_name,last_name,role,active').eq('role', 'PSYCHOLOG').order('created_at', { ascending: true });
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
    body: { action: 'create', firstName: input.firstName, lastName: input.lastName, email: input.email, password: input.password },
  });
  if (error) throw new Error('Psikolog hesabı oluşturulamadı.');
  if (!data?.profile) throw new Error('Psikolog hesabı oluşturuldu ancak profil alınamadı.');
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
