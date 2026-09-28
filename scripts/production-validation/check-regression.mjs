/**
 * 00 — Depo regresyon kapısı (scoring freeze kanıtı).
 *
 * `npm test`, `npm run typecheck`, `npm audit` ve PDF doğrulayıcıyı çalıştırır.
 * Bu bölüm CANLI değildir; release gate'in "scoring regression PASS" şartını
 * kanıtlar (rapor §34). PRODUCTION_VALIDATION_SKIP_TESTS=YES ile atlanabilir.
 */
import { spawn } from 'node:child_process';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, validationChildEnv } from './lib/env.mjs';

function spawnCapture(command, args, timeoutMs) {
  return new Promise((resolvePromise) => {
    const isWin = process.platform === 'win32';
    const child = spawn(command, args, {
      cwd: repoRoot(),
      shell: isWin,
      windowsHide: true,
      env: validationChildEnv({ CI: '1' }),
    });
    let output = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolvePromise({ code: null, output: `${output}\n[validation] zaman aşımı (${timeoutMs} ms)` });
    }, timeoutMs);
    child.stdout?.on('data', (d) => { output = (output + d.toString()).slice(-200_000); });
    child.stderr?.on('data', (d) => { output = (output + d.toString()).slice(-200_000); });
    child.on('error', (error) => { clearTimeout(timer); resolvePromise({ code: null, output: String(error?.message || error) }); });
    child.on('close', (code) => { clearTimeout(timer); resolvePromise({ code, output }); });
  });
}

export async function run(ctx) {
  const out = new Collector('Repository regression (scoring freeze)');

  if (process.env.PRODUCTION_VALIDATION_SKIP_TESTS === 'YES') {
    out.skipped('npm test / typecheck / audit', 'PRODUCTION_VALIDATION_SKIP_TESTS=YES', { severity: SEVERITY.CRITICAL, expected: 'scoring regression' });
    return out;
  }

  // 1) Test paketi — tüm scoring invariantları burada kilitlidir.
  const tests = await spawnCapture('npm', ['test', '--', '--test-reporter=tap'], 15 * 60_000);
  const passMatch = /(?:^|\n)\s*(?:#|ℹ)\s*pass\s+(\d+)/.exec(tests.output);
  const failMatch = /(?:^|\n)\s*(?:#|ℹ)\s*fail\s+(\d+)/.exec(tests.output);
  if (tests.code === null && !passMatch) {
    out.blocked('npm test', `test çalıştırıcısı başlatılamadı: ${tests.output.trim().slice(-160)}`, { expected: '732 pass / 0 fail', severity: SEVERITY.CRITICAL, action: 'npm install çalıştırıldı mı?' });
  } else {
    const pass = passMatch ? Number(passMatch[1]) : 0;
    const fail = failMatch ? Number(failMatch[1]) : Number.NaN;
    if (tests.code === 0 && fail === 0) out.pass('npm test (scoring/OMR/DB regresyonu)', '0 başarısız test', `${pass} PASS · ${fail} FAIL`, { severity: SEVERITY.CRITICAL });
    else out.fail('npm test (scoring/OMR/DB regresyonu)', '0 başarısız test', `${pass} PASS · ${Number.isNaN(fail) ? '?' : fail} FAIL (çıkış kodu ${tests.code})`, { severity: SEVERITY.CRITICAL, action: 'Önce testleri yeşillendirin; production validation anlamlı değildir.' });
  }

  // 2) Typecheck.
  const tsc = await spawnCapture('npm', ['run', 'typecheck'], 5 * 60_000);
  if (tsc.code === 0) out.pass('npm run typecheck', 'tsc --noEmit temiz', 'temiz', { severity: SEVERITY.CRITICAL });
  else out.fail('npm run typecheck', 'tsc --noEmit temiz', `çıkış kodu ${tsc.code ?? 'timeout'}: ${tsc.output.trim().slice(-160)}`, { severity: SEVERITY.CRITICAL });

  // 3) Bağımlılık denetimi (ağ gerektirir; ağ yoksa BLOCKED, skorlamayı etkilemez).
  const audit = await spawnCapture('npm', ['audit', '--omit=dev', '--json'], 3 * 60_000);
  try {
    const json = JSON.parse(audit.output.slice(audit.output.indexOf('{')));
    const total = json?.metadata?.vulnerabilities?.total;
    if (typeof total === 'number' && total === 0) out.pass('npm audit (prod bağımlılıkları)', '0 açık', '0 açık', { severity: SEVERITY.MEDIUM });
    else if (typeof total === 'number') out.conditional('npm audit (prod bağımlılıkları)', '0 açık', `${total} açık`, { severity: SEVERITY.MEDIUM, action: 'npm audit çıktısını inceleyin.' });
    else out.blocked('npm audit', 'sonuç ayrıştırılamadı', { expected: '0 açık', severity: SEVERITY.MEDIUM });
  } catch {
    out.blocked('npm audit', 'ağ/registry erişilemedi veya çıktı ayrıştırılamadı', { expected: '0 açık', severity: SEVERITY.MEDIUM });
  }

  // 4) PDF doğrulayıcı (salt-okunur; depodaki form PDF'ini ölçer).
  const pdf = await spawnCapture('npm', ['run', 'verify:pdf'], 5 * 60_000);
  if (pdf.code === 0) out.pass('npm run verify:pdf (form PDF geometrisi)', 'PASS', 'PASS', { severity: SEVERITY.MEDIUM });
  else if (pdf.code === null) out.blocked('npm run verify:pdf', pdf.output.trim().slice(-160) || 'parametre hatası', { expected: 'PASS', severity: SEVERITY.MEDIUM });
  else out.fail('npm run verify:pdf', 'PASS', `çıkış kodu ${pdf.code}`, { severity: SEVERITY.MEDIUM });

  return out;
}
