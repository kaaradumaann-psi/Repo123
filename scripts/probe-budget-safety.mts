/**
 * READ-ONLY. Would a 2.5 mm search budget (exclusion still ON, completeness ≥70%)
 * chase a neighbour or break safety fixtures? Production is not changed.
 */
import { RING_REFINE } from '../src/omr/bubbleRingRefinement';
import { formDefinition } from '../src/omr/formDefinition';
import { percentile } from '../src/omr/imageQuality';
import { CANONICAL_PIXELS_PER_MM } from '../src/omr/perspectiveCorrection';
import type { GrayImage, ResponseArea } from '../src/omr/omrTypes';

const PPM = CANONICAL_PIXELS_PER_MM;
const NOMINAL_R = 1.60;

function centreMm(area: ResponseArea) { return { x: area.x + area.width / 2, y: area.y + area.height / 2 }; }
function radiusMm(area: ResponseArea) { return Math.min(area.width, area.height) / 2; }
function insideBubble(area: ResponseArea, xMm: number, yMm: number) {
  const rx = Math.max(0.05, area.width / 2), ry = Math.max(0.05, area.height / 2), c = centreMm(area);
  return ((xMm - c.x) / rx) ** 2 + ((yMm - c.y) / ry) ** 2 <= 1;
}
function nearby(area: ResponseArea, all: readonly ResponseArea[]) {
  const c = centreMm(area), lim = radiusMm(area) + 0.45 + radiusMm(area) + 1.85;
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

function search(image: GrayImage, area: ResponseArea, all: readonly ResponseArea[], maxR: number, exclude: boolean) {
  const c = centreMm(area), cx = c.x * PPM, cy = c.y * PPM, nbs = nearby(area, all), ref = referenceOf(image, area, all);
  const sectors = 24, tol = RING_REFINE.searchRadiusToleranceMm, thr = RING_REFINE.darknessThreshold;
  let best = { dx: 0, dy: 0, offset: 0, completeness: -1, rms: 99 };
  for (let radius = 0; radius <= maxR + 1e-9; radius += 0.25) {
    const count = radius === 0 ? 1 : Math.max(8, Math.round(radius * 16));
    for (let i = 0; i < count; i++) {
      const ang = count === 1 ? 0 : (i / count) * 2 * Math.PI;
      const dx = radius * Math.cos(ang), dy = radius * Math.sin(ang);
      let hits = 0, sumSq = 0;
      for (let s = 0; s < sectors; s++) {
        const a = ((s + .5) / sectors) * 2 * Math.PI, cos = Math.cos(a), sin = Math.sin(a);
        let bestD = -1, bestR = NaN;
        for (let r = RING_REFINE.searchBandInnerMm; r <= RING_REFINE.searchBandOuterMm + 1e-9; r += 0.1) {
          const px = Math.round(cx + dx * PPM + cos * r * PPM - .5);
          const py = Math.round(cy + dy * PPM + sin * r * PPM - .5);
          if (px < 0 || py < 0 || px >= image.width || py >= image.height) continue;
          const xMm = (px + .5) / PPM, yMm = (py + .5) / PPM;
          if (exclude && covered(xMm, yMm, nbs)) continue;
          const d = darkness(image.data[py * image.width + px]!, ref);
          if (d > bestD) { bestD = d; bestR = r; }
        }
        if (bestD >= thr && Math.abs(bestR - NOMINAL_R) <= tol) { hits++; sumSq += (bestR - NOMINAL_R) ** 2; }
        else sumSq += tol ** 2;
      }
      const completeness = hits / sectors, rms = Math.sqrt(sumSq / sectors), offset = Math.hypot(dx, dy);
      const better = completeness > best.completeness + 1e-9 ||
        (Math.abs(completeness - best.completeness) <= 1e-9 && rms < best.rms - 1e-9) ||
        (Math.abs(completeness - best.completeness) <= 1e-9 && Math.abs(rms - best.rms) <= 1e-9 && offset < best.offset);
      if (better) best = { dx, dy, offset, completeness, rms };
    }
  }
  const nearest = nbs.map(nb => Math.hypot(centreMm(nb).x - (c.x + best.dx), centreMm(nb).y - (c.y + best.dy))).sort((a, b) => a - b)[0] ?? Infinity;
  return { ...best, nearest, pass: best.completeness >= RING_REFINE.minSearchCompleteness && best.offset >= RING_REFINE.minOffsetMm };
}

function paintRing(data: Uint8Array, width: number, height: number, cxMm: number, cyMm: number, value = 30) {
  const cx = cxMm * PPM, cy = cyMm * PPM, r = 1.75 * PPM;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const dist = Math.hypot(x + .5 - cx, y + .5 - cy);
      const cov = Math.max(0, Math.min(1, r + .5 - dist)) - Math.max(0, Math.min(1, r - .3 * PPM + .5 - dist));
      if (cov > 0) data[y * width + x] = Math.round(250 * (1 - cov) + value * cov);
    }
}
function paintDisk(data: Uint8Array, w: number, h: number, cxMm: number, cyMm: number, radiusMm: number, value: number) {
  const cx = cxMm * PPM, cy = cyMm * PPM, r = radiusMm * PPM;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
      if (x >= 0 && y >= 0 && x < w && y < h && Math.hypot(x + .5 - cx, y + .5 - cy) <= r) data[y * w + x] = value;
}
function paintAnnulus(data: Uint8Array, w: number, h: number, cxMm: number, cyMm: number, inner: number, outer: number, value: number) {
  const cx = cxMm * PPM, cy = cyMm * PPM;
  for (let y = Math.floor(cy - outer * PPM - 1); y <= Math.ceil(cy + outer * PPM + 1); y++)
    for (let x = Math.floor(cx - outer * PPM - 1); x <= Math.ceil(cx + outer * PPM + 1); x++) {
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const r = Math.hypot(x + .5 - cx, y + .5 - cy) / PPM;
      if (r >= inner && r <= outer) data[y * w + x] = value;
    }
}
function paintHairline(data: Uint8Array, w: number, h: number, x0: number, y0: number, x1: number, y1: number) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * PPM * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    paintDisk(data, w, h, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, 0.08, 25);
  }
}
function blankPage() {
  const page = formDefinition.pages[0]!;
  const width = Math.round(210 * PPM), height = Math.round(297 * PPM);
  const data = new Uint8Array(width * height).fill(250);
  const all = page.items.flatMap(i => i.responseAreas);
  for (const area of all) paintRing(data, width, height, area.x + area.width / 2, area.y + area.height / 2);
  return { image: { width, height, data } as GrayImage, page, all };
}

const page = formDefinition.pages[0]!;
const target = page.items.find(i => i.itemNumber === 21)!.responseAreas.find(a => a.choiceId === 'Y')!;
const below = page.items.find(i => i.itemNumber === 22)!.responseAreas.find(a => a.choiceId === 'Y')!;
const cT = centreMm(target), cB = centreMm(below);

function show(label: string, image: GrayImage, all: ResponseArea[]) {
  const a = search(image, target, all, 1.6, true);
  const b = search(image, target, all, 2.5, true);
  const chase = b.nearest < 1.75;
  console.log(`${label.padEnd(42)} 1.6: comp=${(a.completeness * 100).toFixed(0).padStart(3)}% off=${a.offset.toFixed(2)} pass=${a.pass ? 'Y' : 'n'}   ` +
    `2.5: comp=${(b.completeness * 100).toFixed(0).padStart(3)}% off=${b.offset.toFixed(2)} (${b.dx.toFixed(2)},${b.dy.toFixed(2)}) ` +
    `nb=${b.nearest.toFixed(2)} pass=${b.pass ? 'Y' : 'n'} chase=${chase ? 'YES' : 'no'}`);
}

{
  const { image, all } = blankPage();
  show('clean blank', image, all);
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cT.x, cT.y, 1.22, 20);
  show('strong fill', image, all);
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cT.x, cT.y, 1.22, 205);
  show('faint/erased', image, all);
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cT.x, cT.y, 1.02, 1.58, 20);
  show('peripheral annular ink', image, all);
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cB.x, cB.y, 1.22, 20);
  show('adjacent-row filled (target blank)', image, all);
}
{
  const { image, all } = blankPage();
  paintHairline(image.data, image.width, image.height, cT.x, cT.y + 1.75, cB.x, cB.y - 1.75);
  show('hairline to next row', image, all);
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cT.x, cT.y, 1.40, 1.90, 250);
  show('target ring ERASED, neighbour ring remains', image, all);
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cT.x, cT.y, 1.40, 1.90, 250);
  paintDisk(image.data, image.width, image.height, cB.x, cB.y, 1.22, 20);
  show('target ring ERASED + neighbour FILLED', image, all);
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cT.x, cT.y, 1.40, 1.90, 250);
  paintRing(image.data, image.width, image.height, cT.x, cT.y + 2.2);
  show('true displacement dy=2.2 mm', image, all);
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cT.x, cT.y, 1.40, 1.90, 250);
  paintRing(image.data, image.width, image.height, cT.x, cT.y + 1.5);
  show('true displacement dy=1.5 mm', image, all);
}

console.log('\nDONE. Production untouched.');
