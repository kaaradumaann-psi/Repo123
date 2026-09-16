/** Probes exact pixel values vs detector windows for named bubbles. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { formDefinition } from '../src/omr/formDefinition';
import type { PixelImage, ResponseArea } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';
import { toGrayscale } from '../src/omr/imageQuality';
import { isolatePaper } from '../src/omr/pageIsolation';
import { decodePageQr } from '../src/omr/qrDecoder';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { parsePageIdentity, createPageQr } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { fitHomography, fitSimilarity, warpPerspective, CANONICAL_PIXELS_PER_MM } from '../src/omr/perspectiveCorrection';
import { measureResponse } from '../src/omr/markDetector';

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
const itemNumbers = process.argv.slice(3).map(Number);
const choices = new Set(['D', 'Y']);
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

function stats(xs: number[], ys: number[]) {
  let sum = 0, min = 255, max = 0, count = 0;
  for (const x of xs) for (const y of ys) {
    if (x < 0 || y < 0 || x >= normalized.width || y >= normalized.height) continue;
    const v = normalized.data[y * normalized.width + x]!;
    sum += v; min = Math.min(min, v); max = Math.max(max, v); count++;
  }
  return `n=${count} mean=${(sum / Math.max(1, count)).toFixed(1)} min=${min} max=${max}`;
}

for (const itemNumber of itemNumbers) {
  const item = page.items.find(candidate => candidate.itemNumber === itemNumber)!;
  for (const area of item.responseAreas) {
    const cx = (area.x + area.width / 2) * ppm, cy = (area.y + area.height / 2) * ppm;
    const m = measureResponse(normalized, area, undefined, undefined);
    // Raw disk averages at several radii.
    const ringAt = (rMm: number) => {
      const xs: number[] = [], ys: number[] = [];
      for (let a = 0; a < 360; a += 5) {
        const rad = a * Math.PI / 180;
        xs.push(Math.round(cx + Math.cos(rad) * rMm * ppm));
        ys.push(Math.round(cy + Math.sin(rad) * rMm * ppm));
      }
      return stats(xs, ys);
    };
    const disc = (rMm: number) => {
      const xs: number[] = [], ys: number[] = [];
      const r = Math.ceil(rMm * ppm);
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= rMm * rMm * ppm * ppm) { xs.push(Math.round(cx) + dx); ys.push(Math.round(cy) + dy); }
      }
      // dedup pairs
      const seen = new Set<string>(); const sx: number[] = [], sy: number[] = [];
      for (let i = 0; i < xs.length; i++) { const key = xs[i] + ',' + ys[i]; if (seen.has(key)) continue; seen.add(key); sx.push(xs[i]!); sy.push(ys[i]!); }
      return stats(sx, sy);
    };
    console.log(`#${itemNumber} ${area.choiceId} centre=(${cx.toFixed(1)},${cy.toFixed(1)}) cd=${m.darkness.toFixed(2)} cc=${m.coverage.toFixed(2)}`);
    console.log(`   disc0.9=${disc(0.9)}  ring1.2=${ringAt(1.2)}  ring1.6=${ringAt(1.6)}  ring1.75=${ringAt(1.75)}  disc2.2=${disc(2.2)}`);
  }
}
