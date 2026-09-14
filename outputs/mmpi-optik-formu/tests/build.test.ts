import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { Script } from 'node:vm';
import test from 'node:test';

test('standalone build contains one intact inline script and no source-file imports', () => {
  execFileSync(process.execPath, ['scripts/build.mjs']);
  const html = readFileSync('dist/index.html', 'utf8');
  const scripts = [...html.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.ok(scripts[0]?.[1]);
  assert.doesNotThrow(() => new Script(scripts[0]![1]!));
  assert.ok(!html.includes('src="/src/main.tsx"'));
  assert.ok(html.includes('@page'));
  assert.ok(html.includes('lang="tr"'));
});
