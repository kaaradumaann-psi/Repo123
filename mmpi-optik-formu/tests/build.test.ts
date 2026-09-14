import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
