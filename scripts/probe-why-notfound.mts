/**
 * READ-ONLY. Production untouched.
 *
 * Neighbour-exclusion OFF only raised NOT_FOUND mean completeness 37.3% → 40.8%.
 * This script asks why completeness is stuck ~33% even with exclusion off:
 *   Q1. Is a 1.60 mm circle findable at some offset OUTSIDE the 1.6 mm budget?
 *   Q2. Is the printed ring simply too faint (darkness < 0.28)?
 *   Q3. Does the unconstrained winner land on a neighbour centre (chase)?
 *   Q4. What radius actually maximises circular completeness around nominal?
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createPageQr, parsePageIdentity } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { analyzePage } from '../src/omr/analyzePage';
import { RING_REFINE, fitRingCenter } from '../src/omr/bubbleRingRefinement';
import { formDefinition } from '../src/omr/formDefinition';
import { percentile, toGrayscale } from '../src/omr/imageQuality';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { isolatePaper } from '../src/omr/pageIsolation';
import { CANONICAL_PIXELS_PER_MM, fitHomography, fitSimilarity, warpPerspective } from '../src/omr/perspectiveCorrection';
import { decodePageQr } from '../src/omr/qrDecoder';
import type { GrayImage, PixelImage, ResponseArea } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';

const PPM = CANONICAL_PIXELS_PER_MM;
const NOMINAL_R = 1.60;

function centreMm(area: ResponseArea) { return { x: area.x + area.width / 2, y: area.y + area.height / 2 }; }
function radiusMm(area: ResponseArea) { return Math.min(area.width, area.height) / 2; }
function insideBubble(area: ResponseArea, xMm: number, yMm: number) {
  const rx = Math.max(0.05, area.width / 2), ry = Math.max(0.05, area.height / 2), c = centreMm(area);
  return ((xMm - c.x) / rx) ** 2 + ((yMm - c.y) / ry) ** 2 <= 1;
}
function nearby(area: ResponseArea, all: readonly ResponseArea[]) {
  const c = centreMm(area);
  const lim = radiusMm(area) + 0.45 + radiusMm(area) + 1.85;
  return all.filter(nb => nb.responseId !== area.responseId && Math.hypot(centreMm(nb).x - c.x, centreMm(nb).y - c.y) <= lim + radiusMm(nb));
}
function covered(xMm: number, yMm: number, nbs: readonly ResponseArea[]) { return nbs.some(nb => insideBubble(nb, xMm, yMm)); }
function darkness(v: number, ref: number) { return Math.max(0, Math.min(1, (ref - v) / Math.max(1, ref))); }

function referenceOf(image: GrayImage, area: ResponseArea, all: readonly ResponseArea[]) {
  const c = centreMm(area), r = radiusMm(area), cx = c.x * PPM, cy = c.y * PPM, nbs = nearby(area, all);
  const ring = (inner: number, outer: number) => {
    const vals: number[] = [];
    for (let y = Math.max(0, Math.floor(cy - outer * PPM)); y <= Math.min(image.height - 1, Math.ceil(cy + outer * PPM)); y++)
      for (let x = Math.max(0, Math.floor(cx - outer * PPM)); x <= Math.min(image.width - 1, Math.ceil(cx + outer * PPM)); x++) {
        const xMm = (x + .5) / PPM, yMm = (y + .5) / PPM, d = Math.hypot(xMm - c.x, yMm - c.y);
        if (d < inner || d > outer || covered(xMm, yMm, nbs)) continue;
        vals.push(image.data[y * image.width + x]!);
      }
    return vals;
  };
  return Math.max(percentile(ring(r + .35, r + .95), .8), percentile(ring(r + 1.25, r + 1.85), .8), 120);
}

function completenessAt(
  image: GrayImage, cx: number, cy: number, ref: number, nbs: readonly ResponseArea[],
  dx: number, dy: number, exclude: boolean, radius = NOMINAL_R,
  bandInner = RING_REFINE.searchBandInnerMm, bandOuter = RING_REFINE.searchBandOuterMm,
) {
  const sectors = 24, tol = RING_REFINE.searchRadiusToleranceMm, thr = RING_REFINE.darknessThreshold;
  let hits = 0, darkSectors = 0, peak = 0;
  for (let s = 0; s < sectors; s++) {
    const ang = ((s + .5) / sectors) * 2 * Math.PI, cos = Math.cos(ang), sin = Math.sin(ang);
    let bestD = -1, bestR = NaN;
    for (let r = bandInner; r <= bandOuter + 1e-9; r += 0.1) {
      const px = Math.round(cx + dx * PPM + cos * r * PPM - .5);
      const py = Math.round(cy + dy * PPM + sin * r * PPM - .5);
      if (px < 0 || py < 0 || px >= image.width || py >= image.height) continue;
      const xMm = (px + .5) / PPM, yMm = (py + .5) / PPM;
      if (exclude && covered(xMm, yMm, nbs)) continue;
      const d = darkness(image.data[py * image.width + px]!, ref);
      if (d > bestD) { bestD = d; bestR = r; }
    }
    if (bestD > peak) peak = bestD;
    if (bestD >= thr) darkSectors++;
    if (bestD >= thr && Math.abs(bestR - radius) <= tol) hits++;
  }
  return { completeness: hits / sectors, darkFrac: darkSectors / sectors, peak };
}

function wideSearch(
  image: GrayImage, area: ResponseArea, all: readonly ResponseArea[], exclude: boolean, maxR: number,
) {
  const c = centreMm(area), cx = c.x * PPM, cy = c.y * PPM, nbs = nearby(area, all), ref = referenceOf(image, area, all);
  let best = { dx: 0, dy: 0, offset: 0, completeness: -1, darkFrac: 0, peak: 0 };
  const radii = [];
  for (let r = 0; r <= maxR + 1e-9; r += 0.25) radii.push(r);
  for (const radius of radii) {
    const count = radius === 0 ? 1 : Math.max(8, Math.round(radius * 16));
    for (let i = 0; i < count; i++) {
      const ang = count === 1 ? 0 : (i / count) * 2 * Math.PI;
      const dx = radius * Math.cos(ang), dy = radius * Math.sin(ang);
      const s = completenessAt(image, cx, cy, ref, nbs, dx, dy, exclude);
      if (s.completeness > best.completeness + 1e-9 ||
        (Math.abs(s.completeness - best.completeness) <= 1e-9 && Math.hypot(dx, dy) < best.offset)) {
        best = { dx, dy, offset: Math.hypot(dx, dy), ...s };
      }
    }
  }
  const nearestNb = nbs
    .map(nb => ({ id: nb.responseId, d: Math.hypot(centreMm(nb).x - (c.x + best.dx), centreMm(nb).y - (c.y + best.dy)) }))
    .sort((a, b) => a.d - b.d)[0];
  return { ...best, ref, nearestNbDist: nearestNb?.d ?? Infinity, nearestNbId: nearestNb?.id ?? '-' };
}

function radiusSweep(image: GrayImage, area: ResponseArea, all: readonly ResponseArea[]) {
  const c = centreMm(area), cx = c.x * PPM, cy = c.y * PPM, nbs = nearby(area, all), ref = referenceOf(image, area, all);
  const rows: { r: number; darkFrac: number; peak: number }[] = [];
  for (let r = 0.6; r <= 3.2 + 1e-9; r += 0.2) {
    const s = completenessAt(image, cx, cy, ref, nbs, 0, 0, true, r, r - 0.15, r + 0.15);
    rows.push({ r, darkFrac: s.darkFrac, peak: s.peak });
  }
  return rows;
}

async function loadPhoto(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const scale = Math.min(1, SCAN_LIMITS.longSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale)), height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height), context = canvas.getContext('2d');
  context.fillStyle = '#fff'; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0, width, height);
  return { width, height, data: new Uint8ClampedArray(context.getImageData(0, 0, width, height).data) };
}

async function normalizePhoto(name: string) {
  const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', name));
  const gray = toGrayscale(photo);
  let iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
  for (let q = 1; q < 4 && !dec; q++) {
    const trial = isolatePaper(rotateGray90(gray, q));
    const cand = decodePageQr(trial.image);
    if (cand) { iso = trial; dec = cand; turns = q; }
  }
  if (!dec) return null;
  const k = quarterTurnsToUpright(dec.corners), total = (turns + k) % 4;
  if (total !== turns) { iso = isolatePaper(rotateGray90(gray, total)); dec = decodePageQr(iso.image) ?? dec; }
  const identity = parsePageIdentity(dec.text, formDefinition);
  const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
  const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
  const predictions = [fitHomography(qr.innerCorners, dec.corners), fitSimilarity(qr.innerCorners, dec.corners)];
  const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
  const markers = detectAlignmentMarks(iso.image, page.alignmentMarks, predictions, qrCenter, () => {},
    { mm: qr.innerCorners, px: dec.corners });
  if (!markers) return null;
  const physical = page.alignmentMarks.map(m => ({ x: m.x + m.width / 2, y: m.y + m.height / 2 }));
  const transform = fitHomography(physical, markers.map(m => m.center));
  return {
    photo,
    normalized: warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm),
    page, all: page.items.flatMap(i => i.responseAreas),
  };
}

type Rec = {
  label: string;
  prodComp: number;
  wide16: number; wide16off: number; wide16dx: number; wide16dy: number;
  wide30: number; wide30off: number; wide30dx: number; wide30dy: number; nbDist: number;
  peakR: number; peakDarkFrac: number; peakAt: number;
};

const recs: Rec[] = [];

for (const name of ['c1.jpg', 'c2.jpg', 'c3.jpg', 'c4.jpg']) {
  const packed = await normalizePhoto(name);
  if (!packed) continue;
  const result = await analyzePage(packed.photo, formDefinition);
  if (!result.ok) continue;
  for (const item of result.items.filter(i => i.status === 'ambiguous')) {
    const def = packed.page.items.find(i => i.itemNumber === item.itemNumber)!;
    for (const area of def.responseAreas) {
      const fit = fitRingCenter(packed.normalized, area, packed.all);
      if (fit.ok || !(fit.reason ?? '').includes('halka bulunamadı')) continue;
      const w16 = wideSearch(packed.normalized, area, packed.all, true, 1.6);
      const w16off = wideSearch(packed.normalized, area, packed.all, false, 1.6);
      const w30 = wideSearch(packed.normalized, area, packed.all, true, 3.0);
      const sweep = radiusSweep(packed.normalized, area, packed.all);
      const bestR = sweep.reduce((a, b) => b.darkFrac > a.darkFrac ? b : a);
      recs.push({
        label: `${name}#${item.itemNumber}${area.choiceId}`,
        prodComp: fit.completeness,
        wide16: w16.completeness, wide16off: w16off.completeness, wide16dx: w16.dx, wide16dy: w16.dy,
        wide30: w30.completeness, wide30off: w30.offset, wide30dx: w30.dx, wide30dy: w30.dy, nbDist: w30.nearestNbDist,
        peakR: bestR.r, peakDarkFrac: bestR.darkFrac, peakAt: bestR.peak,
      });
    }
  }
}

const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
console.log(`NOT_FOUND areas measured: ${recs.length}`);
console.log(`mean production completeness (search, excl ON, ≤1.6): ${(100 * mean(recs.map(r => r.wide16))).toFixed(1)}%`);
console.log(`mean completeness excl OFF ≤1.6:                       ${(100 * mean(recs.map(r => r.wide16off))).toFixed(1)}%`);
console.log(`mean completeness excl ON  ≤3.0:                       ${(100 * mean(recs.map(r => r.wide30))).toFixed(1)}%`);

const pass16 = recs.filter(r => r.wide16 >= 0.7).length;
const pass16off = recs.filter(r => r.wide16off >= 0.7).length;
const pass30 = recs.filter(r => r.wide30 >= 0.7).length;
console.log(`≥70% at ≤1.6 excl ON:  ${pass16}/${recs.length}`);
console.log(`≥70% at ≤1.6 excl OFF: ${pass16off}/${recs.length}`);
console.log(`≥70% at ≤3.0 excl ON:  ${pass30}/${recs.length}`);

const chase = recs.filter(r => r.nbDist < 1.75);
const far = recs.filter(r => r.wide30off > 1.65 && r.wide30 >= 0.7);
const stillLow = recs.filter(r => r.wide30 < 0.5);
console.log(`unconstrained winner inside a neighbour disc (chase): ${chase.length}`);
console.log(`unconstrained winner offset >1.65 AND ≥70%:           ${far.length}`);
console.log(`even ≤3.0 mm still <50% complete:                     ${stillLow.length}`);
console.log(`mean offset of ≤3.0 winner: ${mean(recs.map(r => r.wide30off)).toFixed(2)} mm`);
console.log(`mean |nearest neighbour| of ≤3.0 winner: ${mean(recs.map(r => r.nbDist)).toFixed(2)} mm`);
console.log(`mean peak dark-frac around nominal (any r): ${(100 * mean(recs.map(r => r.peakDarkFrac))).toFixed(1)}% at mean r=${mean(recs.map(r => r.peakR)).toFixed(2)} mm, mean peak darkness=${mean(recs.map(r => r.peakAt)).toFixed(2)}`);

// buckets of unconstrained offset
const buckets = [0.5, 1.0, 1.6, 2.0, 2.5, 3.0];
console.log('\noffset of ≤3.0 winner vs whether it would pass 70%:');
let prev = 0;
for (const b of buckets) {
  const slice = recs.filter(r => r.wide30off > prev && r.wide30off <= b);
  console.log(`  (${prev.toFixed(1)},${b.toFixed(1)}] n=${slice.length}  mean comp ${(100 * mean(slice.map(r => r.wide30))).toFixed(0)}%  ≥70% ${slice.filter(r => r.wide30 >= 0.7).length}`);
  prev = b;
}

console.log('\npeak dark-frac (nominal-centred, any radius) distribution:');
for (const t of [0.3, 0.5, 0.7, 0.9, 1.01]) {
  console.log(`  darkFrac ≥ ${(t > 1 ? 1 : t).toFixed(2)}: ${recs.filter(r => r.peakDarkFrac >= t - (t > 1 ? 0.01 : 0)).length}/${recs.length}`);
}

console.log('\nSample of still-low (<50% even at 3 mm) items:');
for (const r of stillLow.slice(0, 12)) {
  console.log(`  ${r.label}  ≤1.6=${(100 * r.wide16).toFixed(0)}%  ≤3.0=${(100 * r.wide30).toFixed(0)}% @ (${r.wide30dx.toFixed(2)},${r.wide30dy.toFixed(2)})  nbDist=${r.nbDist.toFixed(2)}  peakDarkFrac=${(100 * r.peakDarkFrac).toFixed(0)}%@r=${r.peakR.toFixed(1)} peakD=${r.peakAt.toFixed(2)}`);
}

console.log('\nSample of “would pass at 3 mm” items:');
for (const r of recs.filter(x => x.wide30 >= 0.7 && x.wide16 < 0.7).slice(0, 12)) {
  console.log(`  ${r.label}  ≤1.6=${(100 * r.wide16).toFixed(0)}%  ≤3.0=${(100 * r.wide30).toFixed(0)}% @ (${r.wide30dx.toFixed(2)},${r.wide30dy.toFixed(2)}) off=${r.wide30off.toFixed(2)}  nbDist=${r.nbDist.toFixed(2)}`);
}

console.log('\nDONE. Production files untouched.');