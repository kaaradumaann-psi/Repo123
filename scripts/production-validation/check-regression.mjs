/**
 * 00 — Depo regresyon kapısı (scoring freeze kanıtı).
 *
 * `npm test`, `npm run typecheck`, `npm audit` ve PDF doğrulayıcıyı çalıştırır.
 * Bu bölüm CANLI değildir; release gate'in "scoring regression PASS" şartını
 * kanıtlar (rapor §34). PRODUCTION_VALIDATION_SKIP_TESTS=YES ile atlanabilir.
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, validationChildEnv } from './lib/env.mjs';

/**
 * Bu iki dosya YALNIZCA gözlemlenebilirlik amaçlıdır (Faz: observability-only).
 * Test çalıştırma şeklini, komutunu, ortamını veya reporter'ını DEĞİŞTİRMEZ;
 * `spawnCapture` zaten bellekte topladığı ham TAP çıktısını (`tests.output`)
 * olduğu gibi diske yazar. `artifacts/` .gitignore altındadır (bkz. kök
 * .gitignore) — bu dosyalar repo'ya girmez.
 */
const REGRESSION_ARTIFACTS_DIRNAME = 'artifacts/production-validation';
const RAW_LOG_FILENAME = 'npm-test-raw.log';
const FAILURES_JSON_FILENAME = 'npm-test-failures.json';

function artifactsDirFor(ctx) {
  return (ctx && ctx.artifactsDir) || resolve(repoRoot(), REGRESSION_ARTIFACTS_DIRNAME);
}

/**
 * Ham `tests.output`'u — HİÇBİR kırpma/dönüştürme yapmadan — diske yazar.
 * (Not: `spawnCapture`'ın kendi 200_000 karakterlik yuvarlanan yakalama
 * penceresi bu değişikliğin kapsamı DIŞINDADIR ve dokunulmamıştır; burada
 * yalnızca o pencerede o an ne varsa onu bozmadan dosyaya aktarıyoruz.)
 */
async function persistRawTestOutput(ctx, rawOutput) {
  const dir = artifactsDirFor(ctx);
  const filePath = resolve(dir, RAW_LOG_FILENAME);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, rawOutput ?? '', 'utf8');
    return { path: filePath, ok: true };
  } catch (error) {
    return { path: filePath, ok: false, error: String(error?.message || error) };
  }
}

/**
 * TAP (node:test) YAML tanılama bloğu içindeki `key: value` çiftlerini
 * best-effort ayrıştırır. Block-scalar (`|-`/`|`) değerleri ve basit nested
 * map'leri (ham metin olarak) destekler. ASLA throw etmez.
 */
export function parseYamlishBlock(blockLines, baseIndent) {
  const result = {};
  if (!blockLines || !blockLines.length) return result;
  const keyRe = /^(\s*)([A-Za-z_][A-Za-z0-9_]*):(\s?.*)$/;
  let keyIndent = null;
  for (const l of blockLines) {
    const m = keyRe.exec(l);
    if (m && m[1].length >= baseIndent) { keyIndent = m[1].length; break; }
  }
  if (keyIndent === null) return result;
  let i = 0;
  while (i < blockLines.length) {
    const line = blockLines[i];
    const m = keyRe.exec(line);
    if (!m || m[1].length !== keyIndent) { i += 1; continue; }
    const key = m[2];
    const valuePart = m[3].trim();
    i += 1;
    if (valuePart === '|-' || valuePart === '|' || valuePart === '>-' || valuePart === '>') {
      const contentLines = [];
      while (i < blockLines.length) {
        const l2 = blockLines[i];
        if (l2.trim() === '') { contentLines.push(''); i += 1; continue; }
        const indentLen = (/^(\s*)/.exec(l2) || ['', ''])[1].length;
        if (indentLen <= keyIndent) break;
        contentLines.push(l2);
        i += 1;
      }
      const nonEmptyIndents = contentLines.filter((l) => l.trim() !== '').map((l) => (/^(\s*)/.exec(l) || ['', ''])[1].length);
      const minIndent = nonEmptyIndents.length ? Math.min(...nonEmptyIndents) : keyIndent + 2;
      const dedented = contentLines.map((l) => (l.trim() === '' ? '' : l.slice(minIndent)));
      result[key] = dedented.join('\n').replace(/\n+$/, '').trim();
    } else if (valuePart === '') {
      const nested = [];
      while (i < blockLines.length) {
        const l2 = blockLines[i];
        const indentLen = (/^(\s*)/.exec(l2) || ['', ''])[1].length;
        if (l2.trim() !== '' && indentLen <= keyIndent) break;
        nested.push(l2);
        i += 1;
      }
      result[key] = nested.join('\n').trim() || null;
    } else {
      result[key] = valuePart.replace(/^'(.*)'$/, '$1').replace(/^"(.*)"$/, '$1');
    }
  }
  return result;
}

/**
 * Ham TAP çıktısından `not ok` bloklarını best-effort ayrıştırır.
 *
 * ÖNEMLİ: Bu fonksiyon SADECE gözlemlenebilirlik içindir. Ayrıştırma
 * başarısız olsa/eksik kalsa BİLE ham çıktı zaten ayrıca (değiştirilmeden)
 * `npm-test-raw.log`'a yazılır — hiçbir kanıt bu ayrıştırıcıya bağımlı
 * olarak kaybolmaz. Reporter'ın kendisi (# pass N / ℹ pass N ayrıştırması)
 * bu fonksiyondan tamamen bağımsızdır ve değiştirilmemiştir.
 */
export function parseTapFailures(rawOutput) {
  const failures = [];
  const warnings = [];
  try {
    const lines = String(rawOutput ?? '').split(/\r?\n/);
    const nameStack = []; // { indent, name }
    const subtestRe = /^(\s*)#\s*Subtest:\s*(.*)$/;
    const notOkRe = /^(\s*)(not ok|ok)\s+(\d+)\s*-\s*(.*)$/;

    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];

      const subtestMatch = subtestRe.exec(line);
      if (subtestMatch) {
        const indent = subtestMatch[1].length;
        while (nameStack.length && nameStack[nameStack.length - 1].indent >= indent) nameStack.pop();
        nameStack.push({ indent, name: subtestMatch[2].trim() });
        continue;
      }

      const m = notOkRe.exec(line);
      if (!m || m[2] !== 'not ok') continue;
      const indent = m[1].length;
      const num = m[3];
      const nameOnly = m[4].replace(/\s*#\s*(SKIP|TODO).*$/i, '').trim();
      const ancestry = nameStack.filter((s) => s.indent < indent).map((s) => s.name);
      const fullName = [...ancestry, nameOnly].filter(Boolean).join(' > ');

      let cursor = i + 1;
      let record = { number: Number(num), name: nameOnly || null, fullName: fullName || nameOnly || null };

      if (cursor < lines.length && /^\s*---\s*$/.test(lines[cursor])) {
        try {
          const diagIndent = (/^(\s*)---\s*$/.exec(lines[cursor]) || ['', ''])[1].length;
          cursor += 1;
          const blockLines = [];
          while (cursor < lines.length) {
            const l = lines[cursor];
            if (l.trim() === '...' && (/^(\s*)\.\.\.\s*$/.exec(l) || ['', ''])[1].length <= diagIndent) { cursor += 1; break; }
            blockLines.push(l);
            cursor += 1;
          }
          const diag = parseYamlishBlock(blockLines, diagIndent);
          record = {
            ...record,
            duration_ms: diag.duration_ms ?? null,
            type: diag.type ?? null,
            location: diag.location ?? null,
            failureType: diag.failureType ?? null,
            code: diag.code ?? null,
            errorName: diag.name ?? null,
            operator: diag.operator ?? null,
            error: diag.error ?? null,
            expected: diag.expected ?? null,
            actual: diag.actual ?? null,
            stack: diag.stack ?? null,
          };
          i = cursor - 1;
        } catch (blockError) {
          warnings.push(`"${fullName}" bloğu ayrıştırılamadı: ${String(blockError?.message || blockError).slice(0, 160)}`);
        }
      }
      failures.push(record);
    }
  } catch (error) {
    warnings.push(`genel ayrıştırma hatası: ${String(error?.message || error).slice(0, 200)}`);
  }
  return { failures, warnings };
}

async function persistParsedFailures(ctx, { failures, warnings, pass, fail, code }) {
  const dir = artifactsDirFor(ctx);
  const filePath = resolve(dir, FAILURES_JSON_FILENAME);
  const payload = {
    schemaVersion: 1,
    tool: 'scripts/production-validation/check-regression.mjs (observability-only)',
    timestamp: new Date().toISOString(),
    command: 'npm test -- --test-reporter=tap',
    exitCode: code,
    reportedPass: pass,
    reportedFail: Number.isNaN(fail) ? null : fail,
    parsedNotOkCount: failures.length,
    parseWarnings: warnings,
    rawLogFile: RAW_LOG_FILENAME,
    failures,
  };
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return { path: filePath, ok: true };
  } catch (error) {
    return { path: filePath, ok: false, error: String(error?.message || error) };
  }
}

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
  //    NOT: komut/args/env/cwd/reporter AŞAĞIDA DEĞİŞTİRİLMEDİ — sadece
  //    başarısızlık durumunda ham çıktı gözlemlenebilirlik için diske yazılır.
  const tests = await spawnCapture('npm', ['test', '--', '--test-reporter=tap'], 15 * 60_000);
  const passMatch = /(?:^|\n)\s*(?:#|ℹ)\s*pass\s+(\d+)/.exec(tests.output);
  const failMatch = /(?:^|\n)\s*(?:#|ℹ)\s*fail\s+(\d+)/.exec(tests.output);
  if (tests.code === null && !passMatch) {
    out.blocked('npm test', `test çalıştırıcısı başlatılamadı: ${tests.output.trim().slice(-160)}`, { expected: '732 pass / 0 fail', severity: SEVERITY.CRITICAL, action: 'npm install çalıştırıldı mı?' });
  } else {
    const pass = passMatch ? Number(passMatch[1]) : 0;
    const fail = failMatch ? Number(failMatch[1]) : Number.NaN;
    if (tests.code === 0 && fail === 0) {
      out.pass('npm test (scoring/OMR/DB regresyonu)', '0 başarısız test', `${pass} PASS · ${fail} FAIL`, { severity: SEVERITY.CRITICAL });
    } else {
      // ---- Gözlemlenebilirlik: ham çıktıyı kaydet + best-effort ayrıştır. ----
      // Bu blok PASS/FAIL kararını DEĞİŞTİRMEZ; yalnızca zaten hesaplanmış
      // `pass`/`fail`/`tests.code` değerlerini kanıtla birlikte görünür kılar.
      const rawLog = await persistRawTestOutput(ctx, tests.output);
      const { failures, warnings } = parseTapFailures(tests.output);
      const failuresJson = await persistParsedFailures(ctx, { failures, warnings, pass, fail, code: tests.code });

      // Gösterim yolu her zaman GERÇEKTEN yazılan dosyanın yoludur (ctx.artifactsDir
      // override edilmiş olsa bile sabit varsayılan metne düşülmez).
      const displayPath = (result) => {
        if (!result.ok) return `(yazılamadı: ${result.error})`;
        try { return relative(repoRoot(), result.path) || result.path; }
        catch { return result.path; }
      };
      const relRaw = displayPath(rawLog);
      const relJson = displayPath(failuresJson);

      console.log(`\n  [check-regression] ${Number.isNaN(fail) ? '?' : fail} regression test failed.`);
      console.log(`  [check-regression] Raw output: ${relRaw}`);
      console.log(`  [check-regression] Parsed failures: ${relJson} (${failures.length} not-ok bloğu ayrıştırıldı)`);
      if (warnings.length) console.log(`  [check-regression] Ayrıştırma uyarıları: ${warnings.length} (detay: failures JSON içinde parseWarnings)`);

      // Konsolda kısa liste (stack trace basılmaz — tamamı artifact'ta).
      const CONSOLE_LIMIT = 20;
      failures.slice(0, CONSOLE_LIMIT).forEach((f, idx) => {
        const errFirstLine = (f.error ? String(f.error).split('\n')[0] : (f.failureType || '')).slice(0, 140);
        console.log(`  [check-regression] FAIL ${idx + 1}: ${f.fullName || f.name || `#${f.number}`}${errFirstLine ? ` — ${errFirstLine}` : ''}`);
      });
      if (failures.length > CONSOLE_LIMIT) {
        console.log(`  [check-regression] ... ve ${failures.length - CONSOLE_LIMIT} tane daha (tamamı: ${relJson})`);
      }
      if (!failures.length) {
        console.log('  [check-regression] "not ok" bloğu ayrıştırılamadı; ham çıktıyı inceleyin (yukarıdaki dosya).');
      }

      out.fail(
        'npm test (scoring/OMR/DB regresyonu)',
        '0 başarısız test',
        `${pass} PASS · ${Number.isNaN(fail) ? '?' : fail} FAIL (çıkış kodu ${tests.code})`,
        {
          severity: SEVERITY.CRITICAL,
          action: `Ham çıktı: ${relRaw} · Ayrıştırılan hatalar: ${relJson} (${failures.length} not-ok). Önce testleri yeşillendirin; production validation anlamlı değildir.`,
        },
      );
    }
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
