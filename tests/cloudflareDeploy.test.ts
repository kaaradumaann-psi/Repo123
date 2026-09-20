import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

/**
 * `wrangler deploy` bu depoda Vite ile derleme yapmaz; `dist/` klasörünü statik
 * varlık olarak yayınlar. Yapılandırma dosyası silinirse wrangler Vite
 * otomatik kurulumuna girer (`@cloudflare/vite-plugin` eklemek ister),
 * `vite.config.ts`'te `plugins` dizisi bulamaz ve deploy
 * "Cannot modify Vite config: could not find a valid plugins array" hatasıyla
 * durur. Bu testler o dosyanın ve yayın komutunun yerinde kalmasını sağlar.
 */

/** wrangler.jsonc yorum içerebilir (JSONC): dizge dışındaki yorumları at. */
function stripJsonComments(source: string): string {
  let out = '';
  let inString = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]!;
    const next = source[index + 1];
    if (inLineComment) {
      if (char === '\n') {
        inLineComment = false;
        out += char;
      }
      continue;
    }
    if (inBlockComment) {
      if (char === '*' && next === '/') {
        inBlockComment = false;
        index += 1;
      }
      continue;
    }
    if (inString) {
      out += char;
      if (char === '\\') {
        out += next ?? '';
        index += 1;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }
    if (char === '/' && next === '/') {
      inLineComment = true;
      index += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      inBlockComment = true;
      index += 1;
      continue;
    }
    out += char;
  }
  // JSONC sondaki virgüllere izin verir; JSON.parse vermez.
  return out.replace(/,(\s*[}\]])/g, '$1');
}

const config = JSON.parse(stripJsonComments(readFileSync('wrangler.jsonc', 'utf8'))) as {
  name?: string;
  main?: string;
  compatibility_date?: string;
  observability?: { enabled?: boolean };
  assets?: { directory?: string; not_found_handling?: string };
};

test('wrangler.jsonc statik varlık yayınına ayarlı ve depoda duruyor', () => {
  assert.equal(config.name, 'mmpi', 'Worker adı Cloudflare proje adıyla aynı olmalı');
  assert.equal(config.assets?.directory, './dist', 'Yayınlanan klasör dist/ olmalı');
  assert.equal(config.assets?.not_found_handling, 'single-page-application',
    'History API router için SPA fallback gerekir');
  assert.equal(config.main, undefined, 'Statik varlık yayınında Worker giriş noktası olmamalı');
  assert.match(config.compatibility_date ?? '', /^\d{4}-\d{2}-\d{2}$/);
});

test('deploy komutu önce derler, sonra wrangler ile yayınlar', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts?: Record<string, string>;
  };
  const deploy = pkg.scripts?.deploy ?? '';
  assert.match(deploy, /npm run build/, 'deploy öncesi tek dosya derlemesi çalışmalı');
  assert.match(deploy, /wrangler deploy/, 'deploy wrangler ile yayınlamalı');
});
