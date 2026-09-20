import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

execFileSync(process.execPath, ['scripts/build.mjs']);

test('standalone build contains one intact inline script and no source-file imports', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.ok(scripts[0]?.[1]);
  assert.doesNotThrow(() => new Script(scripts[0]![1]!));
  assert.ok(!html.includes('src="/src/main.tsx"'));
  assert.ok(html.includes('@page'));
  assert.ok(html.includes('lang="tr"'));
  // The screen-only site footer and the document metadata travel with the single-file build
  // (the class name lives both in the CSS and as the React className string).
  assert.ok(html.includes('site-footer'), 'Site alt bilgisi derlemeye girmemiş');
  assert.ok(html.includes('name="author" content="Halil Karaduman"'), 'Yazar meta etiketi derlemeye girmemiş');
  assert.ok(html.includes('https://www.halilkaraduman.com.tr'), 'Yazar sitesi bağlantısı derlemeye girmemiş');
  assert.ok(html.includes('mailto:'), 'E-posta bağlantısı şeması derlemeye girmemiş');
  assert.ok(html.includes('contact@halilkaraduman.com.tr'), 'E-posta adresi derlemeye girmemiş');
});

test('standalone build hides the screen footer from print while the sheet footer keeps the copyright', () => {
  let html = readFileSync('dist/index.html', 'utf8');
  // The print rule survives minification in the @media print rule list.
  assert.ok(/\.site-footer[^{]*\{[^}]*display:\s*none\s*!important/.test(html),
    'Site alt bilgisi yazdırmada gizlenmeli');
  // esbuild encodes (C) and the middle dot as hex escapes inside the runtime template;
  // decode them so the printable footer line can be matched as authored.
  html = html.replace(/\\x[Aa]9/g, '©').replace(/\\x[Bb]7/g, '·');
  // The printable sheet's own footer line (rendered on every page) and its parts.
  assert.ok(html.includes('© 2026'), 'Basılı formun telif satırı başlangıcı derlemeye girmemiş');
  assert.ok(html.includes('Halil Karaduman'), 'Telif sahibi derlemeye girmemiş');
  assert.ok(html.includes('www.halilkaraduman.com.tr'), 'Yazar sitesi telif satırında yok');
  assert.ok(html.includes('contact@halilkaraduman.com.tr'), 'E-posta telif satırında yok');
});

test('standalone build is offline and locked down by a script-hash CSP', () => {
  const html = readFileSync('dist/index.html', 'utf8');
  // The deliverable must never call out to a CDN or font service at runtime.
  assert.ok(!html.includes('fonts.googleapis.com'));
  assert.ok(!html.includes('fonts.gstatic.com'));
  const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)">/.exec(html);
  assert.ok(csp, 'CSP meta etiketi eksik');
  assert.ok(csp![1].includes("default-src 'none'"));
  assert.ok(csp![1].includes("font-src 'none'"));
  // The hash must match the exact script body in the document, otherwise the page would not run.
  const script = /<script type="module">([\s\S]*?)<\/script>/.exec(html)?.[1];
  assert.ok(script, 'Satır içi betik bulunamadı');
  const hash = createHash('sha256').update(script!).digest('base64');
  assert.ok(csp![1].includes(`script-src 'sha256-${hash}'`), 'CSP script hashi belgedeki betikle eslesmiyor');
  // B5: Supabase yapılandırılmamış build tamamen çevrimdışıdır (connect-src yok);
  // yapılandırılmışsa yalnızca o origin'e izin verilir (script bunu build'de üretir).
  const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? '').trim();
  if (supabaseUrl === '') {
    assert.ok(!csp![1].includes('connect-src'), 'Supabase yapılandırılmamışken connect-src olmamalı');
  } else {
    const origin = new URL(supabaseUrl).origin;
    assert.ok(csp![1].includes(`connect-src ${origin}`), 'CSP connect-src Supabase origin ile sınırlı olmalı');
  }
});

test('standalone build ships the SPA fallback rule for Cloudflare hosting', () => {
  // Bulut barındırmada pathname yönlendirmesi bu kural olmadan 404 verir.
  const redirects = readFileSync('dist/_redirects', 'utf8');
  assert.match(redirects, /^\/\*\s+\/index\.html\s+200$/m, 'SPA fallback kuralı eksik ya da bozuk');
});

test('standalone build embeds the verified form PDF byte for byte', () => {
  // The site offers this file for download, so a drift between the committed PDF and the embedded
  // copy would hand out a form the reader was never verified against.
  const html = readFileSync('dist/index.html', 'utf8');
  const match = /data:application\/pdf;base64,([A-Za-z0-9+/=]+)/.exec(html);
  assert.ok(match, 'PDF veri URI olarak gomulmemis');
  const embedded = Buffer.from(match![1]!, 'base64');
  const committed = readFileSync('MMPI-566-optik-cevap-formu.pdf');
  assert.equal(embedded.subarray(0, 8).toString('latin1'), '%PDF-1.7');
  assert.equal(embedded.length, committed.length);
  assert.deepEqual(embedded, committed);
  assert.ok(html.includes('download-button'), 'indirme dugmesi derlemeye girmemis');
});
