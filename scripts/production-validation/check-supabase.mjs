/**
 * 02 — Canlı Supabase bağlantısı (rapor §4).
 * HTTPS, Auth, REST API ve Edge uçlarının GERÇEK production örneğine karşı
 * doğrulanması. Local/mock sonucu hiçbir zaman PASS olarak yazılmaz.
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { supabaseEnv } from './lib/supabase.mjs';
import { request, errorCodeOf } from './lib/http.mjs';
import { authHealth, edgeFunction } from './lib/supabase.mjs';

export async function run(ctx) {
  const out = new Collector('Supabase');
  const env = ctx.supabase ?? supabaseEnv();
  if (!env) {
    out.blocked('Supabase canlı bağlantısı', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', {
      expected: 'production Supabase erişimi', severity: SEVERITY.CRITICAL,
      action: 'Runbook: Environment variables bölümü.',
    });
    return out;
  }

  // REST API (PostgREST OpenAPI kökü) — canlı şema önbelleği kanıtı.
  const rest = await request(`${env.url}/rest/v1/`, { headers: { apikey: env.anonKey, Accept: 'application/json' } });
  if (!rest.ok) {
    out.blocked('Database REST API', `erişilemiyor (${rest.error})`, { expected: 'HTTP 200', endpoint: '/rest/v1/', severity: SEVERITY.CRITICAL, action: 'SUPABASE_URL doğru mu? Proje pause durumda olabilir (Dashboard → Restore).' });
  } else {
    const defs = rest.json?.definitions && typeof rest.json.definitions === 'object' ? Object.keys(rest.json.definitions).length : 0;
    if (rest.status === 200) out.pass('Database REST API', 'HTTP 200 + şema tanımları', `HTTP 200 · ${defs} tablo tanımı`, { endpoint: '/rest/v1/', severity: SEVERITY.CRITICAL });
    else out.fail('Database REST API', 'HTTP 200', `HTTP ${rest.status}`, { endpoint: '/rest/v1/', severity: SEVERITY.CRITICAL, action: 'Anon key doğru mu? Dashboard → Settings → API.' });
    ctx.restDefinitions = rest.json?.definitions ?? null;
  }

  // Auth servisi.
  const health = await authHealth(env);
  if (!health.ok) out.blocked('Authentication API', `erişilemiyor (${health.error})`, { expected: 'HTTP 200', endpoint: '/auth/v1/health', severity: SEVERITY.CRITICAL });
  else if (health.status === 200) out.pass('Authentication API', 'HTTP 200', 'HTTP 200', { endpoint: '/auth/v1/health', severity: SEVERITY.CRITICAL });
  else out.fail('Authentication API', 'HTTP 200', `HTTP ${health.status}`, { endpoint: '/auth/v1/health', severity: SEVERITY.CRITICAL });

  // Auth kapısının gerçekten canlı olduğu (yanlış parola → 4xx hata kodu; token YOK).
  const wrong = await request(`${env.url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mmpi-prod-validation-probe@example.invalid', password: 'not-a-real-password-000' }),
  });
  if (!wrong.ok) out.blocked('Authentication API (negatif kimlik)', `erişilemiyor (${wrong.error})`, { expected: 'HTTP 4xx', severity: SEVERITY.HIGH });
  else if (wrong.status >= 400 && wrong.status < 500) {
    out.pass('Authentication API (negatif kimlik)', 'HTTP 4xx + token yok', `HTTP ${wrong.status} · kod=${errorCodeOf(wrong.json) ?? 'yok'}`, { severity: SEVERITY.HIGH });
  } else out.fail('Authentication API (negatif kimlik)', 'HTTP 4xx + token yok', `HTTP ${wrong.status}`, { severity: SEVERITY.HIGH, action: 'Geçersiz kimliğe oturum dönülmemelidir.' });

  // Edge Function uçları canlı mı (kimliksiz çağrı → 401/403 beklenir = dağıtılmış + kapı geçiyor).
  for (const fn of ['admin-users', 'ai-interpretation']) {
    const probe = await edgeFunction(env, fn, { body: {} });
    if (!probe.ok) {
      out.blocked(`Edge endpoint: ${fn}`, `erişilemiyor (${probe.error})`, { expected: 'HTTP 401/403 (kimliksiz)', endpoint: `/functions/v1/${fn}`, severity: SEVERITY.CRITICAL, action: `supabase functions deploy ${fn}` });
    } else if (probe.status === 401 || probe.status === 403) {
      out.pass(`Edge endpoint: ${fn}`, 'kimliksiz → 401/403', `HTTP ${probe.status}`, { endpoint: `/functions/v1/${fn}`, severity: SEVERITY.CRITICAL });
    } else if (probe.status === 404) {
      out.fail(`Edge endpoint: ${fn}`, 'dağıtılmış (401/403)', 'HTTP 404 — function production’da YOK', { endpoint: `/functions/v1/${fn}`, severity: SEVERITY.CRITICAL, action: `supabase functions deploy ${fn}` });
    } else {
      out.fail(`Edge endpoint: ${fn}`, 'kimliksiz → 401/403', `HTTP ${probe.status}`, { endpoint: `/functions/v1/${fn}`, severity: SEVERITY.CRITICAL, action: 'verify_jwt=true ve function auth kontrolü beklenen davranışı vermiyor.' });
    }
  }

  return out;
}
