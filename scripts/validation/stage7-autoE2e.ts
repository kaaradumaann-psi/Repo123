/**
 * AŞAMA 7 — Otomatik pipeline uçtan uca GERÇEK fotoğraf testi.
 * analyzePage( fotoğraf ) — manuel köşe YOK, yalnız otomatik izolasyon+hizalama.
 */
import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';

const files = [
  'docs/TestGorselleri/1a.jpg',           // sayfa 2, kareyi dolduruyor, portre
  'docs/TestGorselleri/c1.jpg',           // sayfa 1, hafif eğik
  'docs/TestGorselleri/c2.jpg',
  'docs/TestGorselleri/3a.jpg',           // yatay
  'docs/TestGorselleri/5a.jpg',           // 90° döndürülmüş
  'docs/TestGorselleri/5870507625873608526.jpg', // telefon, gölge, yatık
  'docs/TestGorselleri/5870507625873608539.jpg',
  'docs/TestGorselleri/5870507625873608522.jpg', // güçlü perspektif
];

console.log('| Fotoğraf | boyut | analyzePage | sayfa | işaretli | warnings |');
console.log('|---|---|---|---|---|---|');
for (const file of files) {
  const image = await loadImage(readFileSync(file));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const rgba: PixelImage = { width: image.width, height: image.height, data };
  const t0 = Date.now();
  const read = await analyzePage(rgba, formDefinition);
  const ms = Date.now() - t0;
  if (read.ok) {
    const marked = read.items.filter(i => i.status === 'reliable' || i.status === 'single').length;
    console.log(`| ${file.split('/').pop()} | ${image.width}×${image.height} | ✅ ok (${ms}ms) | ${read.pageNumber} | ${marked} | ${read.warnings.length} |`);
  } else {
    console.log(`| ${file.split('/').pop()} | ${image.width}×${image.height} | ❌ ${read.code} (${ms}ms) | — | — | — |`);
  }
}
