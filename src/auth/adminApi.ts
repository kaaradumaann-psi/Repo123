import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { requireSupabase, supabaseConfig } from './supabaseClient';
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

/** Edge Function gövdesinden okunabilir bir mesaj çıkarır; hiçbir zaman ham gövdeyi sızmaz. */
function detailFromBody(body: unknown): string {
  if (!body || typeof body !== 'object') return '';
  const value = (body as { error?: unknown }).error;
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().replace(/[\u0000-\u001f\u007f]/g, ' ');
  return trimmed.slice(0, 200);
}

function originHint(): string {
  if (typeof window === 'undefined' || !window.location?.origin) return '';
  return ` (bu uygulamanın origin'i: ${window.location.origin})`;
}

/** Mesajın sonuna HTTP durum kodunu ekler; zaten yazılıysa tekrarlamaz. */
function withStatus(message: string, status: number): string {
  const trimmed = message.trim();
  return trimmed.endsWith(`(${status})`) ? trimmed : `${trimmed} (${status}).`;
}

/**
 * Edge Function hatalarını **gerçek nedene** göre açıklar.
 *
 * Önceki sürüm tüm başarısızlıkları tek cümlede ("Edge Function bağlantısını kontrol
 * edin") eziyordu; bu yüzden origin allowlist'i, oturum süresi, bulunamayan psikolog ve
 * veritabanı hatası birbirinden ayırt edilemiyordu. supabase-js üç farklı hata sınıfı
 * döndürür:
 *   - FunctionsHttpError  → function yanıt verdi (context = Response, gövde okunabilir)
 *   - FunctionsRelayError → Supabase relay fonksiyona ulaşamadı (context = Response)
 *   - FunctionsFetchError → tarayıcı isteği hiç tamamlayamadı (context = TypeError)
 *                           pratikte ya ağ ya da **CORS/ALLOWED_ORIGINS** demektir
 */
export async function explainEdgeFunctionError(cause: unknown, fallback: string): Promise<string> {
  // Sınıf kontrolü ÖNCE gelir: FunctionsRelayError da context olarak Response taşır,
  // bu yüzden önce gövdeye bakılırsa "relay fonksiyona ulaşamadı" bilgisi kaybolur.
  if (cause instanceof FunctionsRelayError) {
    return 'Supabase relay Edge Function’a ulaşamadı (fonksiyon yanıt vermedi). admin-users deploy edilmiş ve aktif mi kontrol edin.';
  }

  if (cause instanceof FunctionsFetchError) {
    return `Edge Function isteği tarayıcıdan tamamlanamadı${originHint()}. En olası neden: ALLOWED_ORIGINS secret'ında bu sitenin adresi yok (CORS) ya da fonksiyon deploy edilmemiş. ` +
      'Yönetici: supabase functions deploy admin-users && supabase secrets set ALLOWED_ORIGINS=<uygulama adresi>';
  }

  const context = (cause as { context?: unknown } | null)?.context;
  if (cause instanceof FunctionsHttpError || context instanceof Response) {
    const response = context as Response;
    let body: unknown = null;
    try { body = await response.clone().json(); } catch {
      try { body = { error: (await response.clone().text()).slice(0, 200) }; } catch { body = null; }
    }
    const detail = detailFromBody(body);
    switch (response.status) {
      case 400:
        return withStatus(detail || 'İstek Edge Function tarafından reddedildi', response.status);
      case 401:
        return withStatus('Oturumunuz doğrulanamadı veya süresi doldu; çıkış yapıp yeniden giriş yapın', response.status);
      case 403: {
        if (/origin/i.test(detail)) {
          return `Edge Function bu site origin'ine izin vermiyor (403). Yönetici \`supabase secrets set ALLOWED_ORIGINS=<uygulama adresi>\` çalıştırmalı${originHint()}.`;
        }
        return withStatus(detail || 'Bu işlem için aktif Admin hesabı gerekiyor', response.status);
      }
      case 404:
        return withStatus(detail || 'Hedef kullanıcı bulunamadı veya silinebilir bir Psikolog hesabı değil', response.status);
      case 405:
        return withStatus('Edge Function bu isteği kabul etmiyor; fonksiyon güncel sürümle yeniden deploy edilmeli', response.status);
      case 413:
        return withStatus('İstek çok büyük', response.status);
      case 500:
        return withStatus(`${detail || 'Edge Function sunucu hatası'}. Veritabanı şeması güncel değilse yönetici \`supabase db push\` çalıştırmalı`, response.status);
      case 503:
      case 504:
        return withStatus('Edge Function şu anda yanıt vermiyor; kısa süre sonra yeniden deneyin', response.status);
      default:
        return withStatus(detail || fallback, response.status);
    }
  }

  if (cause instanceof Error && cause.message.trim()) return cause.message;
  return fallback;
}

async function invokeAdmin(action: Record<string, unknown>, fallback: string): Promise<{ data: unknown; error: string | null }> {
  let result: { data: unknown; error: unknown };
  try {
    result = await requireSupabase().functions.invoke('admin-users', { body: action });
  } catch (cause) {
    return { data: null, error: await explainEdgeFunctionError(cause, fallback) };
  }
  if (result.error) return { data: null, error: await explainEdgeFunctionError(result.error, fallback) };
  return { data: result.data, error: null };
}

export async function listPsychologists(): Promise<AuthenticatedUser[]> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('id,email,first_name,last_name,role,active')
    .eq('role', 'PSYCHOLOG')
    .order('created_at', { ascending: true });
  if (error) {
    throw new Error(
      error.code === '42P01'
        ? 'Psikolog listesi alınamadı: profiles tablosu veritabanında yok. Yönetici `supabase db push` çalıştırmalı.'
        : 'Psikolog listesi alınamadı.',
    );
  }
  return (data ?? []).map(rowToUser);
}

export async function createPsychologist(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthenticatedUser> {
  const { data, error } = await invokeAdmin(
    {
      action: 'create',
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      password: input.password,
    },
    'Psikolog hesabı oluşturulamadı.',
  );
  if (error) throw new Error(error);
  const profile = (data as { profile?: unknown } | null)?.profile;
  if (!profile) throw new Error('Psikolog hesabı oluşturuldu ancak profil bilgisi alınamadı.');
  return rowToUser(profile);
}

export async function setPsychologistActive(userId: string, active: boolean): Promise<AuthenticatedUser> {
  const { data, error } = await invokeAdmin({ action: 'set_active', userId, active }, 'Hesap durumu değiştirilemedi.');
  if (error) throw new Error(error);
  const profile = (data as { profile?: unknown } | null)?.profile;
  if (!profile) throw new Error('Güncel kullanıcı profili alınamadı.');
  return rowToUser(profile);
}

export async function deletePsychologist(userId: string): Promise<void> {
  // Account deletion is deliberately Edge-Function-only. A direct profile DELETE would leave an
  // orphaned Auth user (or cascade data without deleting the credentials) when the function is
  // unavailable, which is worse than showing an actionable deployment error.
  const { data, error } = await invokeAdmin({ action: 'delete', userId }, 'Kullanıcı hesabı silinemedi.');
  if (error) throw new Error(`Kullanıcı hesabı silinemedi. ${error}`);
  if (!(data as { ok?: boolean } | null)?.ok) {
    throw new Error(
      `Kullanıcı hesabı silinemedi. Edge Function beklenmeyen bir yanıt döndürdü. ` +
      `Proje: ${supabaseConfig.url || 'yapılandırılmamış'} — function güncel mi, ALLOWED_ORIGINS doğru mu kontrol edin.`,
    );
  }
}
