/**
 * C-series ambiguity attribution. READ-ONLY measurement — changes nothing.
 *
 * The handoff (§11.2a) asks how much of the remaining c1–c4 ambiguity is "budget exceeded"
 * (`kayma çok büyük` — the ring was found but further than maxOffsetMm) versus something else
 * (`halka bulunamadı` — the ring search could not certify a ring at all). That decision drives
 * whether widening the search budget is even the right lever, so it is counted before any change.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createPageQr, parsePageIdentity } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { analyzePage } from '../src/omr/analyzePage';
import { fitRingCenter, RING_REFINE } from '../src/omr/bubbleRingRefinement';
import { formDefinition } from '../src/omr/formDefinition';
import { toGrayscale } from '../src/omr/imageQuality';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { isolatePaper } from '../src/omr/pageIsolation';
import { fitHomography, fitSimilarity, warpPerspective } from '../src/omr/perspectiveCorrection';
import { decodePageQr } from '../src/omr/qrDecoder';
import type { PixelImage } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';

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

type Cat = 'ok' | 'OVER_BUDGET' | 'NOT_FOUND' | 'NOMINAL';
const classify = (reason: string | undefined): Cat => {
  if (!reason) return 'ok';
  if (reason.includes('kayma çok büyük')) return 'OVER_BUDGET';
  if (reason.includes('halka bulunamadı')) return 'NOT_FOUND';
  return 'NOMINAL';
};

console.log(`RING_REFINE.maxOffsetMm = ${RING_REFINE.maxOffsetMm} mm   ` +
  `maxResidualMm = ${RING_REFINE.maxResidualMm}   ` +
  `(row pitch ${formDefinition.pages[0]!.items.length ? 4.25 : 0} mm → half pitch 2.125 mm)\n`);

const totals: Record<string, number> = {};
for (const name of ['c1.jpg', 'c2.jpg', 'c3.jpg', 'c4.jpg']) {
  const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', name));
  const gray = toGrayscale(photo);
  let iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
  for (let q = 1; q < 4 && !dec; q++) {
    const trial = isolatePaper(rotateGray90(gray, q));
    const candidate = decodePageQr(trial.image);
    if (candidate) { iso = trial; dec = candidate; turns = q; }
  }
  if (!dec) { console.log(`${name}: QR unreadable`); continue; }
  const k = quarterTurnsToUpright(dec.corners), total = (turns + k) % 4;
  if (total !== turns) { iso = isolatePaper(rotateGray90(gray, total)); dec = decodePageQr(iso.image) ?? dec; }

  const identity = parsePageIdentity(dec.text, formDefinition);
  const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
  const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
  const predictions = [fitHomography(qr.innerCorners, dec.corners), fitSimilarity(qr.innerCorners, dec.corners)];
  const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
  const markers = detectAlignmentMarks(iso.image, page.alignmentMarks, predictions, qrCenter, () => {},
    { mm: qr.innerCorners, px: dec.corners })!;
  const physical = page.alignmentMarks.map(m => ({ x: m.x + m.width / 2, y: m.y + m.height / 2 }));
  const transform = fitHomography(physical, markers.map(m => m.center));
  const normalized = warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm);

  const all = page.items.flatMap(item => item.responseAreas);
  const fits = new Map<string, ReturnType<typeof fitRingCenter>>();
  for (const area of all) fits.set(area.responseId, fitRingCenter(normalized, area, all));

  const result = await analyzePage(photo, formDefinition);
  if (!result.ok) { console.log(`${name}: ${result.code}`); continue; }
  const ambiguous = result.items.filter(item => item.status === 'ambiguous');
  const multi = result.items.filter(item => item.status === 'multiple');

  const shape = (items: typeof result.items) => {
    const bucket: Record<string, number> = {};
    for (const item of items) {
      const cats = (formDefinition.pages[0]!.items.find(i => i.itemNumber === item.itemNumber)?.responseAreas ?? [])
        .map(area => classify(fits.get(area.responseId)?.reason as string | undefined));
      const key = cats.length ? cats.map(c => c === 'ok' ? 'ok' : c === 'OVER_BUDGET' ? 'OVER' : c === 'NOT_FOUND' ? 'NOTFOUND' : 'NOM').join('+') : '?';
      bucket[key] = (bucket[key] ?? 0) + 1;
    }
    return bucket;
  };

  const offsets = [...fits.values()].filter(f => f.ok).map(f => Math.hypot(f.dx, f.dy));
  offsets.sort((a, b) => a - b);
  const pct = (q: number) => offsets.length ? offsets[Math.min(offsets.length - 1, Math.floor(q * offsets.length))]!.toFixed(2) : '-';

  console.log(`=== ${name}`);
  console.log(`  ring fits: ok ${offsets.length}/288  ` +
    `OVER_BUDGET ${[...fits.values()].filter(f => classify(f.reason) === 'OVER_BUDGET').length}  ` +
    `NOT_FOUND ${[...fits.values()].filter(f => classify(f.reason) === 'NOT_FOUND').length}  ` +
    `NOMINAL ${[...fits.values()].filter(f => classify(f.reason) === 'NOMINAL').length}`);
  console.log(`  accepted offsets (mm): median ${pct(.5)}  p90 ${pct(.9)}  p99 ${pct(.99)}  max ${pct(1)}`);
  console.log(`  ambiguous items ${ambiguous.length}:  ${JSON.stringify(shape(ambiguous))}`);
  console.log(`  multiple items ${multi.length}:  ${JSON.stringify(shape(multi))}`);
  console.log(`  ambiguous item numbers: ${ambiguous.map(i => i.itemNumber).join(',')}`);
  if (ambiguous.length) {
    for (const item of ambiguous) {
      const areas = formDefinition.pages[0]!.items.find(i => i.itemNumber === item.itemNumber)!.responseAreas;
      const detail = areas.map(area => {
        const fit = fits.get(area.responseId)!;
        return `${area.choiceId}:${fit.ok ? `fit(${fit.dx.toFixed(2)},${fit.dy.toFixed(2)})` : classify(fit.reason)}`;
      }).join(' ');
      console.log(`     #${String(item.itemNumber).padStart(3)} ${detail}`);
    }
  }
  for (const [key, value] of Object.entries(shape(ambiguous))) totals[key] = (totals[key] ?? 0) + value;
}
console.log(`\nC-SERIES TOTAL (ambiguous items by the ring status of their D/Y areas): ${JSON.stringify(totals)}`);
