import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
let adminClient: ReturnType<typeof createClient> | null = null;
try {
  if (supabaseUrl && serviceRoleKey) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
} catch {
  // Keep the function loadable so the handler can return a safe configuration error.
  adminClient = null;
}

type ActionBody =
  | { action: 'create'; firstName: string; lastName: string; email: string; password: string }
  | { action: 'set_active'; userId: string; active: boolean }
  | { action: 'delete'; userId: string };

type Profile = { id: string; email: string | null; first_name: string; last_name: string; role: 'ADMIN' | 'PSYCHOLOG'; active: boolean };

function configuredOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(value => value.trim()).filter(Boolean).flatMap(value => {
    try {
      const parsed = new URL(value);
      const local = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if ((!local && parsed.protocol !== 'https:') || (local && !['http:', 'https:'].includes(parsed.protocol)) ||
        parsed.pathname !== '/' || parsed.username || parsed.password || parsed.search || parsed.hash) return [];
      return [parsed.origin];
    } catch {
      return [];
    }
  });
}

function isAllowedOrigin(origin: string): boolean {
  const configured = configuredOrigins();
  if (configured.length > 0) return configured.includes(origin);
  // An empty production allowlist must not reflect arbitrary websites. Localhost remains
  // convenient for local development; deployed origins must be explicitly configured.
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'http:' && (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');
  } catch {
    return false;
  }
}

function headers(request: Request): HeadersInit {
  const origin = request.headers.get('origin');
  const result: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) result['Access-Control-Allow-Origin'] = origin;
  return result;
}

function response(request: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: headers(request) });
}

function text(value: unknown, label: string, min: number, max: number): string {
  if (typeof value !== 'string') throw new Error(`${label} geçersiz.`);
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (normalized.length < min || normalized.length > max || /[\u0000-\u001f\u007f]/.test(normalized)) throw new Error(`${label} geçersiz.`);
  return normalized;
}

function email(value: unknown): string {
  const normalized = text(value, 'E-posta', 5, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error('E-posta geçersiz.');
  return normalized;
}

function password(value: unknown): string {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128 || /[\u0000-\u001f\u007f]/.test(value)) throw new Error('Şifre geçersiz.');
  return value;
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error('Kullanıcı kimliği geçersiz.');
  }
  return value;
}

function safeProfile(value: unknown): Profile {
  const row = value as Partial<Profile>;
  if (typeof row.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(row.id) ||
    (typeof row.email !== 'string' && row.email !== null) || (typeof row.email === 'string' && !row.email.trim()) ||
    typeof row.first_name !== 'string' || row.first_name.trim().length < 2 || row.first_name.length > 80 ||
    typeof row.last_name !== 'string' || row.last_name.trim().length < 2 || row.last_name.length > 80 ||
    (row.role !== 'ADMIN' && row.role !== 'PSYCHOLOG') || typeof row.active !== 'boolean') {
    throw new Error('Profil yanıtı geçersiz.');
  }
  return row as Profile;
}

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  if (origin && !isAllowedOrigin(origin)) return response(request, 403, { error: 'Origin not allowed' });
  if (request.method === 'OPTIONS') return new Response('ok', { headers: headers(request) });
  if (request.method !== 'POST') return response(request, 405, { error: 'Method not allowed' });
  if (!supabaseUrl || !serviceRoleKey || !adminClient) return response(request, 500, { error: 'Function configuration is incomplete' });

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response(request, 401, { error: 'Authentication required' });
  const token = authorization.slice('Bearer '.length);
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) return response(request, 401, { error: 'Authentication required' });

  const { data: callerRow, error: callerError } = await adminClient.from('profiles')
    .select('id,email,first_name,last_name,role,active').eq('id', authData.user.id).maybeSingle();
  if (callerError || !callerRow || callerRow.role !== 'ADMIN' || !callerRow.active) return response(request, 403, { error: 'Admin role required' });

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > 32 * 1024) {
    return response(request, 413, { error: 'Request too large' });
  }
  let body: ActionBody;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > 32 * 1024) return response(request, 413, { error: 'Request too large' });
    body = JSON.parse(rawBody) as ActionBody;
  } catch { return response(request, 400, { error: 'Invalid request' }); }

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
      try {
        return response(request, 200, { profile: safeProfile(profileRow) });
      } catch {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return response(request, 500, { error: 'Kullanıcı profili oluşturulamadı' });
      }
    }

    if (body.action === 'set_active') {
      if (typeof body.active !== 'boolean') return response(request, 400, { error: 'Invalid account state' });
      const userId = uuid(body.userId);
      const { data: target, error: targetError } = await adminClient.from('profiles')
        .select('id,email,first_name,last_name,role,active').eq('id', userId).maybeSingle();
      if (targetError || !target || target.role !== 'PSYCHOLOG') return response(request, 404, { error: 'Psychologist not found' });
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(userId, {
        ban_duration: body.active ? 'none' : '876000h',
      });
      if (authUpdateError) return response(request, 400, { error: 'Auth hesabı durumu güncellenemedi' });
      const { data: profileRow, error: profileError } = await adminClient.from('profiles').update({ active: body.active })
        .eq('id', userId).select('id,email,first_name,last_name,role,active').single();
      if (profileError || !profileRow) {
        // Best-effort rollback: do not leave Auth and profile state disagreeing when the
        // second write fails. The error remains explicit if the rollback itself fails.
        await adminClient.auth.admin.updateUserById(userId, {
          ban_duration: target.active ? 'none' : '876000h',
        });
        return response(request, 500, { error: 'Profil durumu güncellenemedi' });
      }
      return response(request, 200, { profile: safeProfile(profileRow) });
    }

    if (body.action === 'delete') {
      const userId = uuid(body.userId);
      const { data: target, error: targetError } = await adminClient.from('profiles')
        .select('id,role').eq('id', userId).maybeSingle();
      if (targetError || !target || target.role !== 'PSYCHOLOG') return response(request, 404, { error: 'Psychologist not found' });

      // Delete Auth first. The profiles and mmpi_records foreign keys use ON DELETE CASCADE,
      // so a failed Auth deletion leaves all application data intact instead of deleting data
      // before the credentials can be removed.
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
      if (deleteAuthError) {
        console.error('Admin user deletion failed', deleteAuthError);
        // Auth silmesi, mmpi_records → audit_logs AFTER DELETE trigger'ını service-role
        // bağlamında (auth.uid() = NULL) çalıştırır. 20260920120000 öncesi şemada
        // audit_logs.actor NOT NULL olduğu için bu, tüm silme işlemini geri alıyordu ve
        // arayüz yalnızca "Kullanıcı hesabı silinemedi" görüyordu. Nedeni ayırt edilebilir
        // biçimde döndür: 500 = veritabanı tarafı, 400 = Auth/istemci tarafı.
        const detail = String((deleteAuthError as { message?: unknown }).message ?? deleteAuthError);
        const databaseSide = /23502|null value|audit_logs|trigger|row-level security|42501|42703|42P01/i.test(detail);
        if (databaseSide) {
          return response(request, 500, {
            error: 'Kullanıcı silinemedi: veritabanı şeması güncel değil. Yönetici `supabase db push` çalıştırmalı (audit_logs.actor NOT NULL onarımı gerekir).',
          });
        }
        return response(request, 400, { error: 'Kullanıcı silinirken hata oluştu' });
      }
      return response(request, 200, { ok: true });
    }

    return response(request, 400, { error: 'Unknown action' });
  } catch (error) {
    return response(request, 400, { error: error instanceof Error ? error.message : 'Request rejected' });
  }
});
