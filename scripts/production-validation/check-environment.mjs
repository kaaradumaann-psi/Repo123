/**
 * 01 — Ortam doğrulaması.
 * Gerekli/opsiyonel değişkenlerin VARLIĞINI kontrol eder; değerleri ASLA yazmaz.
 * Eksik zorunlu değişken → BLOCKED (rapor §3).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { envValue, envPresence, repoRoot, writesAllowed, destructiveConfirmed } from './lib/env.mjs';

const REQUIRED = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PRODUCTION_URL'];
const OPTIONAL_ROLES = [
  'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD',
  'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD',
  'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD',
  'TEST_INACTIVE_EMAIL', 'TEST_INACTIVE_PASSWORD',
];
const OPTIONAL_OTHER = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'LIVE_MATRIX_ALLOW_WRITES',
  'PRODUCTION_VALIDATION_CONFIRM',
  'VALIDATION_RECORD_ID',
  'PRODUCTION_VALIDATION_SKIP_TESTS',
];

export async function run(ctx) {
  const out = new Collector('Environment');

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor >= 22) out.pass('Node.js sürümü', '>= 22', process.versions.node, { severity: SEVERITY.CRITICAL });
  else out.fail('Node.js sürümü', '>= 22', process.versions.node, { severity: SEVERITY.CRITICAL, action: 'Node.js 22+ kurun (engines alanı zorunlu).' });

  out.notApplicable('Çalışma platformu', `${process.platform} ${process.arch} · tek script, POSIX bağımlılığı yok`);

  for (const name of REQUIRED) {
    const presence = envPresence(name);
    if (
      presence === 'configured'
    ) out.pass(`${name} = configured`, 'configured', 'configured', { severity: SEVERITY.CRITICAL });
    else {
      out.blocked(`${name} = missing`, 'canlı doğrulama için bu değişken zorunlu', {
        expected: `${name} = configured`,
        severity: SEVERITY.CRITICAL,
        action: 'docs/PRODUCTION_VALIDATION_RUNBOOK.md bölüm "Environment variables".',
      });
    }
  }

  // SUPABASE_URL şekil kontrolü (değer yazılmaz, yalnızca yapı).
  const supabaseUrl = envValue('SUPABASE_URL');
  if (supabaseUrl) {
    const https = /^https:\/\//.test(supabaseUrl);
    if (https) out.pass('SUPABASE_URL şeması', 'https://', 'https://', { severity: SEVERITY.CRITICAL });
    else out.fail('SUPABASE_URL şeması', 'https://', 'https değil', { severity: SEVERITY.CRITICAL, action: 'Production Supabase URL https olmalıdır.' });
  }
  const productionUrl = envValue('PRODUCTION_URL');
  if (productionUrl) {
    const https = /^https:\/\//.test(productionUrl);
    if (https) out.pass('PRODUCTION_URL şeması', 'https://', 'https://', { severity: SEVERITY.CRITICAL });
    else out.fail('PRODUCTION_URL şeması', 'https://', 'https değil', { severity: SEVERITY.CRITICAL, action: 'PRODUCTION_URL https olmalıdır (örn. https://mmpi.halilkaraduman.com.tr).' });
  }

  // Rol kimlik bilgileri: eksik parça → o rol bağımlı kontroller BLOCKED olur (yüksek önem).
  const rolePairs = [
    ['User A', 'TEST_USER_A_EMAIL', 'TEST_USER_A_PASSWORD'],
    ['User B', 'TEST_USER_B_EMAIL', 'TEST_USER_B_PASSWORD'],
    ['Admin', 'TEST_ADMIN_EMAIL', 'TEST_ADMIN_PASSWORD'],
    ['Inactive', 'TEST_INACTIVE_EMAIL', 'TEST_INACTIVE_PASSWORD'],
  ];
  for (const [label, emailName, passwordName] of rolePairs) {
    const complete = envValue(emailName) && envValue(passwordName);
    if (complete) out.pass(`${label} kimliği = configured`, 'configured', 'configured', { severity: label === 'Inactive' ? SEVERITY.HIGH : SEVERITY.CRITICAL });
    else {
      out.blocked(`${label} kimliği = missing`, `${label} rolüne bağlı canlı kontroller çalışamaz`, {
        expected: `${emailName} + ${passwordName} configured`,
        severity: label === 'Inactive' ? SEVERITY.HIGH : SEVERITY.CRITICAL,
        action: 'Runbook bölüm "Disposable test users" — etiketli test hesapları oluşturun.',
      });
    }
  }

  for (const name of OPTIONAL_OTHER) {
    const presence = name.startsWith('PRODUCTION_VALIDATION_') || name.startsWith('LIVE_MATRIX_')
      ? (process.env[name] === 'YES' ? 'YES' : 'not set')
      : envPresence(name);
    out.notApplicable(`${name}`, presence);
  }

  if (writesAllowed()) out.pass('Yazma kilidi', 'LIVE_MATRIX_ALLOW_WRITES=YES bilinçli açık', 'açık', { severity: SEVERITY.INFO });
  else out.notApplicable('Yazma kilidi', 'kapalı — fixture/yazma senaryoları SKIPPED olur (açmak için LIVE_MATRIX_ALLOW_WRITES=YES)');
  out.notApplicable('Yıkıcı işlem kilidi', destructiveConfirmed() ? 'açık (PRODUCTION_VALIDATION_CONFIRM=YES)' : 'kapalı — kullanıcı silme akışı SKIPPED olur');

  // REUSE hedefleri mevcut mu (ikinci bir sistem kurulmaz).
  for (const file of ['scripts/run-live-security-matrix.mjs', 'scripts/verify-production-config.mjs']) {
    const exists = existsSync(resolve(repoRoot(), file));
    if (exists) out.pass(`REUSE hedefi mevcut: ${file}`, 'mevcut', 'mevcut', { severity: SEVERITY.LOW });
    else out.fail(`REUSE hedefi mevcut: ${file}`, 'mevcut', 'YOK', { severity: SEVERITY.MEDIUM, action: 'Depo bütünlüğünü kontrol edin.' });
  }

  if (ctx.loadedEnvFiles.length > 0) {
    out.notApplicable('Yerel env dosyası', `${ctx.loadedEnvFiles.join(', ')} okundu (Git izlemez; değerler yazılmaz)`);
  }

  return out;
}
