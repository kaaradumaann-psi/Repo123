/**
 * 09 — Raporlar: sahiplik (canlı) + veri bütünlüğü (depo) (rapor §19, §20, §21-repo kısmı).
 *
 * Depo kanıtı REPOSITORY olarak etiketlenir; CANLI kanıtlar REST üzerindendir.
 * reportDataAdapter yeniden skorlama YAPMAZ — önce statik import sözleşmesi,
 * sonra davranışsal test alt kümesi (tests/reports*.test.ts).
 */
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, writesAllowed } from './lib/env.mjs';
import { rest, describeResult } from './lib/supabase.mjs';
import { request } from './lib/http.mjs';
import { ensureSessions } from './lib/fixtures.mjs';

function isDeniedShape(result) {
  if (result.status == null) return false;
  return result.status === 401 || result.status === 403 || (result.status === 200 && result.rows === 0);
}

function runTsxTests(files, timeoutMs) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, ['--import', 'tsx', '--test', ...files], {
      cwd: repoRoot(),
      windowsHide: true,
      env: { ...process.env, NO_COLOR: '1' },
    });
    let output = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolvePromise({ code: null, output: `${output}\n[validation] timeout` }); }, timeoutMs);
    child.stdout?.on('data', (d) => { output = (output + d.toString()).slice(-80_000); });
    child.stderr?.on('data', (d) => { output = (output + d.toString()).slice(-80_000); });
    child.on('error', (error) => { clearTimeout(timer); resolvePromise({ code: null, output: String(error?.message || error) }); });
    child.on('close', (code) => { clearTimeout(timer); resolvePromise({ code, output }); });
  });
}

export async function run(ctx) {
  const out = new Collector('Reports');

  /* ---------- REPOSITORY: adapter scoring izolasyonu ---------- */
  const adapterPath = resolve(repoRoot(), 'src/reports/reportDataAdapter.ts');
  let adapterSource = '';
  try { adapterSource = await readFile(adapterPath, 'utf8'); } catch { /* aşağıdaki FAIL */ }
  if (!adapterSource) {
    out.fail('[REPOSITORY] reportDataAdapter okunabilir', 'dosya mevcut', 'okunamadı', { severity: SEVERITY.HIGH, resource: 'src/reports/reportDataAdapter.ts' });
  } else {
    // Sözleşme (Phase B): adapter read/format sınırıdır. Ham yanıt/ham skor → profil
    // üreten YÜRÜTME girişlerini import edemez veya çağıramaz. Saf görüntüleme
    // yardımcıları (mmpiInterpretation) ve sürüm sabiti (scoring/version) izinlidir;
    // `import type` tür referansları yürütme değildir.
    const FORBIDDEN_IMPORTS = [
      /import\s+(?!type\b)[^'"]*from\s+['"][^'"]*scoring\/mmpiScoring['"]/m,
      /import\s+(?!type\b)[^'"]*from\s+['"][^'"]*scoring\/mmpiKeys['"]/m,
      /import\s+(?!type\b)[^'"]*from\s+['"][^'"]*scoring\/mmpiSource['"]/m,
      /import\s+(?!type\b)[^'"]*from\s+['"][^'"]*scoring\/mmpiValidityConfigs['"]/m,
    ];
    const FORBIDDEN_CALLS = /(buildProfileFromRawScores|answersToResponseMap|scoreAnswers|kAddition|computeT|analyzeValidity)\s*\(/;
    const code = adapterSource.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, '');
    const badImport = FORBIDDEN_IMPORTS.find((re) => re.test(code));
    const badCall = FORBIDDEN_CALLS.test(code);
    if (!badImport && !badCall) {
      out.pass('[REPOSITORY] reportDataAdapter scoring yürütmez', 'scoring yürütme importu/çağrısı yok', 'yok (yalnızca görüntüleme yardımcıları + type import)', { severity: SEVERITY.HIGH, resource: 'reportDataAdapter' });
    } else {
      out.fail('[REPOSITORY] reportDataAdapter scoring yürütmez', 'yürütme importu/çağrısı yok', `kuşkulu eşleşme: ${badImport ? 'yürütme importu' : 'skor çağrısı'}`, { severity: SEVERITY.HIGH, resource: 'reportDataAdapter', action: 'Adapter skorlama kaynağı olmamalı (Phase B sözleşmesi).' });
    }
  }

  const result = await runTsxTests(['tests/reports.test.ts', 'tests/reportDatabase.test.ts'], 8 * 60_000);
  const passMatch = /# pass (\d+)/.exec(result.output);
  const failMatch = /# fail (\d+)/.exec(result.output);
  if (result.code === 0 && failMatch && Number(failMatch[1]) === 0) {
    out.pass('[REPOSITORY] rapor adapter + veritabanı davranış testleri', '0 fail', `${passMatch?.[1] ?? '?'} pass / 0 fail`, { severity: SEVERITY.HIGH, resource: 'tests/reports*.test.ts' });
  } else if (result.code === null && !passMatch) {
    out.blocked('[REPOSITORY] rapor testleri', `çalıştırıcı hatası: ${result.output.trim().slice(-160)}`, { expected: '0 fail', severity: SEVERITY.HIGH });
  } else {
    out.fail('[REPOSITORY] rapor testleri', '0 fail', `${passMatch?.[1] ?? '?'} pass / ${failMatch?.[1] ?? '?'} fail (çıkış ${result.code})`, { severity: SEVERITY.HIGH });
  }

  /* ---------- LIVE: sahiplik sözleşmesi ---------- */
  if (!ctx.supabase) {
    out.blocked('[LIVE] rapor sahipliği', 'SUPABASE_URL / SUPABASE_ANON_KEY tanımsız', { severity: SEVERITY.CRITICAL });
    return out;
  }
  const sessions = await ensureSessions(ctx);
  const writeGate = writesAllowed();
  const A = sessions.userA; const B = sessions.userB;
  const admin = sessions.admin;

  if (!A?.ok || !B?.ok) {
    out.blocked('[LIVE] rapor sahipliği matrisi', 'User A + User B oturumları zorunlu', { severity: SEVERITY.CRITICAL });
    return out;
  }
  const fxA = ctx.fixtures?.userA; const fxB = ctx.fixtures?.userB;
  if (!fxA?.reportId || !fxB?.reportId) {
    out.blocked('[LIVE] rapor sahipliği matrisi', 'rapor fixture zincirleri gerekli', {
      severity: SEVERITY.CRITICAL,
      action: writeGate ? 'Fixture üretimi başarısız — Reports/RLS bölümündeki INSERT hatalarını inceleyin.' : 'LIVE_MATRIX_ALLOW_WRITES=YES ile çalıştırın.',
    });
    return out;
  }

  const matrix = [
    { check: 'User A → own report SELECT', token: A.token, path: `/rest/v1/mmpi_reports?id=eq.${fxA.reportId}&select=id`, expected: 'ALLOW' },
    { check: 'User A → User B report SELECT', token: A.token, path: `/rest/v1/mmpi_reports?id=eq.${fxB.reportId}&select=id`, expected: 'DENY' },
    { check: 'User B → User A report SELECT', token: B.token, path: `/rest/v1/mmpi_reports?id=eq.${fxA.reportId}&select=id`, expected: 'DENY' },
  ];
  if (admin?.ok) matrix.push({ check: 'Admin → User A report SELECT (belgelenen model)', token: admin.token, path: `/rest/v1/mmpi_reports?id=eq.${fxA.reportId}&select=id`, expected: 'ALLOW' });
  if (fxA.versionId) matrix.push({ check: 'User A → own report version SELECT', token: A.token, path: `/rest/v1/mmpi_report_versions?id=eq.${fxA.versionId}&select=id`, expected: 'ALLOW' });
  if (fxB.versionId) matrix.push({ check: 'User A → User B report version SELECT', token: A.token, path: `/rest/v1/mmpi_report_versions?id=eq.${fxB.versionId}&select=id`, expected: 'DENY' });
  if (fxA.templateId) matrix.push({ check: 'User A → own template SELECT', token: A.token, path: `/rest/v1/mmpi_report_templates?id=eq.${fxA.templateId}&select=id`, expected: 'ALLOW' });
  if (fxB.templateId) matrix.push({ check: 'User A → User B template SELECT', token: A.token, path: `/rest/v1/mmpi_report_templates?id=eq.${fxB.templateId}&select=id`, expected: 'DENY' });
  matrix.push({ check: 'User A → own settings SELECT', token: A.token, path: `/rest/v1/psychologist_report_settings?created_by=eq.${A.userId}&select=created_by`, expected: 'ALLOW' });
  matrix.push({ check: 'User A → User B settings SELECT', token: A.token, path: `/rest/v1/psychologist_report_settings?created_by=eq.${B.userId}&select=created_by`, expected: 'DENY' });

  for (const row of matrix) {
    const probe = await rest(ctx.supabase, row.path, { token: row.token });
    if (probe.status == null) { out.blocked(`[LIVE] ${row.check}`, `bağlantı (${probe.error})`, { severity: SEVERITY.CRITICAL }); continue; }
    const ok = row.expected === 'ALLOW' ? (probe.status === 200 && (probe.rows ?? 0) >= 1) : isDeniedShape(probe);
    if (ok) out.pass(`[LIVE] ${row.check}`, row.expected === 'ALLOW' ? '200 + ≥1 satır' : 'DENY', describeResult(probe), { severity: SEVERITY.CRITICAL });
    else out.fail(`[LIVE] ${row.check}`, row.expected === 'ALLOW' ? '200 + ≥1 satır' : 'DENY (401/403 veya 0 satır)', describeResult(probe), { severity: SEVERITY.CRITICAL, action: 'reports RLS policy drift — migration 20260923000000 uzaklığı doğrulayın.' });
  }

  // Sistem şablonu her aktif kullanıcı için okunabilir (belgelenen model).
  const systemTemplate = await rest(ctx.supabase, "/rest/v1/mmpi_report_templates?is_system=eq.true&select=id", { token: B.token });
  if (systemTemplate.status == null) out.blocked('[LIVE] sistem şablonu okunabilir', `bağlantı (${systemTemplate.error})`, { severity: SEVERITY.MEDIUM });
  else if (systemTemplate.status === 200 && (systemTemplate.rows ?? 0) >= 1) out.pass('[LIVE] sistem şablonu okunabilir', '200 + ≥1 satır (is_system)', describeResult(systemTemplate), { severity: SEVERITY.MEDIUM });
  else out.fail('[LIVE] sistem şablonu okunabilir', '200 + ≥1 satır (is_system)', describeResult(systemTemplate), { severity: SEVERITY.MEDIUM, action: 'Seed şablonu (migration 20260923000000 insert) uzakta eksik olabilir.' });

  /* ---------- LIVE: snapshot bütünlüğü (yapısal) ---------- */
  if (fxA.reportId) {
    const snapshot = await request(`${ctx.supabase.url}/rest/v1/mmpi_reports?id=eq.${fxA.reportId}&select=source_data_version,version_number,revision,status`, {
      headers: { apikey: ctx.supabase.anonKey, Authorization: `Bearer ${A.token}`, Accept: 'application/json' },
    });
    if (!snapshot.ok || !Array.isArray(snapshot.json)) out.blocked('[LIVE] rapor snapshot bütünlüğü', `bağlantı (${snapshot.error ?? snapshot.status})`, { severity: SEVERITY.HIGH });
    else {
      const row = snapshot.json[0];
      const okShape = row && typeof row.source_data_version === 'string' && row.source_data_version.length > 0
        && Number.isInteger(row.version_number) && Number.isInteger(row.revision) && typeof row.status === 'string';
      if (okShape) out.pass('[LIVE] rapor snapshot bütünlüğü', 'source_data_version + version_number + revision + status mevcut', 'mevcut (değerler saklanmaz)', { severity: SEVERITY.HIGH });
      else out.fail('[LIVE] rapor snapshot bütünlüğü', 'alanlar mevcut', 'alan(lar) eksik — kolon drift olabilir', { severity: SEVERITY.HIGH });
    }
  }

  return out;
}
