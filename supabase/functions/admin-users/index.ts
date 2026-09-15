import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ActionBody =
  | { action: 'create'; firstName: string; lastName: string; email: string; password: string }
  | { action: 'set_active'; userId: string; active: boolean }
  | { action: 'delete'; userId: string };

type Profile = { id: string; email: string | null; first_name: string; last_name: string; role: 'ADMIN' | 'PSYCHOLOG'; active: boolean };

function headers(request: Request): HeadersInit {
  const origin = request.headers.get('origin') ?? '*';
  const configured = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean);
  const allowOrigin = configured.length === 0 || configured.includes(origin) ? origin : configured[0]!;
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
}

function response(request: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: headers(request) });
}

function text(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(`${label} geçersiz.`);
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length < min || normalized.length > max || /[\u0000-\u001f]/.test(normalized)) throw new Error(`${label} geçersiz.`);
  return normalized;
}

function email(value: unknown): string {
  const normalized = text(value, 'E-posta', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('E-posta geçersiz.');
  return normalized;
}

function password(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128 || /[\u0000-\u001f]/.test(value)) throw new Error('Şifre geçersiz.');
  return value;
}

function safeProfile(value: unknown): Profile {
  const row = value as Partial<Profile>;
  if (typeof row.id !== 'string' || (typeof row.email !== 'string' && row.email !== null) || typeof row.first_name !== 'string' ||
    typeof row.last_name !== 'string' || (row.role !== 'ADMIN' && row.role !== 'PSYCHOLOG') || typeof row.active !== 'boolean') {
    throw new Error('Profil yanıtı geçersiz.');
  }
  return row as Profile;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headers(request) });
  if (request.method !== 'POST') return response(request, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey) return response(request, 500, { error: 'Function configuration is incomplete' });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response(request, 401, { error: 'Authentication required' });
  const token = authorization.slice('Bearer '.length);
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return response(request, 401, { error: 'Authentication required' });

  const { data: callerRow, error: callerError } = await adminClient.from('profiles')
    .select('id,email,first_name,last_name,role,active').eq('id', authData.user.id).maybeSingle();
  if (callerError || !callerRow || callerRow.role !== 'ADMIN' || !callerRow.active) return response(request, 403, { error: 'Admin role required' });

  let body: ActionBody;
  try { body = await request.json() as ActionBody; }
  catch { return response(request, 400, { error: 'Invalid request' }); }

  try {
    if (body.action === 'create') {
      const firstName = text(body.firstName, 'Ad', 2, 80);
      const lastName = text(body.lastName, 'Soyad', 2, 80);
      const userEmail = email(body.email);
      const passwordValue = password(body.password);
      const { data, error } = await adminClient.auth.admin.createUser({
        email: userEmail,
        password: passwordValue,
        email_confirm: true,
        user_metadata: { first_name: firstName, last_name: lastName },
      });
      if (error || !data.user) return response(request, 400, { error: 'Kullanıcı hesabı oluşturulamadı' });
      const { data: profileRow, error: profileError } = await adminClient.from('profiles')
        .select('id,email,first_name,last_name,role,active').eq('id', data.user.id).single();
      if (profileError || !profileRow) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return response(request, 500, { error: 'Kullanıcı profili oluşturulamadı' });
      }
      return response(request, 200, { profile: safeProfile(profileRow) });
    }

    if (body.action === 'set_active') {
      if (typeof body.userId !== 'string' || typeof body.active !== 'boolean') return response(request, 400, { error: 'Invalid account state' });
      const { data: target, error: targetError } = await adminClient.from('profiles')
        .select('id,email,first_name,last_name,role,active').eq('id', body.userId).maybeSingle();
      if (targetError || !target || target.role !== 'PSYCHOLOG') return response(request, 404, { error: 'Psychologist not found' });
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(body.userId, {
        ban_duration: body.active ? 'none' : '876000h',
      });
      if (authUpdateError) return response(request, 400, { error: 'Auth hesabı durumu güncellenemedi' });
      const { data: profileRow, error: profileError } = await adminClient.from('profiles').update({ active: body.active })
        .eq('id', body.userId).select('id,email,first_name,last_name,role,active').single();
      if (profileError || !profileRow) return response(request, 500, { error: 'Profil durumu güncellenemedi' });
      return response(request, 200, { profile: safeProfile(profileRow) });
    }

    if (body.action === 'delete') {
      if (typeof body.userId !== 'string') return response(request, 400, { error: 'Invalid user ID' });
      const { data: target, error: targetError } = await adminClient.from('profiles')
        .select('id,role').eq('id', body.userId).maybeSingle();
      if (targetError || !target || target.role !== 'PSYCHOLOG') return response(request, 404, { error: 'Psychologist not found' });

      // First delete associated mmpi records if desired, or let profile cascade handle it
      await adminClient.from('mmpi_records').delete().eq('created_by', body.userId);
      await adminClient.from('profiles').delete().eq('id', body.userId);
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(body.userId);
      if (deleteAuthError) {
        return response(request, 400, { error: 'Kullanıcı silinirken hata oluştu: ' + deleteAuthError.message });
      }
      return response(request, 200, { ok: true });
    }

    return response(request, 400, { error: 'Unknown action' });
  } catch (error) {
    return response(request, 400, { error: error instanceof Error ? error.message : 'Request rejected' });
  }
});
