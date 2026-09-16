/** Per-item evidence dump for one photo, using the real pipeline stages. */
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
import { refinePageCentres, fitRingCenter, RING_REFINE } from '../src/omr/bubbleRingRefinement';
import { inspectItemResponses } from '../src/omr/markDetector';

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
const filterMin = Number(process.argv[3] ?? 0), filterMax = Number(process.argv[4] ?? 999);
const onlyAmbiguous = process.argv[5] === 'amb';

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
const normalized = warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm);
const all = page.items.flatMap(item => item.responseAreas);

// Per-area fit status.
const fits = new Map<string, ReturnType<typeof fitRingCenter>>();
for (const area of all) fits.set(area.responseId, fitRingCenter(normalized, area, all));
const reasons: Record<string, number> = {};
const okOffsets: number[] = [];
for (const fit of fits.values()) {
  const key = fit.ok ? 'ok' : (fit.reason ?? '?').replace(/\(.*\)/g, '').trim();
  reasons[key] = (reasons[key] ?? 0) + 1;
  if (fit.ok) okOffsets.push(Math.hypot(fit.dx, fit.dy));
}
console.log('fit stats:', JSON.stringify(reasons));
console.log('ok offsets: max', Math.max(0, ...okOffsets).toFixed(2), 'count', okOffsets.length);

const offsets = refinePageCentres(normalized, all);

for (const item of page.items) {
  if (item.itemNumber < filterMin || item.itemNumber > filterMax) continue;
  const inspected = inspectItemResponses(normalized, item, all, offsets);
  const evidence = inspected.map(r => {
    const m = r.measurement;
    const fit = fits.get(m.responseId)!;
    const off = fit.ok ? `fit(${fit.dx.toFixed(2)},${fit.dy.toFixed(2)})` : `NOM(${(fit.reason ?? '').slice(0, 20)})`;
    return `${m.choiceId}: cd=${m.darkness.toFixed(2)} cc=${m.coverage.toFixed(2)} pd=${r.peripheralDarkness.toFixed(2)} pc=${r.peripheralCoverage.toFixed(2)} cE=${r.centralEvidence ? 1 : 0} pE=${r.peripheralEvidence ? 1 : 0} ${off}`;
  });
  console.log(`#${String(item.itemNumber).padStart(3)} :: ${evidence.join(' | ')}`);
}
