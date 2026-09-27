#!/usr/bin/env node
/**
 * MMPI-1 PRODUCTION VALIDATION — tek giriş noktası.
 *
 *   npm run validate:production
 *
 * Durumlar: PASS / FAIL / BLOCKED / SKIPPED / NOT_APPLICABLE / CONDITIONAL.
 * Kurallar: sahte PASS yok; mock/local sonucu live PASS değildir; secret değeri
 * asla çıktıya yazılmaz; production'da migration/DDL çalıştırılmaz; yıkıcı
 * akışlar yalnızca iki kilit (LIVE_MATRIX_ALLOW_WRITES=YES +
 * PRODUCTION_VALIDATION_CONFIRM=YES) ile açılır ve disposable fixture kullanır.
 * OMR EXTERNAL'dır — bu araç OMR doğruluğu hakkında karar vermez.
 *
 * Seçenekler:
 *   --only <liste>   yalnızca verilen bölümleri çalıştır (örn. --only tls,secrets)
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  Collector, SEVERITY, STATUS,
  printArea, summarize, computeFinalStatus, writeArtifacts,
} from './lib/output.mjs';
import { loadLocalEnvFiles, envValue, repoRoot } from './lib/env.mjs';
import { supabaseEnv } from './lib/supabase.mjs';
import { cleanupRunFixtures } from './lib/fixtures.mjs';

const MODULES = [
  { key: 'regression', label: 'Repository regression (scoring freeze)', load: () => import('./check-regression.mjs') },
  { key: 'environment', label: 'Environment', load: () => import('./check-environment.mjs') },
  { key: 'supabase', label: 'Supabase', load: () => import('./check-supabase.mjs') },
  { key: 'migrations', label: 'Remote migrations / schema drift', load: () => import('./check-migrations.mjs') },
  { key: 'auth', label: 'Authentication', load: () => import('./check-auth.mjs') },
  { key: 'rls', label: 'RLS (live)', load: () => import('./check-rls.mjs') },
  { key: 'idor', label: 'IDOR', load: () => import('./check-idor.mjs') },
  { key: 'deletion', label: 'Deletion / cascade', load: () => import('./check-deletion.mjs') },
  { key: 'reports', label: 'Reports', load: () => import('./check-reports.mjs') },
  { key: 'edge', label: 'Edge Functions', load: () => import('./check-edge-functions.mjs') },
  { key: 'production-http', label: 'Production HTTP', load: () => import('./check-production-config.mjs') },
  { key: 'headers', label: 'Security Headers', load: () => import('./check-security-headers.mjs') },
  { key: 'tls', label: 'TLS / HTTPS', load: () => import('./check-tls.mjs') },
  { key: 'browser-e2e', label: 'Browser E2E', load: () => import('./check-browser-e2e.mjs') },
  { key: 'secrets', label: 'Secrets', load: () => import('./check-secrets.mjs') },
];

const onlyArg = process.argv.includes('--only')
  ? (process.argv[process.argv.indexOf('--only') + 1] || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  : null;

function gitCommit() {
  try { return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot(), encoding: 'utf8' }).trim(); }
  catch { return 'unknown'; }
}

const line = '═'.repeat(62);
console.log(line);
console.log('  MMPI-1 PRODUCTION VALIDATION');
console.log('  Gerçek PC · Gerçek Supabase · Gerçek Production Domain');
console.log(line);
console.log(`  Başlangıç: ${new Date().toISOString()}`);
console.log('  Sahte PASS yok — kanıtlanamayan alan BLOCKED yazılır.');
console.log(line);

const ctx = {
  supabase: null,
  loadedEnvFiles: [],
  artifactsDir: resolve(repoRoot(), process.env.PRODUCTION_VALIDATION_ARTIFACTS || 'artifacts/production-validation'),
  fixtures: {},
  sessions: null,
  cleanup: [],
};

ctx.loadedEnvFiles = loadLocalEnvFiles();
ctx.supabase = supabaseEnv();

const areas = [];
for (const mod of MODULES) {
  if (onlyArg && !onlyArg.includes(mod.key)) continue;
  process.stdout.write(`\n[çalışıyor] ${mod.label}…`);
  let collectors;
  try {
    const imported = await mod.load();
    collectors = await imported.run(ctx);
  } catch (error) {
    const fallback = new Collector(mod.label);
    fallback.blocked('Bölüm çalıştırıcısı', `beklenmeyen hata: ${String(error?.message || error).slice(0, 200)}`, {
      severity: SEVERITY.CRITICAL,
      action: 'Bu bir toolkit hatasıdır (false-PASS değil); çıktıyı saklayıp bildirin.',
    });
    collectors = fallback;
  }
  const list = Array.isArray(collectors) ? collectors : [collectors];
  console.log('\r' + ' '.repeat(mod.label.length + 20) + '\r', '');
  for (const collector of list) {
    areas.push({ area: collector.area, entries: collector.entries });
    printArea(collector.area, collector.entries);
  }
}

// OMR — bu fazda DIŞARIKTADIR (rapor §35). Gate'i etkilemez.
const omr = new Collector('OMR (external)');
omr.add({
  check: 'OMR VALIDATION',
  expected: 'EXTERNAL / USER-VALIDATED SEPARATELY',
  actual: 'Bu toolkit OMR doğruluğu hakkında karar vermez; fiziksel test kullanıcı tarafından ayrı yapılır',
  status: STATUS.EXTERNAL,
  severity: SEVERITY.INFO,
});
areas.push({ area: omr.area, entries: omr.entries });
printArea(omr.area, omr.entries);

// Çalıştırma sonu fixture temizliği (yalnızca bu run'da üretilen etiketli veri).
if (ctx.cleanup.length > 0) {
  const cleaned = await cleanupRunFixtures(ctx);
  console.log(`\n  Fixture temizliği: ${cleaned.attempted} grup silindi (MMPI_PROD_VALIDATION etiketli; gerçek veriye dokunulmaz).`);
}

const allEntries = areas.flatMap((a) => a.entries);
const summary = summarize(areas);
const gate = computeFinalStatus(allEntries);

console.log(`\n${line}`);
console.log(`  ÖZET  ·  PASS ${summary.pass} · FAIL ${summary.fail} · BLOCKED ${summary.blocked} · CONDITIONAL ${summary.conditional} · SKIPPED ${summary.skipped} · N/A ${summary.notApplicable}`);
console.log(line);
console.log(`  FINAL STATUS: ${gate.final}   (${gate.reason})`);
console.log('  OMR VALIDATION: EXTERNAL / USER-VALIDATED SEPARATELY');
console.log(line);
if (gate.hardFail.length > 0) {
  console.log('  Kritik/high FAIL blokajları:');
  for (const e of gate.hardFail.slice(0, 20)) console.log(`   - [${e.area}] ${e.check} — ${e.actual}`);
}
if (gate.critBlocked.length > 0) {
  console.log('  Kritik/high BLOCKED blokajları:');
  for (const e of gate.critBlocked.slice(0, 20)) console.log(`   - [${e.area}] ${e.check} — ${e.actual}`);
}
if (gate.hardFail.length > 0 || gate.critBlocked.length > 0) console.log(line);

const artifact = {
  schemaVersion: 1,
  tool: 'scripts/production-validation (Phase C)',
  timestamp: new Date().toISOString(),
  repository: 'kaaradumaann-psi/Repo123',
  commit: gitCommit(),
  productionUrl: envValue('PRODUCTION_URL') ? new URL(envValue('PRODUCTION_URL')).origin : null,
  environment: { node: process.versions.node, platform: `${process.platform} ${process.arch}` },
  checks: allEntries.map((e) => ({
    id: e.id, area: e.area, check: e.check, expected: e.expected, actual: e.actual,
    status: e.status, severity: e.severity, endpoint: e.endpoint, resource: e.resource,
    action: e.action, timestamp: e.timestamp,
  })),
  summary: {
    pass: summary.pass,
    fail: summary.fail,
    blocked: summary.blocked,
    conditional: summary.conditional,
    skipped: summary.skipped,
    notApplicable: summary.notApplicable,
    external: summary.external,
    total: summary.total,
  },
  finalStatus: gate.final,
  finalReason: gate.reason,
  omr: { status: 'EXTERNAL', note: 'USER-VALIDATED SEPARATELY — bu araç OMR doğruluğunu kapatmaz' },
  dataPolicy: 'Token/parola/secret/danışan verisi saklanmaz; yalnızca HTTP durumu, satır sayısı ve boolean kanıtlar tutulur.',
};

try {
  const { jsonPath, mdPath } = await writeArtifacts(ctx.artifactsDir, { artifact, areas });
  console.log(`  Kanıt: ${jsonPath}`);
  console.log(`  Rapor: ${mdPath}`);
} catch (error) {
  console.error(`  Artifact yazılamadı: ${String(error?.message || error)}`);
}

process.exit(gate.final === 'READY' ? 0 : gate.final === 'CONDITIONAL' ? 3 : 1);
