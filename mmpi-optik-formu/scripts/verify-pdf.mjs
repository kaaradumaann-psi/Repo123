import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

// Optional artifact check; requires Poppler's pdftotext executable.
const file = process.argv[2] ?? '../MMPI-566-optik-cevap-formu.pdf';
const xml = execFileSync('pdftotext', ['-bbox', file, '-'], { encoding: 'utf8' });
const pages = [...xml.matchAll(/<page width="([\d.]+)" height="([\d.]+)">([\s\S]*?)<\/page>/g)];
assert.equal(pages.length, 4, 'The PDF must contain exactly four pages.');
const mm = points => Number(points) * 25.4 / 72;
const expectedRanges = [[1, 144], [145, 288], [289, 432], [433, 566]];
for (const [index, page] of pages.entries()) {
  assert.ok(Math.abs(mm(page[1]) - 210) < .2);
  assert.ok(Math.abs(mm(page[2]) - 297) < .2);
  const numbers = [...page[3].matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(\d+)<\/word>/g)]
    .filter(word => {
      const x = mm(word[3]);
      const y = mm(word[2]);
      return y > 67 && y < 271 && [32, 91.333333, 150.666667].some(right => Math.abs(x - right) < 1);
    }).map(word => Number(word[5])).sort((a, b) => a - b);
  const [first, last] = expectedRanges[index];
  assert.deepEqual(numbers, Array.from({ length: last - first + 1 }, (_, n) => first + n));
  console.log(`Page ${index + 1}: A4, ${numbers.length} printed item numbers, ${first}-${last}.`);
}
console.log('PDF geometry, page count and all 566 printed item numbers verified.');
