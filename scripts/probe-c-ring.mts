/**
 * Where IS the printed ring? READ-ONLY measurement.
 *
 * Why this exists: the C-series fit report shows the dominant failure is `halka bulunamadı`
 * (sector completeness < 70%), not `kayma çok büyük` (> maxOffsetMm). That is surprising, because
 * stage 1 scores each of 24 sectors by the radius of its darkest pixel *inside a fixed
 * 1.2–2.05 mm band around the NOMINAL centre*. If the printed ring sits d mm away, its points lie
 * between |1.60−d| and 1.60+d from the nominal centre, so for d > 0.45 mm part of the ring already
 * leaves the band and completeness must fall. This script measures the true ring centre with a
 * displacement-agnostic search (a circle of the printed radius scored around every candidate
 * centre) so the real offset can be compared with the band and with the gates.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createPageQr, parsePageIdentity } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { formDefinition } from '../src/omr/formDefinition';
import { toGrayscale } from '../src/omr/imageQuality';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { isolatePaper } from '../src/omr/pageIsolation';
import { CANONICAL_PIXELS_PER_MM, fitHomography, fitSimilarity, warpPerspective } from '../src/omr/perspectiveCorrection';
import { decodePageQr } from '../src/omr/qrDecoder';
import { RING_REFINE } from '../src/omr/bubbleRingRefinement';
import type { GrayImage, PixelImage } from '../src/omr/omrTypes';
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

const ppm = CANONICAL_PIXELS_PER_MM;
const R = 1.60;                       // printed ring mean radius (mm)
const ANGLES = 48;

const sample = (image: GrayImage, x: number, y: number): number => {
  const xi = Math.round(x), yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= image.width || yi >= image.height) return 255;
  return image.data[yi * image.width + xi]!;
};

/** Local paper level: 85th percentile of a 6 mm box, like the pipeline's own reference. */
function paperLevel(image: GrayImage, cx: number, cy: number): number {
  const half = 3 * ppm;
  const values: number[] = [];
  for (let y = -half; y <= half; y += 2) for (let x = -half; x <= half; x += 2) {
    values.push(sample(image, cx + x, cy + y));
  }
  values.sort((a, b) => a - b);
  return values[Math.min(values.length - 1, Math.floor(values.length * 0.85))]!;
}

/** Mean relative darkness along the printed-radius circle centred at (cx+dx, cy+dy). */
function ringScore(image: GrayImage, cx: number, cy: number, dxMm: number, dyMm: number, reference: number): number {
  let total = 0;
  for (let i = 0; i < ANGLES; i++) {
    const angle = (i / ANGLES) * Math.PI * 2;
    const x = cx + dxMm * ppm + Math.cos(angle) * R * ppm;
    const y = cy + dyMm * ppm + Math.sin(angle) * R * ppm;
    total += Math.max(0, reference - sample(image, x, y)) / reference;
  }
  return total / ANGLES;
}

/**
 * Printed-ring detector: dark on the ring, light inside it, light outside it.
 * A bare darkness maximiser prefers a *filled* neighbouring bubble (its whole disc is dark),
 * which is why it must not be used to locate a ring. Requiring a light centre and a light
 * surround is what makes the located centre the printed ring rather than any dark blob.
 */
function ringTemplateScore(image: GrayImage, cx: number, cy: number, dxMm: number, dyMm: number, reference: number): number {
  const relative = (x: number, y: number) => Math.max(0, reference - sample(image, x, y)) / reference;
  let onRing = 0, inside = 0, outside = 0;
  for (let i = 0; i < ANGLES; i++) {
    const angle = (i / ANGLES) * Math.PI * 2;
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    onRing += relative(cx + dxMm * ppm + cosine * R * ppm, cy + dyMm * ppm + sine * R * ppm);
    inside += relative(cx + dxMm * ppm + cosine * 0.4 * ppm, cy + dyMm * ppm + sine * 0.4 * ppm);
    outside += relative(cx + dxMm * ppm + cosine * 2.45 * ppm, cy + dyMm * ppm + sine * 2.45 * ppm);
  }
  return (onRing - inside - outside) / ANGLES;
}

/** Brute-force ring centre over a wide grid; returns the best offset in mm. */
function findRing(image: GrayImage, cx: number, cy: number) {
  const reference = paperLevel(image, cx, cy);
  const nominalScore = ringTemplateScore(image, cx, cy, 0, 0, reference);
  let best = { dx: 0, dy: 0, score: nominalScore };
  for (let dy = -2.6; dy <= 2.6001; dy += 0.1) {
    for (let dx = -2.6; dx <= 2.6001; dx += 0.1) {
      const score = ringTemplateScore(image, cx, cy, dx, dy, reference);
      if (score > best.score) best = { dx, dy, score };
    }
  }
  return { ...best, nominalScore, reference };
}

/** What stage 1's fixed band would report for a given true displacement (analytic). */
function bandFraction(d: number): number {
  // fraction of the ring whose distance from the nominal centre falls inside [1.2, 2.05] mm
  if (d < 1e-6) return 1;
  const lo = (RING_REFINE.searchBandInnerMm ** 2 - R ** 2 - d * d) / (2 * R * d);
  const hi = (RING_REFINE.searchBandOuterMm ** 2 - R ** 2 - d * d) / (2 * R * d);
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  const angleOf = (v: number) => Math.acos(clamp(v));
  // |cos| interval [lo,hi] → angular measure
  let measure = 0;
  const inside = (c: number) => c >= lo && c <= hi;
  for (let i = 0; i < 3600; i++) {
    if (inside(Math.cos((i / 3600) * Math.PI * 2))) measure++;
  }
  void angleOf;
  return measure / 3600;
}

const name = process.argv[2] ?? 'c4.jpg';
const spec = process.argv[3] ?? '97-115';
const ranges = spec.split(',').map(part => part.split('-').map(Number) as [number, number?]);
const wanted = new Set<number>();
for (const [from, to] of ranges) for (let n = from; n <= (to ?? from); n++) wanted.add(n);

const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', name));
const gray = toGrayscale(photo);
let iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
for (let q = 1; q < 4 && !dec; q++) {
  const trial = isolatePaper(rotateGray90(gray, q));
  const candidate = decodePageQr(trial.image);
  if (candidate) { iso = trial; dec = candidate; turns = q; }
}
const k = quarterTurnsToUpright(dec!.corners), total = (turns + k) % 4;
if (total !== turns) { iso = isolatePaper(rotateGray90(gray, total)); dec = decodePageQr(iso.image) ?? dec; }
const identity = parsePageIdentity(dec!.text, formDefinition);
const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
const predictions = [fitHomography(qr.innerCorners, dec!.corners), fitSimilarity(qr.innerCorners, dec!.corners)];
const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
const markers = detectAlignmentMarks(iso.image, page.alignmentMarks, predictions, qrCenter, () => {},
  { mm: qr.innerCorners, px: dec!.corners })!;
const physical = page.alignmentMarks.map(m => ({ x: m.x + m.width / 2, y: m.y + m.height / 2 }));
const transform = fitHomography(physical, markers.map(m => m.center));
const normalized = warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm);

console.log(`${name}: true printed-ring displacement (wide 2.6 mm search, nominal = pipeline's own centre)`);
console.log(`band ${RING_REFINE.searchBandInnerMm}–${RING_REFINE.searchBandOuterMm} mm | maxOffsetMm ${RING_REFINE.maxOffsetMm} | half row pitch 2.125 mm\n`);
console.log('item choice   located dx,dy (mm)   dist   nominal template   best template   band fraction (analytic)');
console.log('              (template = dark-on-ring minus light-centre minus light-surround; rejects filled neighbours)');

const all = page.items.flatMap(item => item.responseAreas);
for (const item of page.items) {
  if (!wanted.has(item.itemNumber)) continue;
  for (const area of item.responseAreas) {
    const cx = (area.x + area.width / 2) * ppm;
    const cy = (area.y + area.height / 2) * ppm;
    const found = findRing(normalized, cx, cy);
    const dist = Math.hypot(found.dx, found.dy);
    console.log(`#${String(item.itemNumber).padStart(3)} ${area.choiceId.padEnd(4)}  ` +
      `${found.dx >= 0 ? ' ' : ''}${found.dx.toFixed(1)},${found.dy >= 0 ? ' ' : ''}${found.dy.toFixed(1)}`.padEnd(53) +
      `${dist.toFixed(2).padStart(5)}   ${found.nominalScore.toFixed(3).padStart(10)}   ${found.score.toFixed(3).padStart(12)}   ` +
      `${(bandFraction(dist) * 100).toFixed(0).padStart(3)}%`);
  }
}
console.log('\nanalytic: for a displacement d, the share of the ring still inside the fixed probe band:');
for (const d of [0, 0.25, 0.5, 0.75, 1.0, 1.3, 1.6, 1.8, 2.0, 2.2]) {
  console.log(`   d=${d.toFixed(2)} mm → ${(bandFraction(d) * 100).toFixed(0)}% of the ring in band ` +
    `(stage-1 completeness ceiling ≈ ${(bandFraction(d) * 100).toFixed(0)}%, gate is ${RING_REFINE.minSearchCompleteness * 100}%)`);
}
