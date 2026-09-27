/**
 * 10 — Production HTTP + Configuration (rapor §14, §17, §26, §27).
 *
 * "Production HTTP" alanı:
 *  - GET / → 200 text/html (canlı production isteği)
 *  - http:// → https:// yönlendirme davranışı
 *  - SPA fallback (derin rota → 200 + HTML)
 *  - asset yüklenebilirliği
 * "Configuration" alanı:
 *  - REUSE: npm run verify:production-config (depo artefakt kontrolleri)
 *  - canlı deployed bundle: secret kalıbı + localhost/dev referansı taraması
 * Değer token/secret içerse bile artifact'a YAZILMAZ.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Collector, SEVERITY } from './lib/output.mjs';
import { repoRoot, envValue } from './lib/env.mjs';
import { request, originOf } from './lib/http.mjs';
import { scanText } from './lib/secret-patterns.mjs';

function runNode(script, args, timeoutMs) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [resolve(repoRoot(), script), ...args], {
      cwd: repoRoot(),
      windowsHide: true,
      env: { ...process.env, NO_COLOR: '1' },
    });
    let output = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolvePromise({ code: null, output: `${output}\n[validation] timeout` }); }, timeoutMs);
    child.stdout?.on('data', (d) => { output = (output + d.toString()).slice(-60_000); });
    child.stderr?.on('data', (d) => { output = (output + d.toString()).slice(-60_000); });
    child.on('error', (error) => { clearTimeout(timer); resolvePromise({ code: null, output: String(error?.message || error) }); });
    child.on('close', (code) => { clearTimeout(timer); resolvePromise({ code, output }); });
  });
}

export async function run(ctx) {
  const http = new Collector('Production HTTP');
  const config = new Collector('Configuration');
  const productionUrl = (envValue('PRODUCTION_URL') || '').replace(/\/+$/, '');
  const origin = originOf(productionUrl);

  /* --------------------------- Production HTTP --------------------------- */
  if (!productionUrl) {
    http.blocked('Production HTTP doğrulaması', 'PRODUCTION_URL tanımsız', { severity: SEVERITY.CRITICAL, expected: 'https://<canlı-domain>', action: 'Runbook: PRODUCTION_URL değişkeni.' });
  } else {
    const home = await request(productionUrl);
    if (!home.ok) http.blocked('GET / (canlı)', `erişilemiyor (${home.error})`, { expected: 'HTTP 200 text/html', endpoint: '/', severity: SEVERITY.CRITICAL, action: 'DNS/TLS/hosting durumunu kontrol edin; domain ayakta mı?' });
    else if (home.status !== 200) http.fail('GET / (canlı)', 'HTTP 200', `HTTP ${home.status}`, { endpoint: '/', severity: SEVERITY.CRITICAL });
    else {
      const type = home.headers.get('content-type') || '';
      if (type.includes('text/html')) http.pass('GET / (canlı)', 'HTTP 200 text/html', `HTTP 200 · ${(home.bytes / 1024).toFixed(0)} KiB`, { endpoint: '/', severity: SEVERITY.CRITICAL });
      else http.fail('GET / (canlı)', 'HTTP 200 text/html', `HTTP 200 ama content-type=${type || 'yok'}`, { endpoint: '/', severity: SEVERITY.HIGH });
      ctx.productionHtml = home.text;
    }

    // HTTP→HTTPS davranışı (fail: bağlantı ya reddedilir ya da https'e döner).
    if (origin?.startsWith('https://')) {
      const httpOrigin = origin.replace('https://', 'http://');
      const redirectProbe = await request(httpOrigin, { timeoutMs: 10_000 });
      if (!redirectProbe.ok) http.conditional('HTTP→HTTPS yönlendirme', '3xx → https veya bağlantı reddi', `bağlantı reddedildi (${redirectProbe.error})`, { severity: SEVERITY.MEDIUM });
      else if ([301, 302, 307, 308].includes(redirectProbe.status)) {
        const location = redirectProbe.headers.get('location') || '';
        if (location.startsWith('https://')) http.pass('HTTP→HTTPS yönlendirme', '3xx → https', `HTTP ${redirectProbe.status} → https`, { severity: SEVERITY.HIGH });
        else http.fail('HTTP→HTTPS yönlendirme', '3xx → https', `HTTP ${redirectProbe.status} → ${location || 'yok'}`, { severity: SEVERITY.HIGH });
      } else if (redirectProbe.status >= 400) http.pass('HTTP düz metin reddedilir', 'HTTP 4xx/redirect', `HTTP ${redirectProbe.status} (http hizmet vermiyor)`, { severity: SEVERITY.MEDIUM });
      else http.fail('HTTP→HTTPS yönlendirme', '3xx → https veya http reddi', `HTTP ${redirectProbe.status} + içerik`, { severity: SEVERITY.HIGH, action: 'Düz HTTP üzerinden uygulama yanıt vermemelidir.' });
    }

    // SPA fallback: derin rota.
    const deep = await request(`${productionUrl}/kayitlar`);
    if (!deep.ok) http.blocked('SPA fallback (/kayitlar)', `erişilemiyor (${deep.error})`, { expected: 'HTTP 200 text/html', endpoint: '/kayitlar', severity: SEVERITY.HIGH });
    else if (deep.status === 200 && (deep.headers.get('content-type') || '').includes('text/html')) {
      http.pass('SPA fallback (/kayitlar)', 'HTTP 200 text/html', `HTTP ${deep.status}`, { endpoint: '/kayitlar', severity: SEVERITY.HIGH });
    } else http.fail('SPA fallback (/kayitlar)', 'HTTP 200 text/html', `HTTP ${deep.status}`, { endpoint: '/kayitlar', severity: SEVERITY.HIGH, action: 'Workers not_found_handling=single-page-application ayarını doğrulayın.' });

    // Yararlı statikler.
    for (const probe of ['/robots.txt', '/favicon.ico']) {
      const res = await request(`${productionUrl}${probe}`);
      if (!res.ok) http.notApplicable(`GET ${probe}`, `erişilemiyor (${res.error})`, { endpoint: probe });
      else if (res.status === 200) http.pass(`GET ${probe}`, 'HTTP 200', 'HTTP 200', { endpoint: probe, severity: SEVERITY.LOW });
      else if (res.status === 404) http.notApplicable(`GET ${probe}`, 'HTTP 404 (isteğe bağlı varlık yok)', { endpoint: probe });
      else http.conditional(`GET ${probe}`, 'HTTP 200/404', `HTTP ${res.status}`, { endpoint: probe, severity: SEVERITY.LOW });
    }

    // Asset yüklenebilirliği: ana HTML içinde script/link varlıkları.
    if (ctx.productionHtml) {
      const assets = [...ctx.productionHtml.matchAll(/(?:src|href)="(\/[^"?#]+\.(?:js|css|png|svg|woff2?))"/g)].map((m) => m[1]);
      const unique = [...new Set(assets)].slice(0, 8);
      if (unique.length === 0) http.conditional('Asset yüklenebilirliği', 'harici JS/CSS asset referansları', 'HTML’de harici asset yok (tek-dosya build olabilir)', { severity: SEVERITY.MEDIUM });
      else {
        let okCount = 0; let failCount = 0;
        for (const path of unique) {
          const res = await request(`${productionUrl}${path}`, { maxBytes: 200_000 });
          if (res.ok && res.status === 200 && res.bytes > 0) okCount += 1;
          else failCount += 1;
        }
        if (failCount === 0) http.pass('Asset yüklenebilirliği', `${unique.length}/${unique.length} asset 200`, `${okCount}/${unique.length} OK`, { severity: SEVERITY.HIGH });
        else http.fail('Asset yüklenebilirliği', 'tüm asset’ler 200', `${okCount}/${unique.length} OK`, { severity: SEVERITY.HIGH, action: 'assets dizini deploy ile uyumlu mu? wrangler assets.directory.' });
      }
    }
  }

  /* --------------------------- Configuration --------------------------- */
  // REUSE: mevcut depo doğrulayıcısını aynen çalıştır.
  const distReady = existsSync(resolve(repoRoot(), 'dist/index.html')) && existsSync(resolve(repoRoot(), 'dist/_headers'));
  if (!distReady) {
    config.skipped('[REPOSITORY] verify:production-config', 'dist/ yok — önce npm run build (ve canlı değerlerle) üretin', { severity: SEVERITY.MEDIUM, expected: 'PASS satırları', action: 'npm run build komutu dist/index.html + dist/_headers üretir.' });
  } else {
    const res = await runNode('scripts/verify-production-config.mjs', ['--repository-only'], 2 * 60_000);
    const lines = res.output.split('\n').filter((l) => /^\[(PASS|FAIL|BLOCKED)\]/.test(l.trim()));
    if (lines.length === 0) {
      config.blocked('[REPOSITORY] verify:production-config', `çıktı ayrıştırılamadı: ${res.output.trim().slice(-160)}`, { severity: SEVERITY.MEDIUM });
    } else {
      for (const line of lines) {
        const trimmed = line.trim();
        const status = trimmed.slice(1, trimmed.indexOf(']'));
        const restText = trimmed.slice(trimmed.indexOf(']') + 1).trim();
        const [area, evidence] = restText.split('—').map((s) => s.trim());
        if (status === 'PASS') config.pass(`[REUSE repo-config] ${area}`, evidence, evidence, { severity: SEVERITY.MEDIUM });
        else config.fail(`[REUSE repo-config] ${area}`, 'PASS', evidence || 'FAIL', { severity: SEVERITY.MEDIUM, action: `npm run verify:production-config çıktısını inceleyin.` });
      }
    }
  }

  // Canlı deployed bundle üzerinde frontend yapılandırma kanıtları.
  if (!ctx.productionHtml) {
    config.blocked('[LIVE] deployed bundle yapılandırması', 'production HTML alınamadı', { severity: SEVERITY.HIGH });
  } else {
    const html = ctx.productionHtml;
    const supabaseHost = envValue('SUPABASE_URL') ? new URL(envValue('SUPABASE_URL')).hostname : null;
    const hasSupabaseRef = supabaseHost ? html.includes(supabaseHost) : null;
    if (hasSupabaseRef === true) config.pass('[LIVE] bundle → doğru Supabase host referansı', 'production Supabase host bundle’da', 'mevcut', { severity: SEVERITY.HIGH });
    else if (hasSupabaseRef === false) config.fail('[LIVE] bundle → doğru Supabase host referansı', 'production Supabase host bundle’da', 'YOK — yanlış projeye bağlı olabilir', { severity: SEVERITY.HIGH, action: 'Hosting build değişkenleri (VITE_SUPABASE_URL) doğru proje mi?' });
    else config.blocked('[LIVE] bundle → Supabase host referansı', 'SUPABASE_URL tanımsız', { severity: SEVERITY.HIGH });

    // localhost/development izleri.
    const localhostHits = scanText(html, [
      /https?:\/\/localhost[:/0-9]*/g,
      /https?:\/\/127\.0\.0\.1[:/0-9]*/g,
      /\b[a-z0-9-]+\.supabase\.localhost\b/g,
    ]);
    if (localhostHits === 0) config.pass('[LIVE] bundle → localhost/dev referansı yok', '0 eşleşme', '0 eşleşme', { severity: SEVERITY.MEDIUM });
    else config.fail('[LIVE] bundle → localhost/dev referansı yok', '0 eşleşme', `${localhostHits} eşleşme`, { severity: SEVERITY.MEDIUM, action: 'Development host referansları production bundle’a sızmış; build değişkenlerini inceleyin.' });

    // Debug/test kalıntıları (değer yazılmaz).
    const debugHits = scanText(html, [/VITE_[A-Z_]*TEST[A-Z_]*\s*=\s*[^\s"']+/g, /__TEST_USER__/g, /\bdebugger;/g]);
    if (debugHits === 0) config.pass('[LIVE] bundle → test/debug kalıntısı yok', '0 eşleşme', '0 eşleşme', { severity: SEVERITY.MEDIUM });
    else config.conditional('[LIVE] bundle → test/debug kalıntısı', '0 eşleşme', `${debugHits} eşleşme`, { severity: SEVERITY.MEDIUM, action: 'Kanıt gerektirir: eşleşen metin incelenmelidir (değer bu rapora yazılmaz).' });

    // Anon anahtar bulunması FAIL DEĞİLDİR (public tasarım; rapor §43 false-positive kontrolü).
    config.notApplicable('[LIVE] Supabase anon key bundle’da görünmesi', 'public tasarım — tek başına secret DEĞİLDİR; RLS+anon kısıtlamaları ile korunur (yanlış pozitif işaretlenmez)');
  }

  return [http, config];
}
