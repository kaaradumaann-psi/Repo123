/** Correct paired-statistics probe: central disc vs ring for named bubbles. */
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
let iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
for (let q = 1; q < 4 && !dec; q++) {
  const r = rotateGray90(gray, q); const i = isolatePaper(r); const d = decodePageQr(i.image);
  if (d) { iso = i; dec = d; turns = q; }
}
if (dec) {
  const k = quarterTurnsToUpright(dec.corners); const total = (turns + k) % 4;
  if (total !== turns) { const u = isolatePaper(rotateGray90(gray, total)); iso = u; dec = decodePageQr(u.image); }
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
const G = normalized;

function meanDisc(cx: number, cy: number, rMm: number): number {
  let sum = 0, n = 0; const r = rMm * ppm;
  for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
    if (dx * dx + dy * dy > r * r) continue;
    const x = Math.round(cx) + dx, y = Math.round(cy) + dy;
    if (x < 0 || y < 0 || x >= G.width || y >= G.height) continue;
    sum += G.data[y * G.width + x]!; n++;
  }
  return n ? sum / n : NaN;
}
function ringDarkness(cx: number, cy: number, rMm: number): number {
  // fraction of angular samples whose pixel is "dark" (value<128) at radius rMm
  let dark = 0, n = 0;
  for (let a = 0; a < 360; a += 2) {
    const rad = a * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * rMm * ppm), y = Math.round(cy + Math.sin(rad) * rMm * ppm);
    if (x < 0 || y < 0 || x >= G.width || y >= G.height) continue;
    n++; if (G.data[y * G.width + x]! < 128) dark++;
  }
  return n ? dark / n : NaN;
}

for (const itemNumber of itemNumbers) {
  const item = page.items.find(candidate => candidate.itemNumber === itemNumber)!;
  for (const area of item.responseAreas) {
    const cx = (area.x + area.width / 2) * ppm, cy = (area.y + area.height / 2) * ppm;
    console.log(`#${itemNumber} ${area.choiceId} centre=(${cx.toFixed(1)},${cy.toFixed(1)}) ` +
      `disc0.9=${meanDisc(cx, cy, 0.9).toFixed(0)}  ring1.6 darkFrac=${ringDarkness(cx, cy, 1.6).toFixed(2)}  ` +
      `disc2.4=${meanDisc(cx, cy, 2.4).toFixed(0)}`);
  }
}
