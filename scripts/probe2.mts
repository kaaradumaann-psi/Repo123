/** Raw 25x25 pixel grid around named bubbles of the normalized page. */
import { readFileSync } from 'node:fs';
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
import { fitHomography, fitSimilarity, warpPerspective, CANONICAL_PIXELS_PER_MM } from '../src/omr/perspectiveCorrection';

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

for (const itemNumber of itemNumbers) {
  const item = page.items.find(candidate => candidate.itemNumber === itemNumber)!;
  for (const area of item.responseAreas) {
    const cx = Math.round((area.x + area.width / 2) * ppm), cy = Math.round((area.y + area.height / 2) * ppm);
    const rows: string[] = [];
    for (let dy = -15; dy <= 15; dy += 1) {
      let line = `y${(dy / ppm).toFixed(2).padStart(6)}: `;
      for (let dx = -15; dx <= 15; dx += 1) {
        const xx = cx + dx, yy = cy + dy;
        const v = (xx >= 0 && yy >= 0 && xx < normalized.width && yy < normalized.height)
          ? normalized.data[yy * normalized.width + xx]! : -1;
        line += (v < 100 ? ' ' : '') + String(v).padStart(3);
      }
      rows.push(line);
    }
    console.log(`#${itemNumber} ${area.choiceId} centre=(${cx},${cy})`);
    console.log(rows.join('\n'));
  }
}
