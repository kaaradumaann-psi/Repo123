/**
 * READ-ONLY diagnostic. Does not change production code or thresholds.
 *
 * Measures the effect of `isCoveredByNeighbour()` inside the same probe
 * geometry that `searchRingOffset()` uses, comparing:
 *   A — neighbour exclusion ON  (production)
 *   B — neighbour exclusion OFF (diagnostic only)
 *
 * Every dark peak is then labelled:
 *   target  — hit is not inside a neighbour ellipse
 *   recovered — hit is inside a neighbour ellipse but NOT on that neighbour's
 *               printed ring (the target ring overlapping the neighbour disc)
 *   foreign — hit is on a neighbour's printed ring (1.20–1.90 mm from that
 *             neighbour's centre)
 *
 * `probe-c-ring` is not used. Offsets reported here are the search-grid
 * winners (± the 0.25 mm radial grid), not physical millimetre truth.
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
const NEIGHBOUR_RING_INNER = 1.20;
const NEIGHBOUR_RING_OUTER = 1.90;

function centreMm(area: ResponseArea) {
  return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
}
function radiusMm(area: ResponseArea) {
  return Math.min(area.width, area.height) / 2;
}
function insideBubble(area: ResponseArea, xMm: number, yMm: number) {
  const rx = Math.max(0.05, area.width / 2);
  const ry = Math.max(0.05, area.height / 2);
  const c = centreMm(area);
  return ((xMm - c.x) / rx) ** 2 + ((yMm - c.y) / ry) ** 2 <= 1;
}
function nearbyResponseAreas(area: ResponseArea, allAreas: readonly ResponseArea[]) {
  const c = centreMm(area);
  const samplingRadius = radiusMm(area) + 0.45;
  const referenceRadius = radiusMm(area) + 1.85;
  return allAreas.filter(candidate => {
    if (candidate.responseId === area.responseId) return false;
    const o = centreMm(candidate);
    return Math.hypot(o.x - c.x, o.y - c.y) <= samplingRadius + referenceRadius + radiusMm(candidate);
  });
}
function isCoveredByNeighbour(xMm: number, yMm: number, neighbours: readonly ResponseArea[]) {
  return neighbours.some(nb => insideBubble(nb, xMm, yMm));
}
function onNeighbourRing(xMm: number, yMm: number, neighbours: readonly ResponseArea[]) {
  return neighbours.some(nb => {
    const c = centreMm(nb);
    const d = Math.hypot(xMm - c.x, yMm - c.y);
    return d >= NEIGHBOUR_RING_INNER && d <= NEIGHBOUR_RING_OUTER;
  });
}
function coveringNeighbour(xMm: number, yMm: number, neighbours: readonly ResponseArea[]) {
  return neighbours.find(nb => insideBubble(nb, xMm, yMm));
}
function normalizedDarkness(value: number, reference: number) {
  return Math.max(0, Math.min(1, (reference - value) / Math.max(1, reference)));
}
function collectReference(image: GrayImage, area: ResponseArea, allAreas: readonly ResponseArea[]) {
  const c = centreMm(area);
  const r = radiusMm(area);
  const cx = c.x * PPM, cy = c.y * PPM;
  const neighbours = nearbyResponseAreas(area, allAreas);
  const collectRing = (inner: number, outer: number): number[] => {
    const vals: number[] = [];
    for (let y = Math.max(0, Math.floor(cy - outer * PPM)); y <= Math.min(image.height - 1, Math.ceil(cy + outer * PPM)); y++) {
      for (let x = Math.max(0, Math.floor(cx - outer * PPM)); x <= Math.min(image.width - 1, Math.ceil(cx + outer * PPM)); x++) {
        const xMm = (x + 0.5) / PPM, yMm = (y + 0.5) / PPM;
        const d = Math.hypot(xMm - c.x, yMm - c.y);
        if (d < inner || d > outer) continue;
        if (isCoveredByNeighbour(xMm, yMm, neighbours)) continue;
        vals.push(image.data[y * image.width + x]!);
      }
    }
    return vals;
  };
  const backgroundLevel = percentile(collectRing(r + 0.35, r + 0.95), 0.8);
  const paperLevel = percentile(collectRing(r + 1.25, r + 1.85), 0.8);
  return Math.max(backgroundLevel, paperLevel, 120);
}

type HitKind = 'target' | 'recovered' | 'foreign' | 'none';
type SectorInfo = {
  sector: number;
  angleDeg: number;
  probes: number;
  skipped: number;
  hit: boolean;
  kind: HitKind;
  rMm: number;
  darkness: number;
  neighbourId: string | null;
};
type SearchDiag = {
  dx: number; dy: number; offset: number;
  completeness: number; rms: number;
  probes: number; skipped: number; skipPct: number;
  hits: number; targetHits: number; recoveredHits: number; foreignHits: number;
  skippedSectors: number[];
  sectors: SectorInfo[];
};

function classifySample(xMm: number, yMm: number, neighbours: readonly ResponseArea[]): { kind: HitKind; neighbourId: string | null } {
  const nb = coveringNeighbour(xMm, yMm, neighbours);
  if (!nb) return { kind: 'target', neighbourId: null };
  if (onNeighbourRing(xMm, yMm, [nb])) return { kind: 'foreign', neighbourId: nb.responseId };
  return { kind: 'recovered', neighbourId: nb.responseId };
}

function candidates(): { dx: number; dy: number }[] {
  const out: { dx: number; dy: number }[] = [{ dx: 0, dy: 0 }];
  for (const radius of RING_REFINE.searchRadiiMm) {
    if (radius === 0) continue;
    const count = Math.max(8, Math.round(radius * 18));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      out.push({ dx: radius * Math.cos(angle), dy: radius * Math.sin(angle) });
    }
  }
  return out;
}

function scoreCandidate(
  image: GrayImage, cx: number, cy: number, reference: number,
  neighbours: readonly ResponseArea[], cand: { dx: number; dy: number },
  excludeNeighbours: boolean,
): SearchDiag {
  const cfg = RING_REFINE;
  const sectors = cfg.searchSectors;
  const radialStepMm = 0.1;
  let probes = 0, skipped = 0, hits = 0, sumSq = 0;
  let targetHits = 0, recoveredHits = 0, foreignHits = 0;
  const skippedSectors: number[] = [];
  const sectorInfos: SectorInfo[] = [];
  for (let sector = 0; sector < sectors; sector++) {
    const angle = ((sector + 0.5) / sectors) * 2 * Math.PI;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    let bestDarkness = -1, bestRadius = NaN, bestX = NaN, bestY = NaN;
    let sectorProbes = 0, sectorSkipped = 0;
    for (let r = cfg.searchBandInnerMm; r <= cfg.searchBandOuterMm + 1e-9; r += radialStepMm) {
      const px = Math.round(cx + cand.dx * PPM + cos * r * PPM - 0.5);
      const py = Math.round(cy + cand.dy * PPM + sin * r * PPM - 0.5);
      if (px < 0 || py < 0 || px >= image.width || py >= image.height) continue;
      const xMm = (px + 0.5) / PPM, yMm = (py + 0.5) / PPM;
      probes++; sectorProbes++;
      if (excludeNeighbours && isCoveredByNeighbour(xMm, yMm, neighbours)) { skipped++; sectorSkipped++; continue; }
      const darkness = normalizedDarkness(image.data[py * image.width + px]!, reference);
      if (darkness > bestDarkness) { bestDarkness = darkness; bestRadius = r; bestX = xMm; bestY = yMm; }
    }
    const isHit = bestDarkness >= cfg.darknessThreshold && Math.abs(bestRadius - NOMINAL_R) <= cfg.searchRadiusToleranceMm;
    let kind: HitKind = 'none';
    let neighbourId: string | null = null;
    if (isHit) {
      hits++;
      sumSq += (bestRadius - NOMINAL_R) ** 2;
      const cls = classifySample(bestX, bestY, neighbours);
      kind = cls.kind;
      neighbourId = cls.neighbourId;
      if (kind === 'target') targetHits++;
      else if (kind === 'recovered') recoveredHits++;
      else if (kind === 'foreign') foreignHits++;
    } else {
      sumSq += cfg.searchRadiusToleranceMm ** 2;
    }
    if (sectorSkipped > 0 && sectorSkipped === sectorProbes) skippedSectors.push(sector);
    sectorInfos.push({
      sector, angleDeg: angle * 180 / Math.PI, probes: sectorProbes, skipped: sectorSkipped,
      hit: isHit, kind, rMm: bestRadius, darkness: bestDarkness, neighbourId,
    });
  }
  const completeness = hits / sectors;
  const rms = Math.sqrt(sumSq / sectors);
  const offset = Math.hypot(cand.dx, cand.dy);
  return {
    dx: cand.dx, dy: cand.dy, offset, completeness, rms,
    probes, skipped, skipPct: probes ? 100 * skipped / probes : 0,
    hits, targetHits, recoveredHits, foreignHits, skippedSectors, sectors: sectorInfos,
  };
}

function searchBoth(
  image: GrayImage, area: ResponseArea, allAreas: readonly ResponseArea[],
): { A: SearchDiag; B: SearchDiag; AatB: SearchDiag; BatA: SearchDiag; reference: number; neighbourCount: number } {
  const c = centreMm(area);
  const cx = c.x * PPM, cy = c.y * PPM;
  const neighbours = nearbyResponseAreas(area, allAreas);
  const reference = collectReference(image, area, allAreas);
  const grid = candidates();
  let A: SearchDiag | null = null;
  let B: SearchDiag | null = null;
  const better = (cur: SearchDiag | null, next: SearchDiag) => {
    if (!cur) return true;
    if (next.completeness > cur.completeness + 1e-9) return true;
    if (Math.abs(next.completeness - cur.completeness) <= 1e-9 && next.rms < cur.rms - 1e-9) return true;
    if (Math.abs(next.completeness - cur.completeness) <= 1e-9 && Math.abs(next.rms - cur.rms) <= 1e-9 && next.offset < cur.offset - 1e-9) return true;
    return false;
  };
  for (const cand of grid) {
    const a = scoreCandidate(image, cx, cy, reference, neighbours, cand, true);
    const b = scoreCandidate(image, cx, cy, reference, neighbours, cand, false);
    if (better(A, a)) A = a;
    if (better(B, b)) B = b;
  }
  const AatB = scoreCandidate(image, cx, cy, reference, neighbours, { dx: B!.dx, dy: B!.dy }, true);
  const BatA = scoreCandidate(image, cx, cy, reference, neighbours, { dx: A!.dx, dy: A!.dy }, false);
  return { A: A!, B: B!, AatB, BatA, reference, neighbourCount: neighbours.length };
}

function paintRing(data: Uint8Array, width: number, height: number, cxMm: number, cyMm: number, value = 30) {
  const cx = cxMm * PPM, cy = cyMm * PPM, r = 1.75 * PPM;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const dist = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      const outer = Math.max(0, Math.min(1, r + 0.5 - dist));
      const inner = Math.max(0, Math.min(1, r - 0.3 * PPM + 0.5 - dist));
      const cov = outer - inner;
      if (cov > 0) data[y * width + x] = Math.round(250 * (1 - cov) + value * cov);
    }
  }
}
function paintDisk(data: Uint8Array, width: number, height: number, cxMm: number, cyMm: number, radiusMm: number, value: number) {
  const cx = cxMm * PPM, cy = cyMm * PPM, r = radiusMm * PPM;
  for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++) {
    for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= r) data[y * width + x] = value;
    }
  }
}
function paintAnnulus(data: Uint8Array, width: number, height: number, cxMm: number, cyMm: number, innerMm: number, outerMm: number, value: number) {
  const cx = cxMm * PPM, cy = cyMm * PPM;
  for (let y = Math.floor(cy - outerMm * PPM - 1); y <= Math.ceil(cy + outerMm * PPM + 1); y++) {
    for (let x = Math.floor(cx - outerMm * PPM - 1); x <= Math.ceil(cx + outerMm * PPM + 1); x++) {
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / PPM;
      if (r >= innerMm && r <= outerMm) data[y * width + x] = value;
    }
  }
}
function paintHairline(data: Uint8Array, width: number, height: number, x0: number, y0: number, x1: number, y1: number, thicknessMm: number, value: number) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * PPM * 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    paintDisk(data, width, height, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, thicknessMm / 2, value);
  }
}

function blankPage(): { image: GrayImage; page: typeof formDefinition.pages[0]; all: ResponseArea[] } {
  const page = formDefinition.pages[0]!;
  const width = Math.round(210 * PPM), height = Math.round(297 * PPM);
  const data = new Uint8Array(width * height).fill(250);
  const all = page.items.flatMap(i => i.responseAreas);
  for (const area of all) paintRing(data, width, height, area.x + area.width / 2, area.y + area.height / 2);
  return { image: { width, height, data }, page, all };
}

function fmt(d: SearchDiag) {
  return `off=${d.offset.toFixed(2)}(${d.dx.toFixed(2)},${d.dy.toFixed(2)}) comp=${(d.completeness * 100).toFixed(0)}% ` +
    `hits=${d.hits} tgt=${d.targetHits} rec=${d.recoveredHits} for=${d.foreignHits} ` +
    `skip=${d.skipped}/${d.probes} (${d.skipPct.toFixed(1)}%) rms=${d.rms.toFixed(3)}`;
}

type Row = {
  label: string;
  probes: number; rejected: number;
  compA: number; compB: number;
  targetHits: number; recoveredHits: number; foreignHits: number;
  offsetA: number; offsetB: number;
  gateA: boolean; gateB: boolean;
  note: string;
};

function rowFrom(label: string, both: ReturnType<typeof searchBoth>, note = ''): Row {
  return {
    label,
    probes: both.A.probes, rejected: both.A.skipped,
    compA: both.A.completeness, compB: both.B.completeness,
    targetHits: both.B.targetHits, recoveredHits: both.B.recoveredHits, foreignHits: both.B.foreignHits,
    offsetA: both.A.offset, offsetB: both.B.offset,
    gateA: both.A.completeness >= RING_REFINE.minSearchCompleteness,
    gateB: both.B.completeness >= RING_REFINE.minSearchCompleteness,
    note,
  };
}

function printTable(title: string, rows: Row[]) {
  console.log(`\n## ${title}`);
  console.log('| fixture / gerçek örnek | probes | neighbour-rejected | completeness mevcut | completeness no-neighbour | gerçek ring hit | foreign hit | rec. hit | off A | off B | ≥70% A | ≥70% B |');
  console.log('|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|');
  for (const r of rows) {
    console.log(`| ${r.label} | ${r.probes} | ${r.rejected} (${r.probes ? (100 * r.rejected / r.probes).toFixed(1) : 0}%) | ` +
      `${(r.compA * 100).toFixed(0)}% | ${(r.compB * 100).toFixed(0)}% | ${r.targetHits} | ${r.foreignHits} | ${r.recoveredHits} | ` +
      `${r.offsetA.toFixed(2)} | ${r.offsetB.toFixed(2)} | ${r.gateA ? 'yes' : 'no'} | ${r.gateB ? 'yes' : 'no'} |`);
  }
}

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

async function normalizePhoto(name: string) {
  const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', name));
  const gray = toGrayscale(photo);
  let iso = isolatePaper(gray), dec = decodePageQr(iso.image), turns = 0;
  for (let q = 1; q < 4 && !dec; q++) {
    const trial = isolatePaper(rotateGray90(gray, q));
    const candidate = decodePageQr(trial.image);
    if (candidate) { iso = trial; dec = candidate; turns = q; }
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
  const normalized = warpPerspective(iso.image, transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm);
  return { photo, normalized, page, all: page.items.flatMap(i => i.responseAreas) };
}

console.log('RING_REFINE search: band', RING_REFINE.searchBandInnerMm, '–', RING_REFINE.searchBandOuterMm,
  'mm  sectors', RING_REFINE.searchSectors, '  minSearchCompleteness', RING_REFINE.minSearchCompleteness,
  '  maxOffsetMm', RING_REFINE.maxOffsetMm);
console.log('Neighbour ring band for FOREIGN label:', NEIGHBOUR_RING_INNER, '–', NEIGHBOUR_RING_OUTER, 'mm from neighbour centre.');
console.log('Production code was not modified. B is diagnostic only.\n');

// ---------------------------------------------------------------------------
// 1. Controlled synthetic fixtures
// ---------------------------------------------------------------------------
const page = formDefinition.pages[0]!;
const item21 = page.items.find(i => i.itemNumber === 21)!;
const targetY = item21.responseAreas.find(a => a.choiceId === 'Y')!;
const targetD = item21.responseAreas.find(a => a.choiceId === 'D')!;
const item20 = page.items.find(i => i.itemNumber === 20)!;
const belowY = page.items.find(i => i.itemNumber === 22)!.responseAreas.find(a => a.choiceId === 'Y')!;
const cY = centreMm(targetY);
const cBelow = centreMm(belowY);

const fixtureRows: Row[] = [];

{
  const { image, all } = blankPage();
  const both = searchBoth(image, targetY, all);
  console.log('clean blank Y#21  A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('clean blank ring (Y#21)', both, 'control'));
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cY.x, cY.y, 1.22, 20);
  const both = searchBoth(image, targetY, all);
  console.log('strong fill Y#21  A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('strong fill (Y#21)', both));
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cY.x, cY.y, 1.22, 205);
  const both = searchBoth(image, targetY, all);
  console.log('faint mark Y#21   A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('erased/faint mark (Y#21)', both));
}
{
  const { image, all } = blankPage();
  paintAnnulus(image.data, image.width, image.height, cY.x, cY.y, 1.02, 1.58, 20);
  const both = searchBoth(image, targetY, all);
  console.log('annular ink Y#21  A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('peripheral annular ink (Y#21)', both));
}
{
  const { image, all } = blankPage();
  paintDisk(image.data, image.width, image.height, cBelow.x, cBelow.y, 1.22, 20);
  const both = searchBoth(image, targetY, all);
  console.log('adj-row fill Y#21 A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('adjacent-row contamination (below Y filled)', both));
}
{
  const { image, all } = blankPage();
  paintHairline(image.data, image.width, image.height, cY.x, cY.y + 1.75, cBelow.x, cBelow.y - 1.75, 0.15, 25);
  const both = searchBoth(image, targetY, all);
  console.log('hairline Y#21     A', fmt(both.A), ' B', fmt(both.B));
  fixtureRows.push(rowFrom('hairline bridge to next-row bubble', both));
}

console.log('\n### Controlled vertical displacement of Y#21 ring (known truth)');
console.log('true_dy | A_comp | B_comp | A_off | B_off | B_tgt | B_rec | B_for | A≥70 | B≥70 | B locked on neighbour?');
for (const trueDy of [0, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5, 1.8]) {
  const { image, all } = blankPage();
  // erase nominal Y ring, paint it shifted toward the next row
  paintAnnulus(image.data, image.width, image.height, cY.x, cY.y, 1.40, 1.90, 250);
  paintRing(image.data, image.width, image.height, cY.x, cY.y + trueDy);
  const both = searchBoth(image, targetY, all);
  const locked = both.B.foreignHits >= 6 && both.B.offset > trueDy + 0.4;
  console.log(`  ${trueDy.toFixed(1).padStart(4)}  ${(both.A.completeness * 100).toFixed(0).padStart(3)}%   ${(both.B.completeness * 100).toFixed(0).padStart(3)}%   ` +
    `${both.A.offset.toFixed(2)}  ${both.B.offset.toFixed(2)}   ${String(both.B.targetHits).padStart(2)}    ${String(both.B.recoveredHits).padStart(2)}    ${String(both.B.foreignHits).padStart(2)}    ` +
    `${both.A.completeness >= 0.7 ? 'Y' : 'n'}    ${both.B.completeness >= 0.7 ? 'Y' : 'n'}    ${locked ? 'YES foreign' : 'no'}`);
  fixtureRows.push(rowFrom(`displaced ring dy=${trueDy.toFixed(1)} mm (truth)`, both));
}

printTable('Safety + controlled fixtures', fixtureRows);

// ---------------------------------------------------------------------------
// 2. Real C-series ambiguous items
// ---------------------------------------------------------------------------
const cRows: Row[] = [];
const stats = {
  areas: 0, notFound: 0,
  gainGt10: 0, gainGt20: 0,
  bPassesAFails: 0,
  bPassSafe: 0,   // B passes and foreignHits <= 2
  bPassForeign: 0, // B passes and foreignHits >= 4
  skipPctSum: 0,
  compASum: 0, compBSum: 0,
  recSum: 0, forSum: 0, tgtSum: 0,
};

for (const name of ['c1.jpg', 'c2.jpg', 'c3.jpg', 'c4.jpg']) {
  const packed = await normalizePhoto(name);
  if (!packed) { console.log(`${name}: failed to normalise`); continue; }
  const result = await analyzePage(packed.photo, formDefinition);
  if (!result.ok) { console.log(`${name}: ${result.code}`); continue; }
  const ambiguous = result.items.filter(item => item.status === 'ambiguous');
  console.log(`\n=== ${name}  ambiguous=${ambiguous.length}`);
  for (const item of ambiguous) {
    const def = packed.page.items.find(i => i.itemNumber === item.itemNumber)!;
    for (const area of def.responseAreas) {
      const fit = fitRingCenter(packed.normalized, area, packed.all);
      const both = searchBoth(packed.normalized, area, packed.all);
      const label = `${name} #${item.itemNumber}${area.choiceId}`;
      const note = fit.ok ? 'ok' : (fit.reason ?? '').replace(/\(.*$/, '').trim();
      cRows.push(rowFrom(label, both, note));
      stats.areas++;
      stats.skipPctSum += both.A.skipPct;
      stats.compASum += both.A.completeness;
      stats.compBSum += both.B.completeness;
      stats.recSum += both.B.recoveredHits;
      stats.forSum += both.B.foreignHits;
      stats.tgtSum += both.B.targetHits;
      const isNotFound = !fit.ok && (fit.reason ?? '').includes('halka bulunamadı');
      if (isNotFound) stats.notFound++;
      const gain = both.B.completeness - both.A.completeness;
      if (gain >= 0.10) stats.gainGt10++;
      if (gain >= 0.20) stats.gainGt20++;
      if (both.B.completeness >= 0.70 && both.A.completeness < 0.70) {
        stats.bPassesAFails++;
        if (both.B.foreignHits >= 4) stats.bPassForeign++;
        else stats.bPassSafe++;
      }
    }
  }
}

printTable('C-series ambiguous areas (all D/Y of each ambiguous item)', cRows);

console.log('\n## C-series aggregate (ambiguous items only)');
console.log(`areas ${stats.areas}  of which production NOT_FOUND ${stats.notFound}`);
console.log(`mean completeness A (exclusion ON)  ${(100 * stats.compASum / stats.areas).toFixed(1)}%`);
console.log(`mean completeness B (exclusion OFF) ${(100 * stats.compBSum / stats.areas).toFixed(1)}%`);
console.log(`mean neighbour-skip at A winner     ${(stats.skipPctSum / stats.areas).toFixed(1)}%`);
console.log(`mean B hits: target ${(stats.tgtSum / stats.areas).toFixed(1)}  recovered ${(stats.recSum / stats.areas).toFixed(1)}  foreign ${(stats.forSum / stats.areas).toFixed(1)}`);
console.log(`completeness gain ≥10 pp: ${stats.gainGt10}/${stats.areas}`);
console.log(`completeness gain ≥20 pp: ${stats.gainGt20}/${stats.areas}`);
console.log(`B crosses 70% while A does not: ${stats.bPassesAFails}   of which foreign-dominated (≥4 foreign hits): ${stats.bPassForeign}   recovered/target-dominated: ${stats.bPassSafe}`);

// Distribution of skip % and of B-A gain for NOT_FOUND vs others
const notFoundRows = cRows.filter(r => r.note.includes('halka bulunamadı'));
const otherRows = cRows.filter(r => !r.note.includes('halka bulunamadı'));
const mean = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
console.log('\nNOT_FOUND subset:');
console.log(`  n=${notFoundRows.length}  mean A ${(100 * mean(notFoundRows.map(r => r.compA))).toFixed(1)}%  mean B ${(100 * mean(notFoundRows.map(r => r.compB))).toFixed(1)}%`);
console.log(`  mean skip% ${mean(notFoundRows.map(r => r.probes ? 100 * r.rejected / r.probes : 0)).toFixed(1)}`);
console.log(`  mean B foreign hits ${mean(notFoundRows.map(r => r.foreignHits)).toFixed(1)}  recovered ${mean(notFoundRows.map(r => r.recoveredHits)).toFixed(1)}  target ${mean(notFoundRows.map(r => r.targetHits)).toFixed(1)}`);
console.log(`  B≥70 & A<70: ${notFoundRows.filter(r => r.gateB && !r.gateA).length}`);
console.log('\nother (OVER_BUDGET / ok / nominal) subset:');
console.log(`  n=${otherRows.length}  mean A ${(100 * mean(otherRows.map(r => r.compA))).toFixed(1)}%  mean B ${(100 * mean(otherRows.map(r => r.compB))).toFixed(1)}%`);
console.log(`  mean B foreign hits ${mean(otherRows.map(r => r.foreignHits)).toFixed(1)}  recovered ${mean(otherRows.map(r => r.recoveredHits)).toFixed(1)}`);

// Show a few representative NOT_FOUND items with sector skip map
console.log('\n## Representative NOT_FOUND sector maps (A winner)');
let shown = 0;
for (const name of ['c4.jpg']) {
  const packed = await normalizePhoto(name);
  if (!packed) continue;
  const result = await analyzePage(packed.photo, formDefinition);
  if (!result.ok) continue;
  for (const item of result.items.filter(i => i.status === 'ambiguous')) {
    if (shown >= 6) break;
    const def = packed.page.items.find(i => i.itemNumber === item.itemNumber)!;
    for (const area of def.responseAreas) {
      const fit = fitRingCenter(packed.normalized, area, packed.all);
      if (fit.ok || !(fit.reason ?? '').includes('halka bulunamadı')) continue;
      const both = searchBoth(packed.normalized, area, packed.all);
      const skipMap = both.A.sectors.map(s => s.skipped === s.probes ? 'X' : s.skipped ? 'x' : s.hit ? '#' : '.').join('');
      const kindMapB = both.B.sectors.map(s => s.kind === 'foreign' ? 'F' : s.kind === 'recovered' ? 'R' : s.kind === 'target' ? 'T' : '.').join('');
      console.log(`${name} #${item.itemNumber}${area.choiceId}  A ${fmt(both.A)}`);
      console.log(`  B ${fmt(both.B)}`);
      console.log(`  A-sectors skip/hit (X=all skipped, x=some, #=hit, .=miss): ${skipMap}`);
      console.log(`  B-sectors kind (T=target R=recovered F=foreign .=miss):     ${kindMapB}`);
      shown++;
      if (shown >= 6) break;
    }
  }
}

console.log('\nDONE. Production files untouched.');