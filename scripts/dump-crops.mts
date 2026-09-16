/** Dumps side-by-side crops of the original photo and the normalized page for a list of items. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { formDefinition } from '../src/omr/formDefinition';
import type { PixelImage } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';
import { toGrayscale } from '../src/omr/imageQuality';
import { isolatePaper } from '../src/omr/pageIsolation';
import { decodePageQr } from '../src/omr/qrDecoder';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { parsePageIdentity, createPageQr } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { fitHomography, fitSimilarity, warpPerspective, CANONICAL_PIXELS_PER_MM, mapPoint } from '../src/omr/perspectiveCorrection';

async function loadPhoto(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const scale = Math.min(1, SCAN_LIMITS.longSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return { width, height, data: new Uint8ClampedArray(context.getImageData(0, 0, width, height).data) };
}

const name = process.argv[2] ?? 'c4.jpg';
const items = process.argv.slice(3).map(Number);
const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', name));
const gray = toGrayscale(photo);
let oriented = gray, iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
for (let q = 1; q < 4 && !dec; q++) {
  const r = rotateGray90(gray, q); const i = isolatePaper(r); const d = decodePageQr(i.image);
  if (d) { oriented = r; iso = i; dec = d; turns = q; }
}
if (dec) {
  const k = quarterTurnsToUpright(dec.corners); const total = (turns + k) % 4;
  if (total !== turns) { oriented = rotateGray90(gray, total); iso = isolatePaper(oriented); dec = decodePageQr(iso.image); }
}
const identity = parsePageIdentity(dec!.text, formDefinition);
const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
const predictions = [fitHomography(qr.innerCorners, dec!.corners), fitSimilarity(qr.innerCorners, dec!.corners)];
const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
const markers = detectAlignmentMarks(iso.image, page.alignmentMarks, predictions, qrCenter, () => {}, { mm: qr.innerCorners, px: dec!.corners })!;
const physicalCenters = page.alignmentMarks.map(mark => ({ x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 }));
const transform = fitHomography(physicalCenters, markers.map(m => m.center));
const ppm = CANONICAL_PIXELS_PER_MM;
const normalized = warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm);

const first = page.items.find(item => item.itemNumber === items[0])!;
const last = page.items.find(item => item.itemNumber === items[items.length - 1])!;
const areas = page.items.slice(page.items.indexOf(first), page.items.indexOf(last) + 1)
  .flatMap(item => item.responseAreas);
const xMm = Math.min(...areas.map(a => a.x)) - 2, yMm = Math.min(...areas.map(a => a.y)) - 2;
const wMm = Math.max(...areas.map(a => a.x + a.width)) - xMm + 2, hMm = Math.max(...areas.map(a => a.y + a.height)) - yMm + 2;

function saveGray(g: { width: number; height: number; data: Uint8Array }, x: number, y: number, w: number, h: number, out: string, zoom = 3) {
  x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y));
  w = Math.min(w, g.width - x); h = Math.min(h, g.height - y);
  const canvas = createCanvas(w * zoom, h * zoom);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(w * zoom, h * zoom);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = g.data[(y + j) * g.width + x + i]!;
    for (let zj = 0; zj < zoom; zj++) for (let zi = 0; zi < zoom; zi++) {
      const at = ((j * zoom + zj) * w * zoom + i * zoom + zi) * 4;
      img.data[at] = img.data[at + 1] = img.data[at + 2] = v; img.data[at + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  writeFileSync(out, canvas.toBuffer('image/png'));
  console.log('written', out, w * zoom, 'x', h * zoom);
}

// Normalized crop.
saveGray(normalized, xMm * ppm, yMm * ppm, wMm * ppm, hMm * ppm, `/home/user/prev/crop_norm_${name.replace('.jpg', '')}.png`);
// Photo crop: inverse-map the region corners into the source image.
const inv = mapPoint(transform, { x: xMm, y: yMm }), inv2 = mapPoint(transform, { x: xMm + wMm, y: yMm + hMm });
const sx = Math.max(0, Math.floor(Math.min(inv.x, inv2.x) - 4)), sy = Math.max(0, Math.floor(Math.min(inv.y, inv2.y) - 4));
const sw = Math.ceil(Math.abs(inv2.x - inv.x)) + 8, sh = Math.ceil(Math.abs(inv2.y - inv.y)) + 8;
saveGray(iso.image, sx, sy, sw, sh, `/home/user/prev/crop_photo_${name.replace('.jpg', '')}.png`, 1);
console.log(`items ${items[0]}..${items[items.length - 1]}: normalized mm rect (${xMm.toFixed(1)},${yMm.toFixed(1)}) ${wMm.toFixed(1)}x${hMm.toFixed(1)}`);
