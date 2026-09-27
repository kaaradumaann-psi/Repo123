/**
 * Tek kullanımlık (disposable) doğrulama fixture'ları.
 *
 * Kurallar (rapor §29/§30):
 *  - Tüm fixture'lar `MMPI_PROD_VALIDATION` önekiyle etiketlenir; gerçek
 *    danışan verisi ASLA kullanılmaz veya çapraz hedef yapılmaz.
 *  - Yazma işlemleri yalnızca LIVE_MATRIX_ALLOW_WRITES=YES iken yapılır;
 *    yıkıcı kullanıcı silme akışı ayrıca PRODUCTION_VALIDATION_CONFIRM=YES
 *    ister.
 *  - Her oturum kendi fixture'ını oluşturur; çapraz kullanıcı hedefleri
 *    yalnızca bu etiketli fixture kimlikleridir.
 */
import { randomUUID, randomBytes } from 'node:crypto';
import { rest, signIn, jwtSubject, supabaseEnv } from './supabase.mjs';
import { request } from './http.mjs';
import { envValue } from './env.mjs';

export const FIXTURE_TAG = 'MMPI_PROD_VALIDATION';
export const DISPOSABLE_EMAIL_PREFIX = 'mmpi-prod-validation-';

export function istanbulToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date());
}

const ROLE_ENV = {
  userA: ['TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD'],
  userB: ['TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD'],
  admin: ['TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD'],
  inactive: ['TEST_INACTIVE_EMAIL', 'TEST_INACTIVE_PASSWORD'],
};

export const ROLE_LABELS = { userA: 'User A', userB: 'User B', admin: 'Admin', inactive: 'Inactive' };

/**
 * Ortam değişkenleri tanımlı roller için oturum açar; ctx.sessions'a yazar.
 * Tokenlar yalnızca süreç belleğindedir, artifact'a yazılmaz.
 */
export async function ensureSessions(ctx) {
  if (ctx.sessions) return ctx.sessions;
  const env = supabaseEnv();
  const sessions = {};
  for (const role of Object.keys(ROLE_ENV)) {
    const [emailName, passwordName] = ROLE_ENV[role];
    const email = envValue(emailName);
    const password = envValue(passwordName);
    if (!email || !password) { sessions[role] = { ok: false, missingEnv: true }; continue; }
    if (!env) { sessions[role] = { ok: false, blocked: true }; continue; }
    try {
      const result = await signIn(env, email, password);
      if (result.ok && result.token) {
        sessions[role] = {
          ok: true,
          token: result.token,
          userId: result.userId ?? jwtSubject(result.token),
          status: 200,
          authBanned: false,
        };
      } else {
        sessions[role] = {
          ok: false,
          status: result.status ?? null,
          error: result.error ?? null,
          errorCode: result.errorCode ?? null,
          // GoTrue, ban yemiş hesaplarda oturum vermez — bu beklenen bir fail-closed davranışıdır.
          authBanned: result.ok && result.status === 400 && !result.errorCode,
        };
      }
    } catch (error) {
      sessions[role] = { ok: false, error: String(error?.message || error).slice(0, 120) };
    }
  }
  ctx.sessions = sessions;
  return sessions;
}

/** Geçerli kayıt yükü (20260919020000 intake tetikleyicisi sözleşmesi): raw yöntemi. */
export function recordPayload(label) {
  return {
    idempotency_key: randomUUID(),
    client_first_name: FIXTURE_TAG,
    client_last_name: label,
    gender: 'Diğer',
    age: 33,
    occupation: 'VALIDATION — do-not-use',
    education: 'VALIDATION',
    application_date: istanbulToday(),
    requested_by: FIXTURE_TAG,
    raw_omr_answers: [
      { kind: 'case-meta', version: '1', method: 'raw' },
      { kind: 'raw-scores', scales: { Hs: 10 }, synthetic: true, validation: 'do-not-use' },
    ],
  };
}

export function reportPayload(recordId) {
  return {
    mmpi_record_id: recordId,
    template_id: null,
    template_name: `${FIXTURE_TAG}_TEMPLATE`,
    title: `${FIXTURE_TAG} REPORT — do-not-use`,
    content: { schemaVersion: 1, blocks: [], synthetic: true, validation: 'do-not-use' },
    source_data_snapshot: { synthetic: true, validation: 'do-not-use', source: 'production-validation' },
    source_data_version: 'production-validation',
    save_reason: 'create',
  };
}

export function templatePayload() {
  return {
    name: `${FIXTURE_TAG}_TEMPLATE_${randomBytes(4).toString('hex')}`,
    content: { schemaVersion: 1, blocks: [], synthetic: true, validation: 'do-not-use' },
    is_system: false,
  };
}

export function settingsPayload() {
  return { letterhead: { synthetic: true, validation: 'do-not-use' } };
}

/** POST … Prefer: return=representation → yalnızca oluşturulan satırın id'si alınır. */
async function insertReturningId(ctx, path, token, body) {
  const response = await request(`${ctx.supabase.url}${path}`, {
    method: 'POST',
    headers: {
      apikey: ctx.supabase.anonKey,
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) return { status: null, id: null, error: response.error };
  const rows = Array.isArray(response.json) ? response.json : [];
  return { status: response.status, id: typeof rows[0]?.id === 'string' ? rows[0].id : null, rowCount: rows.length };
}

async function selectSingleId(ctx, path, token) {
  const response = await request(`${ctx.supabase.url}${path}`, {
    headers: { apikey: ctx.supabase.anonKey, Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  if (!response.ok || !Array.isArray(response.json)) return null;
  return typeof response.json[0]?.id === 'string' ? response.json[0].id : null;
}

/**
 * Bir rol için tam fixture zinciri: kayıt → rapor → sürüm (trigger) → şablon → ayar.
 * ctx.fixtures[roleKey] olarak önbelleğe alınır; yalnızca writesAllowed iken çağrılır.
 */
export async function createUserFixtures(ctx, roleKey) {
  ctx.fixtures ||= {};
  if (ctx.fixtures[roleKey]?.ok) return ctx.fixtures[roleKey];
  const session = ctx.sessions?.[roleKey];
  if (!session?.ok || !session.token) {
    ctx.fixtures[roleKey] = { ok: false, reason: 'oturum yok' };
    return ctx.fixtures[roleKey];
  }
  const out = { ok: true, createdAt: new Date().toISOString() };
  const label = `DO-NOT-USE ${randomBytes(4).toString('hex')}`;

  const record = await insertReturningId(ctx, '/rest/v1/mmpi_records?select=id', session.token, recordPayload(label));
  if (!record.id) {
    ctx.fixtures[roleKey] = { ok: false, reason: `kayıt fixture'ı oluşturulamadı (HTTP ${record.status ?? record.error})`, status: record.status ?? null };
    return ctx.fixtures[roleKey];
  }
  out.recordId = record.id;

  const report = await insertReturningId(ctx, '/rest/v1/mmpi_reports?select=id', session.token, reportPayload(out.recordId));
  if (report.id) out.reportId = report.id;

  if (out.reportId) {
    out.versionId = await selectSingleId(
      ctx, `/rest/v1/mmpi_report_versions?report_id=eq.${out.reportId}&select=id&order=version_number.asc&limit=1`, session.token,
    );
  }

  const template = await insertReturningId(ctx, '/rest/v1/mmpi_report_templates?select=id', session.token, templatePayload());
  if (template.id) out.templateId = template.id;

  const settings = await rest(ctx.supabase, '/rest/v1/psychologist_report_settings?on_conflict=created_by', {
    token: session.token, method: 'POST', body: settingsPayload(), prefer: 'resolution=merge-duplicates',
  });
  out.settingsWritten = settings.status === 200 || settings.status === 201 || settings.status === 204;

  ctx.fixtures[roleKey] = out;
  ctx.cleanup ||= [];
  ctx.cleanup.push(async () => {
    if (out.reportId) await rest(ctx.supabase, `/rest/v1/mmpi_reports?id=eq.${out.reportId}`, { token: session.token, method: 'DELETE' });
    if (out.recordId) await rest(ctx.supabase, `/rest/v1/mmpi_records?id=eq.${out.recordId}`, { token: session.token, method: 'DELETE' });
    if (out.templateId) await rest(ctx.supabase, `/rest/v1/mmpi_report_templates?id=eq.${out.templateId}`, { token: session.token, method: 'DELETE' });
    if (out.settingsWritten && session.userId) {
      await rest(ctx.supabase, `/rest/v1/psychologist_report_settings?created_by=eq.${session.userId}`, { token: session.token, method: 'DELETE' });
    }
  });
  return out;
}

/**
 * Salt-okunur fixture keşfi: yazma kapalıyken ÖNCEKİ etiketli fixture'ları bulur.
 * Gerçek (etiketsiz) üretim verisine asla dokunmaz.
 */
export async function discoverUserFixtures(ctx, roleKey) {
  ctx.fixtures ||= {};
  if (ctx.fixtures[roleKey]?.recordId) return ctx.fixtures[roleKey];
  const session = ctx.sessions?.[roleKey];
  if (!session?.ok || !session.token) return null;
  const out = { ok: true, discovered: true };
  out.recordId = await selectSingleId(ctx, `/rest/v1/mmpi_records?client_first_name=eq.${FIXTURE_TAG}&select=id&limit=1`, session.token);
  if (out.recordId) {
    out.reportId = await selectSingleId(ctx, `/rest/v1/mmpi_reports?mmpi_record_id=eq.${out.recordId}&select=id&limit=1`, session.token);
    if (out.reportId) {
      out.versionId = await selectSingleId(
        ctx, `/rest/v1/mmpi_report_versions?report_id=eq.${out.reportId}&select=id&limit=1`, session.token,
      );
    }
    out.templateId = await selectSingleId(
      ctx, `/rest/v1/mmpi_report_templates?name=like.${FIXTURE_TAG}_TEMPLATE_*&select=id&limit=1`, session.token,
    );
  }
  ctx.fixtures[roleKey] = { ...ctx.fixtures[roleKey], ...out };
  return ctx.fixtures[roleKey];
}

/** Çalıştırma sonu temizliği: yalnızca BU çalıştırmada oluşturulan fixture'lar. */
export async function cleanupRunFixtures(ctx) {
  if (!Array.isArray(ctx.cleanup)) return { attempted: 0 };
  let attempted = 0;
  for (const fn of ctx.cleanup) {
    attempted += 1;
    try { await fn(); } catch { /* en iyi çaba: silinemeyen satır etiketiyle ayırt edilir */ }
  }
  return { attempted };
}
