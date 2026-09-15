import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { createSafePdfWorkerSource } from '../src/scanner/pdfIO';

// The scanner rejects every pdf.js except the exact audited one, and the hardening
// patch is appended to that worker's module source. These checks pin the contract:
// if a pdf.js upgrade renames any referenced symbol, the tests fail here instead of
// silently shipping a weakened (or broken) worker.
const workerPath = fileURLToPath(new URL('../node_modules/pdfjs-dist/build/pdf.worker.mjs', import.meta.url));
const workerSource = readFileSync(workerPath, 'utf8');

test('the bundled worker exposes every symbol the hardening patch references', () => {
  const requiredSymbols = [
    'class Parser', 'class PartialEvaluator', 'class PDFImage', 'class DecodeStream',
    'function isName', 'function info', 'function warn',
    'static async buildImage', 'static async createMask',
    'makeInlineImage(', 'buildPaintImageXObject(', 'makeFilter(', 'makeStream(',
    'ensureBuffer(', 'minBufferLength',
  ];
  for (const symbol of requiredSymbols) {
    assert.ok(workerSource.includes(symbol), `pdf.worker.mjs no longer contains "${symbol}"`);
  }
});

test('the bundled pdf.js is exactly the audited version', () => {
  const require = createRequire(import.meta.url);
  const { version } = require('pdfjs-dist/package.json') as { version: string };
  assert.doesNotThrow(() => createSafePdfWorkerSource('// worker', version));
});

test('any other pdf.js version is refused instead of running unhardened', () => {
  assert.throws(() => createSafePdfWorkerSource('// worker', '9.9.9'), /sürüm/);
});
