/**
 * 05 — LIVE RLS matrisi (rapor §6, §7).
 *
 * Mevcut `scripts/run-live-security-matrix.mjs` koşusunu YENİDEN KULLANIR:
 * bu modül yalnızca canlı oturumlardan token alır, disposable fixture
 * kimlikleriyle geçici bir senaryo dosyası üretir ve koşucuyu child process
 * olarak çalıştırır. Koşucu token/yanıt kaydı tutmaz; biz de tutmayız.
 */
import { spawn } from 'node:child_process';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, envValue, writesAllowed } from './lib/env.mjs';
import { ensureSessions, createUserFixtures, discoverUserFixtures } from './lib/fixtures.mjs';

function buildScenarios(ctx) {
  const s = [];
  const writes = writesAllowed();
  const fx = (role) => ctx.fixtures?.[role] ?? {};
  const A = fx('userA'); const B = fx('userB');
  const aid = ctx.sessions?.userA?.userId; const bid = ctx.sessions?.userB?.userId;

  // 1) Anonymous — tüm kaynaklar kapalı (grant yok → 401/403).
  for (const [table, resource] of [['profiles', 'profile'], ['mmpi_records', 'mmpi_record'], ['mmpi_reports', 'report'], ['mmpi_report_versions', 'report_version'], ['mmpi_report_templates', 'template'], ['psychologist_report_settings', 'settings'], ['audit_logs', 'audit_log']]) {
    s.push({ id: `anon-${resource}-select`, role: 'anonymous', resource, operation: 'SELECT', method: 'GET', path: `/rest/v1/${table}?select=*&limit=1`, tokenEnv: 'ANON_JWT', expectedStatus: [401, 403] });
  }

  // 2) Profil sahipliği (id biliniyorsa).
  if (aid) s.push({ id: 'userA-profile-own-select', role: 'userA', resource: 'profile', operation: 'SELECT', method: 'GET', path: `/rest/v1/profiles?id=eq.${aid}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 1 });
  if (aid && bid) s.push({ id: 'userA-profile-userB-select', role: 'userA', resource: 'profile', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/profiles?id=eq.${bid}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 0 });

  // 3) Kayıt sahipliği + IDOR (fixture kimlikleriyle).
  if (A.recordId) s.push({ id: 'userA-record-own-select', role: 'userA', resource: 'mmpi_record', operation: 'SELECT', method: 'GET', path: `/rest/v1/mmpi_records?id=eq.${A.recordId}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 1 });
  if (B.recordId) s.push({ id: 'userA-record-userB-select', role: 'userA', resource: 'mmpi_record', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_records?id=eq.${B.recordId}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 0 });
  if (A.recordId) s.push({ id: 'userB-record-userA-select', role: 'userB', resource: 'mmpi_record', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_records?id=eq.${A.recordId}&select=id`, tokenEnv: 'USER_B_JWT', expectedStatus: 200, expectedRows: 0 });
  if (writes && B.recordId) {
    s.push({ id: 'userA-record-userB-update', role: 'userA', resource: 'mmpi_record', operation: 'UPDATE IDOR', method: 'PATCH', path: `/rest/v1/mmpi_records?id=eq.${B.recordId}`, tokenEnv: 'USER_A_JWT', prefer: 'return=representation', body: { expert_notes: 'production-validation-must-not-pass' }, expectedStatus: 200, expectedRows: 0 });
    s.push({ id: 'userA-record-userB-delete', role: 'userA', resource: 'mmpi_record', operation: 'DELETE IDOR', method: 'DELETE', path: `/rest/v1/mmpi_records?id=eq.${B.recordId}`, tokenEnv: 'USER_A_JWT', prefer: 'return=representation', expectedStatus: 200, expectedRows: 0 });
  }

  // 4) Rapor / sürüm / şablon / ayar sahipliği.
  if (A.reportId) s.push({ id: 'userA-report-own-select', role: 'userA', resource: 'report', operation: 'SELECT', method: 'GET', path: `/rest/v1/mmpi_reports?id=eq.${A.reportId}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 1 });
  if (B.reportId) s.push({ id: 'userA-report-userB-select', role: 'userA', resource: 'report', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_reports?id=eq.${B.reportId}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 0 });
  if (A.reportId) s.push({ id: 'userB-report-userA-select', role: 'userB', resource: 'report', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_reports?id=eq.${A.reportId}&select=id`, tokenEnv: 'USER_B_JWT', expectedStatus: 200, expectedRows: 0 });
  if (A.versionId) s.push({ id: 'userA-version-own-select', role: 'userA', resource: 'report_version', operation: 'SELECT', method: 'GET', path: `/rest/v1/mmpi_report_versions?id=eq.${A.versionId}&select=id`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 1 });
  if (A.versionId) s.push({ id: 'userB-version-userA-select', role: 'userB', resource: 'report_version', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_report_versions?id=eq.${A.versionId}&select=id`, tokenEnv: 'USER_B_JWT', expectedStatus: 200, expectedRows: 0 });
  if (writes && A.reportId) {
    s.push({ id: 'userB-version-userA-insert', role: 'userB', resource: 'report_version', operation: 'INSERT', method: 'POST', path: '/rest/v1/mmpi_report_versions', tokenEnv: 'USER_B_JWT', body: { report_id: A.reportId, version_number: 999, content: {}, snapshot: {}, reason: 'forgery-attempt' }, expectedStatus: [400, 401, 403, 404] });
    s.push({ id: 'userA-version-userA-delete', role: 'userA', resource: 'report_version', operation: 'DELETE', method: 'DELETE', path: `/rest/v1/mmpi_report_versions?report_id=eq.${A.reportId}`, tokenEnv: 'USER_A_JWT', expectedStatus: [400, 401, 403, 404] });
  }
  if (A.templateId) s.push({ id: 'userB-template-userA-select', role: 'userB', resource: 'template', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/mmpi_report_templates?id=eq.${A.templateId}&select=id`, tokenEnv: 'USER_B_JWT', expectedStatus: 200, expectedRows: 0 });
  if (aid) s.push({ id: 'userA-settings-own-select', role: 'userA', resource: 'settings', operation: 'SELECT', method: 'GET', path: `/rest/v1/psychologist_report_settings?created_by=eq.${aid}&select=created_by`, tokenEnv: 'USER_A_JWT', expectedStatus: 200 });
  if (bid) s.push({ id: 'userA-settings-userB-select', role: 'userA', resource: 'settings', operation: 'SELECT IDOR', method: 'GET', path: `/rest/v1/psychologist_report_settings?created_by=eq.${bid}&select=created_by`, tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 0 });

  // 5) Audit log yüzeyi.
  s.push({ id: 'userA-audit-select', role: 'userA', resource: 'audit_log', operation: 'SELECT', method: 'GET', path: '/rest/v1/audit_logs?select=id&limit=1', tokenEnv: 'USER_A_JWT', expectedStatus: 200, expectedRows: 0 });
  s.push({ id: 'admin-audit-select', role: 'admin', resource: 'audit_log', operation: 'SELECT', method: 'GET', path: '/rest/v1/audit_logs?select=id&limit=1', tokenEnv: 'ADMIN_JWT', expectedStatus: 200 });
  if (writes) {
    s.push({ id: 'userA-audit-insert', role: 'userA', resource: 'audit_log', operation: 'INSERT', method: 'POST', path: '/rest/v1/audit_logs', tokenEnv: 'USER_A_JWT', body: { action: 'record_insert', target_table: 'mmpi_records' }, expectedStatus: [400, 401, 403, 404] });
  }

  // 6) Admin görünürlük modeli.
  if (A.recordId) s.push({ id: 'admin-record-userA-select', role: 'admin', resource: 'mmpi_record', operation: 'SELECT', method: 'GET', path: `/rest/v1/mmpi_records?id=eq.${A.recordId}&select=id`, tokenEnv: 'ADMIN_JWT', expectedStatus: 200, expectedRows: 1 });
  if (A.reportId) s.push({ id: 'admin-report-userA-select', role: 'admin', resource: 'report', operation: 'SELECT', method: 'GET', path: `/rest/v1/mmpi_reports?id=eq.${A.reportId}&select=id`, tokenEnv: 'ADMIN_JWT', expectedStatus: 200, expectedRows: 1 });

  // 7) Inactive rolü (oturum açılabildiyse).
  if (ctx.sessions?.inactive?.ok) {
    s.push({ id: 'inactive-record-select', role: 'inactive', resource: 'mmpi_record', operation: 'SELECT', method: 'GET', path: '/rest/v1/mmpi_records?select=id&limit=1', tokenEnv: 'INACTIVE_JWT', expectedStatus: 200, expectedRows: 0 });
    // PostgREST davranışı: kimlik doğrulanmış ama policy-false → 200 + 0 satır (RLS filtreli deny).
    s.push({ id: 'inactive-report-select', role: 'inactive', resource: 'report', operation: 'SELECT', method: 'GET', path: '/rest/v1/mmpi_reports?select=id&limit=1', tokenEnv: 'INACTIVE_JWT', expectedStatus: 200, expectedRows: 0 });
    s.push({ id: 'inactive-profile-own-select', role: 'inactive', resource: 'profile', operation: 'SELECT', method: 'GET', path: `/rest/v1/profiles?id=eq.${ctx.sessions.inactive.userId}&select=id`, tokenEnv: 'INACTIVE_JWT', expectedStatus: [200, 401, 403] });
  }

  return s;
}

function runMatrixRunner(specPath, outputPath, tokens) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [resolve(repoRoot(), 'scripts/run-live-security-matrix.mjs')], {
      cwd: repoRoot(),
      env: {
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        LIVE_MATRIX_SPEC: specPath,
        LIVE_MATRIX_OUTPUT: outputPath,
        LIVE_MATRIX_ALLOW_WRITES: process.env.LIVE_MATRIX_ALLOW_WRITES ?? '',
        ...tokens,
      },
      windowsHide: true,
    });
    let tail = '';
    child.stdout?.on('data', (d) => { tail = (tail + d.toString()).slice(-4_000); });
    child.stderr?.on('data', (d) => { tail = (tail + d.toString()).slice(-4_000); });
    child.on('error', (error) => resolvePromise({ code: null, tail: String(error?.message || error) }));
    child.on('close', (code) => resolvePromise({ code, tail }));
  });
}

export async function run(ctx) {
  const out = new Collector('RLS (live)');
  if (!ctx.supabase) {
    out.blocked('Live RLS matrisi', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }

  const sessions = await ensureSessions(ctx);
  const anySession = Object.values(sessions).some((s) => s.ok);
  if (!sessions.userA?.ok || !sessions.userB?.ok) {
    out.blocked('Live RLS matrisi (iki kullanıcı)', 'User A ve User B oturumları birlikte zorunlu', {
      expected: 'TEST_USER_A_* + TEST_USER_B_* ile başarılı oturum', severity: SEVERITY.CRITICAL,
      action: 'Runbook: Disposable test users — iki ayrı aktif psikolog hesabı.',
    });
  }
  if (sessions.admin && !sessions.admin.ok && !sessions.admin.missingEnv) {
    out.blocked('Admin oturumu (RLS matrisi)', `HTTP ${sessions.admin.status ?? sessions.admin.error}`, { severity: SEVERITY.CRITICAL });
  }
  if (!anySession) return out;

  // Fixture hazırlığı: yazma açıksa üret; kapalıysa etiketli fixture keşfi dene.
  if (writesAllowed()) {
    for (const role of ['userA', 'userB']) {
      if (!sessions[role]?.ok) continue;
      const fixture = await createUserFixtures(ctx, role);
      if (!fixture.ok) {
        out.blocked(`${role} fixture zinciri`, fixture.reason ?? 'oluşturulamadı', { severity: SEVERITY.CRITICAL, action: 'INSERT policy / migration uyumunu kontrol edin (20260919020000+).' });
      }
    }
  } else {
    for (const role of ['userA', 'userB']) {
      if (sessions[role]?.ok) await discoverUserFixtures(ctx, role);
    }
    const hasFixtures = ctx.fixtures?.userA?.recordId || ctx.fixtures?.userB?.recordId;
    if (!hasFixtures) {
      out.blocked('Fixture zinciri (kayıt/rapor/sürüm)', 'yazma kapalı ve etiketli fixture bulunamadı', {
        expected: 'MMPI_PROD_VALIDATION etiketli disposable fixture', severity: SEVERITY.CRITICAL,
        action: 'LIVE_MATRIX_ALLOW_WRITES=YES ile yeniden çalıştırın; toolkit yalnızca etiketli sahte veri üretir.',
      });
    }
  }

  const scenarios = buildScenarios(ctx);
  if (scenarios.length === 0) {
    out.blocked('Live RLS matrisi', 'senaryo oluşturulamadı', { severity: SEVERITY.CRITICAL });
    return out;
  }

  // Tokenlar yalnızca child-process ENV ile taşınır; diske yazılmaz (koşucu sözleşmesi).
  const tokens = { ANON_JWT: ctx.supabase.anonKey };
  if (sessions.userA?.ok) tokens.USER_A_JWT = sessions.userA.token;
  if (sessions.userB?.ok) tokens.USER_B_JWT = sessions.userB.token;
  if (sessions.admin?.ok) tokens.ADMIN_JWT = sessions.admin.token;
  if (sessions.inactive?.ok) tokens.INACTIVE_JWT = sessions.inactive.token;

  const tmpDir = resolve(ctx.artifactsDir, 'tmp');
  await mkdir(tmpDir, { recursive: true });
  const specPath = join(tmpDir, 'generated-live-matrix.json');
  const outputPath = join(tmpDir, 'generated-live-matrix.results.json');
  const runnable = scenarios.filter((s) => tokens[s.tokenEnv]);
  await writeFile(specPath, JSON.stringify({ schemaVersion: 1, description: 'Generated by scripts/production-validation (Phase C). Disposable fixtures only.', scenarios: runnable }, null, 2), 'utf8');

  const runResult = await runMatrixRunner(specPath, outputPath, tokens);
  let artifact = null;
  try { artifact = JSON.parse(await readFile(outputPath, 'utf8')); } catch { /* aşağıda BLOCKED düşer */ }

  if (!artifact || !Array.isArray(artifact.results)) {
    out.blocked('Live RLS matrisi koşusu', `koşucu çıktı üretemedi: ${runResult.tail.trim().slice(-200) || `çıkış ${runResult.code}`}`, { severity: SEVERITY.CRITICAL, action: 'scripts/run-live-security-matrix.mjs bütünlüğünü kontrol edin.' });
    return out;
  }

  const severityFor = (row) => {
    if (row.operation?.includes('IDOR')) return SEVERITY.CRITICAL;
    if (row.role === 'anonymous' || row.role === 'inactive') return SEVERITY.HIGH;
    return SEVERITY.CRITICAL;
  };
  for (const row of artifact.results) {
    const expected = row.expectedRows !== null && row.expectedRows !== undefined
      ? `HTTP ${Array.isArray(row.expected) ? row.expected.join('/') : row.expected} + ${row.expectedRows} satır`
      : `HTTP ${Array.isArray(row.expected) ? row.expected.join('/') : row.expected}`;
    const actual = row.actual != null ? `HTTP ${row.actual}${row.actualRows !== null && row.actualRows !== undefined ? ` + ${row.actualRows} satır` : ''}` : `bağlantı yok (${row.reason ?? '?'})`;
    const check = `${row.id}`;
    const extra = { resource: row.resource, severity: severityFor(row), expected, endpoint: row.id.startsWith('anon-') ? '/rest/v1/*' : undefined };
    if (row.status === 'PASS') out.pass(check, expected, actual, extra);
    else if (row.status === 'FAIL') out.fail(check, expected, actual, { ...extra, action: 'RLS/policy drift olabilir — canlı policy seti ile repo migration’larını karşılaştırın.' });
    else out.blocked(check, actual, { ...extra });
  }

  const counts = artifact.counts ?? {};
  ctx.liveRlsSummary = { counts, finalStatus: artifact.finalStatus, scenarioCount: artifact.results.length };
  if (artifact.finalStatus === 'PASS') out.pass('Canlı RLS matrisi toplamı', 'tüm senaryolar PASS', `${artifact.results.length} senaryo PASS`, { severity: SEVERITY.CRITICAL });
  else if (artifact.finalStatus === 'FAIL') out.fail('Canlı RLS matrisi toplamı', 'tüm senaryolar PASS', `FAIL içeriyor · ${JSON.stringify(counts)}`, { severity: SEVERITY.CRITICAL, action: 'Yukarıdaki FAIL satırlarını tek tek kapatın.' });
  else out.blocked('Canlı RLS matrisi toplamı', `bazı senaryolar BLOCKED · ${JSON.stringify(counts)}`, { expected: 'tüm senaryolar PASS', severity: SEVERITY.CRITICAL });

  return out;
}
