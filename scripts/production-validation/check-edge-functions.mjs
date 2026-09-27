/**
 * 08 — Edge Function güvenliği (rapor §10, §11, §12, §13, §16-CORS uçları).
 *
 * admin-users ve ai-interpretation CANLI production uçlarına karşı:
 *  - kimliksiz / geçersiz token / inactive / psychologist / admin davranışları
 *  - girdi doğrulaması (bozuk JSON, bilinmeyen action, geçersiz mode/UUID,
 *    NaN/Infinity/ölçek dışı sayılar, aşırı gövde 64KiB)
 *  - sahiplik (record modunda çapraz kullanıcı recordId → 403)
 *  - AI sözleşmesi: 566 ham cevap request body'sine giremez (schema reddi)
 *  - CORS: production origin / yabancı origin / null origin ayrımı
 *  - hız limiti: gözlenirse kanıt; distributed limiter YOKSA NOT_VERIFIED
 */
import { Collector, SEVERITY } from './lib/output.mjs';
import { edgeFunction } from './lib/supabase.mjs';
import { originOf } from './lib/http.mjs';
import { writesAllowed, envValue } from './lib/env.mjs';
import { ensureSessions } from './lib/fixtures.mjs';

function expectStatus(out, check, probe, expected, { severity = SEVERITY.CRITICAL, endpoint, resource, action = null }) {
  const text = Array.isArray(expected) ? `HTTP ${expected.join('/')}` : `HTTP ${expected}`;
  if (!probe.ok) return out.blocked(check, `bağlantı (${probe.error})`, { expected: text, endpoint, resource, severity });
  const ok = Array.isArray(expected) ? expected.includes(probe.status) : probe.status === expected;
  if (ok) return out.pass(check, text, `HTTP ${probe.status}`, { endpoint, resource, severity });
  return out.fail(check, text, `HTTP ${probe.status}`, { endpoint, resource, severity, action });
}

function validDraftProfile() {
  return {
    gender: 'Erkek',
    method: 'raw',
    client: { age: 33 },
    scales: [
      { id: '?', raw: 0, k: null, t: 0, level: 'other' },
      { id: 'L', raw: 4, k: null, t: 52, level: 'normal' },
    ],
    validity: { cannotSay: 0, l: 4, f: 8, k: 12, fMinusK: -4, flags: [] },
  };
}

export async function run(ctx) {
  const out = new Collector('Edge Functions');
  const cors = new Collector('CORS');
  if (!ctx.supabase) {
    out.blocked('Edge Function doğrulaması', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return [out, cors];
  }
  const sessions = await ensureSessions(ctx);
  const productionOrigin = originOf(envValue('PRODUCTION_URL') || '');
  const evilOrigin = 'https://mmpi-validation-evil.example';

  /* ------------------------------ CORS ------------------------------ */
  for (const fn of ['admin-users', 'ai-interpretation']) {
    const endpoint = `/functions/v1/${fn}`;
    if (productionOrigin) {
      const allowed = await edgeFunction(ctx.supabase, fn, { method: 'OPTIONS', origin: productionOrigin, extraHeaders: { 'Access-Control-Request-Method': 'POST' } });
      if (!allowed.ok) cors.blocked(`${fn} preflight (production origin)`, `bağlantı (${allowed.error})`, { expected: `ACAO = ${productionOrigin}`, endpoint, severity: SEVERITY.HIGH });
      else {
        const acao = allowed.headers.get('access-control-allow-origin');
        if (acao === productionOrigin) cors.pass(`${fn} preflight (production origin)`, `ACAO = ${productionOrigin}`, `ACAO = ${acao}`, { endpoint, severity: SEVERITY.HIGH });
        else if (acao === '*') cors.conditional(`${fn} preflight (production origin)`, `ACAO = ${productionOrigin} (allowlist)`, 'ACAO = * — allowlist yerine wildcard', { endpoint, severity: SEVERITY.MEDIUM, action: 'Function içi allowlist davranışı gölgelenmiş olabilir; gateway yapılandırmasını inceleyin.' });
        else cors.fail(`${fn} preflight (production origin)`, `ACAO = ${productionOrigin}`, `ACAO = ${acao ?? 'yok'}`, { endpoint, severity: SEVERITY.HIGH, action: `supabase secrets set ALLOWED_ORIGINS=${productionOrigin} (ve functions deploy)` });
      }
    } else {
      cors.blocked(`${fn} preflight (production origin)`, 'PRODUCTION_URL tanımsız', { severity: SEVERITY.HIGH });
    }
    const foreign = await edgeFunction(ctx.supabase, fn, { method: 'OPTIONS', origin: evilOrigin, extraHeaders: { 'Access-Control-Request-Method': 'POST' } });
    if (!foreign.ok) cors.blocked(`${fn} preflight (yabancı origin)`, `bağlantı (${foreign.error})`, { expected: 'ACAO yok veya origin yansıtılmaz', endpoint, severity: SEVERITY.HIGH });
    else {
      const acao = foreign.headers.get('access-control-allow-origin');
      if (!acao) cors.pass(`${fn} preflight (yabancı origin)`, 'ACAO yok (fail-closed)', 'ACAO yok', { endpoint, severity: SEVERITY.HIGH });
      else if (acao === evilOrigin) cors.fail(`${fn} preflight (yabancı origin)`, 'ACAO yok (fail-closed)', `ACAO = ${acao} — her siteye açık!`, { endpoint, severity: SEVERITY.CRITICAL, action: 'ALLOWED_ORIGINS yabancı origin içeriyor; derhal düzeltin.' });
      else if (acao === '*') cors.conditional(`${fn} preflight (yabancı origin)`, 'fail-closed', 'ACAO = * (token-tabanlı API; tarayıcı koruması zayıflar)', { endpoint, severity: SEVERITY.MEDIUM });
      else cors.pass(`${fn} preflight (yabancı origin)`, 'origin yansıtılmaz', `ACAO = ${acao} (yabancı origin yansıtılmadı)`, { endpoint, severity: SEVERITY.HIGH });
    }
    const withOrigin = await edgeFunction(ctx.supabase, fn, { origin: evilOrigin, body: {} });
    if (withOrigin.ok) {
      if (withOrigin.status === 403) cors.pass(`${fn} POST (yabancı origin)`, '403 Origin not allowed', `HTTP ${withOrigin.status}`, { endpoint, severity: SEVERITY.HIGH });
      else cors.conditional(`${fn} POST (yabancı origin)`, '403 (origin allowlist)', `HTTP ${withOrigin.status} — function uygulama-düzeyinde engellemedi`, { endpoint, severity: SEVERITY.MEDIUM });
    } else cors.blocked(`${fn} POST (yabancı origin)`, `bağlantı (${withOrigin.error})`, { endpoint, severity: SEVERITY.HIGH });
  }

  /* --------------------------- admin-users --------------------------- */
  const adminEp = '/functions/v1/admin-users';
  expectStatus(out, 'admin-users: kimliksiz → DENY', await edgeFunction(ctx.supabase, 'admin-users', { body: { action: 'list' } }), [401, 403], { endpoint: adminEp });
  expectStatus(out, 'admin-users: geçersiz token → DENY', await edgeFunction(ctx.supabase, 'admin-users', { token: 'invalid.token.value', body: { action: 'list' } }), [401, 403], { endpoint: adminEp });
  if (sessions.userA?.ok) {
    expectStatus(out, 'admin-users: psychologist → DENY', await edgeFunction(ctx.supabase, 'admin-users', { token: sessions.userA.token, body: { action: 'unknown-action' } }), 403, { endpoint: adminEp });
  } else out.blocked('admin-users: psychologist → DENY', 'User A oturumu yok', { severity: SEVERITY.CRITICAL, endpoint: adminEp });
  if (sessions.inactive?.ok) {
    expectStatus(out, 'admin-users: inactive → DENY', await edgeFunction(ctx.supabase, 'admin-users', { token: sessions.inactive.token, body: { action: 'list' } }), [401, 403], { endpoint: adminEp, severity: SEVERITY.HIGH });
  } else out.skipped('admin-users: inactive → DENY (uygulama içi)', 'inactive oturumu yok (auth düzeyinde kapalıysa zaten fail-closed)', { severity: SEVERITY.HIGH, endpoint: adminEp });
  if (sessions.admin?.ok) {
    expectStatus(out, 'admin-users: admin + bilinmeyen action → 400 (input validation)', await edgeFunction(ctx.supabase, 'admin-users', { token: sessions.admin.token, body: { action: 'definitely-unknown' } }), 400, { endpoint: adminEp });
    expectStatus(out, 'admin-users: admin + bozuk JSON → 400', await edgeFunction(ctx.supabase, 'admin-users', { token: sessions.admin.token, rawBody: '{not-json' }), 400, { endpoint: adminEp });
    expectStatus(out, 'admin-users: admin + geçersiz create yükü → 400', await edgeFunction(ctx.supabase, 'admin-users', { token: sessions.admin.token, body: { action: 'create', firstName: 'x', lastName: '', email: 'not-an-email', password: '123' } }), 400, { endpoint: adminEp });
    out.notApplicable('admin-users: admin + create/delete ALLOW', 'Deletion bölümünde uçtan uca kanıtlanır (çapraz doğrulama)');
  } else {
    out.blocked('admin-users: admin rol doğrulamaları', 'TEST_ADMIN_* oturumu yok', { severity: SEVERITY.CRITICAL, endpoint: adminEp });
  }

  /* ------------------------- ai-interpretation ------------------------ */
  const aiEp = '/functions/v1/ai-interpretation';
  expectStatus(out, 'ai-interpretation: kimliksiz → DENY', await edgeFunction(ctx.supabase, 'ai-interpretation', { body: { mode: 'draft', profile: validDraftProfile() } }), [401, 403], { endpoint: aiEp });
  expectStatus(out, 'ai-interpretation: geçersiz token → DENY', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: 'invalid.token.value', body: { mode: 'draft', profile: validDraftProfile() } }), [401, 403], { endpoint: aiEp });
  if (sessions.userA?.ok) {
    expectStatus(out, 'ai-interpretation: GET metodu → 405', await edgeFunction(ctx.supabase, 'ai-interpretation', { method: 'GET', token: sessions.userA.token }), 405, { endpoint: aiEp, severity: SEVERITY.LOW });
  }
  if (sessions.inactive?.ok) {
    expectStatus(out, 'ai-interpretation: inactive → DENY', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: sessions.inactive.token, body: { mode: 'draft', profile: validDraftProfile() } }), [401, 403], { endpoint: aiEp, severity: SEVERITY.HIGH });
  } else out.skipped('ai-interpretation: inactive → DENY', 'inactive oturumu yok', { severity: SEVERITY.HIGH, endpoint: aiEp });

  if (sessions.userA?.ok) {
    const tokenA = sessions.userA.token;
    expectStatus(out, 'ai: bozuk JSON → 400', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, rawBody: '{not-json' }), 400, { endpoint: aiEp });
    expectStatus(out, 'ai: geçersiz mode → 400', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'everything', profile: validDraftProfile() } }), 400, { endpoint: aiEp });
    expectStatus(out, 'ai: recordId UUID değil → 400', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'record', recordId: 'not-a-uuid', profile: validDraftProfile() } }), 400, { endpoint: aiEp });

    const nanProfile = validDraftProfile();
    nanProfile.scales[1].t = 'NaN';
    expectStatus(out, 'ai: sayısal alan NaN-string → 400', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'draft', profile: nanProfile } }), 400, { endpoint: aiEp });

    const badScale = validDraftProfile();
    badScale.scales[1].id = 'HACKED';
    expectStatus(out, 'ai: bilinmeyen ölçek kimliği → 400', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'draft', profile: badScale } }), 400, { endpoint: aiEp });

    const huge = { mode: 'draft', profile: validDraftProfile(), padding: 'x'.repeat(70 * 1024) };
    expectStatus(out, 'ai: >64KiB gövde → 413', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: huge }), [400, 413], { endpoint: aiEp });

    // 566 HAM CEVAP sözleşmesi: request body'sinde raw answers taşınamaz.
    const rawAnswers = { mode: 'draft', profile: { ...validDraftProfile(), answers: Array.from({ length: 566 }, () => 'D') } };
    expectStatus(out, 'ai: 566 ham cevap yükü reddedilir (scoring izolasyonu)', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: rawAnswers }), 400, { endpoint: aiEp, severity: SEVERITY.CRITICAL, action: 'AI sözleşmesi ihlali: ham yanıtlar endpoint’e kabul edilmemeli.' });

    // Sahiplik: A → B kaydı (record modu).
    if (ctx.fixtures?.userB?.recordId) {
      expectStatus(out, 'ai: User A → User B recordId → 403 (ownership)', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'record', recordId: ctx.fixtures.userB.recordId, profile: validDraftProfile() } }), 403, { endpoint: aiEp, severity: SEVERITY.CRITICAL });
    } else {
      out.blocked('ai: çapraz-kullanıcı recordId reddi', 'User B kayıt fixture’ı yok', { endpoint: aiEp, severity: SEVERITY.CRITICAL, action: writesAllowed() ? 'Fixture üretimi RLS bölümünde başarısız olmuş olabilir.' : 'LIVE_MATRIX_ALLOW_WRITES=YES ile çalıştırın.' });
    }
    expectStatus(out, 'ai: var olmayan recordId → RED (4xx)', await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'record', recordId: '00000000-0000-4000-8000-00000000dead', profile: validDraftProfile() } }), [400, 403, 404], { endpoint: aiEp, severity: SEVERITY.HIGH });

    // Kendi kaydıyla record modu: AI_API_KEY tanımlı değilse 503 da kabul (yapılandırma
    // fail-closed); asla 401/403 döndürmemeli (sahiplik+rol geçerli).
    if (ctx.fixtures?.userA?.recordId) {
      const own = await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'record', recordId: ctx.fixtures.userA.recordId, profile: validDraftProfile() } });
      if (!own.ok) out.blocked('ai: User A → own recordId → ALLOW', `bağlantı (${own.error})`, { endpoint: aiEp, severity: SEVERITY.CRITICAL });
      else if (own.status === 200) out.pass('ai: User A → own recordId → ALLOW', 'HTTP 200 (yorum üretildi)', 'HTTP 200', { endpoint: aiEp, severity: SEVERITY.CRITICAL });
      else if (own.status === 503) out.conditional('ai: User A → own recordId → ALLOW', 'HTTP 200', 'HTTP 503 — AI_API_KEY tanımsız (fail-closed yapılandırma; sahiplik/rol kontrolleri GEÇTİ)', { endpoint: aiEp, severity: SEVERITY.MEDIUM });
      else if (own.status === 429) out.conditional('ai: User A → own recordId → ALLOW', 'HTTP 200', 'HTTP 429 — hız limiti devrede (ownership kontrolleri öncesinde geçti)', { endpoint: aiEp, severity: SEVERITY.MEDIUM });
      else out.fail('ai: User A → own recordId → ALLOW', 'HTTP 200/503/429', `HTTP ${own.status}`, { endpoint: aiEp, severity: SEVERITY.CRITICAL, action: 'Sahip olduğu kayıt reddediliyor — ownership karşılaştırmasını inceleyin.' });
    }

    // Hız limiti gözlemi (instance-local → CONDITIONAL; distributed kanıtı yok).
    const burst = [];
    for (let i = 0; i < 3; i += 1) {
      burst.push(await edgeFunction(ctx.supabase, 'ai-interpretation', { token: tokenA, body: { mode: 'record', recordId: '00000000-0000-4000-8000-00000000dead', profile: validDraftProfile() } }));
    }
    const saw429 = burst.some((r) => r.ok && r.status === 429);
    if (saw429) {
      out.conditional('ai: hız limiti (rate limit)', 'kullanıcı başına kısıt gözlenir', '429 gözlendi (instance-local sözleşmesi)', { endpoint: aiEp, severity: SEVERITY.MEDIUM, action: 'INSTANCE_LOCAL: cold-start ile sıfırlanır; dağıtık limiter için ayrı çözüm gerekir.' });
    } else {
      out.conditional('ai: hız limiti (rate limit)', 'ardışık isteklerde 429', `3 burst istekte 429 gözlenmedi (${burst.map((b) => (b.ok ? b.status : b.error)).join('/')})`, { endpoint: aiEp, severity: SEVERITY.MEDIUM });
    }
    out.conditional('ai: DISTRIBUTED_RATE_LIMITER', 'dağıtık limiter kanıtı', 'NOT_VERIFIED — in-instance sayaç; cold-start’ta sıfırlanır (Phase B’de belgelenen sınırlama)', { endpoint: aiEp, severity: SEVERITY.MEDIUM });
  } else {
    out.blocked('ai-interpretation: rol/sahiplik doğrulamaları', 'User A oturumu yok', { severity: SEVERITY.CRITICAL, endpoint: aiEp });
  }

  return [out, cors];
}
