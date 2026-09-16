/**
 * 6a ALIGNMENT_MISSING — measurement report. READ-ONLY: no production module is modified.
 *
 * The user's mandatory list for 6a (handoff §10):
 *   a. mathematical verification of the landscape→upright rotation,
 *   b. multi-threshold connected-component census in the upright bottom-left region:
 *      centroid, bbox, size, cross-threshold stability, squareFill (best orientation),
 *      margin ink, distance to the similarity and salvage predictions,
 *      and the exact filter each candidate was rejected by,
 *   c. only then: a decision.
 *
 * The filter logic below is a faithful copy of `alignmentDetector.ts` (same constants, same
 * order, same arithmetic). It is validated against production by comparing its per-stage
 * rejection counts with the counts embedded in the live ALIGNMENT_MISSING message
 * ("36 aday boyut veya dolgunluk ölçütünü geçmedi; 130 aday gölgeye veya çizgiye bağlıydı"
 *  / "20 … ; 114 …"). If those match, the instrument sees exactly what production sees.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { createPageQr, parsePageIdentity } from '../src/form/pageIdentity';
import { formDefinition } from '../src/omr/formDefinition';
import { toGrayscale } from '../src/omr/imageQuality';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import type { AlignmentFailure } from '../src/omr/alignmentDetector';
import { quarterTurnsToUpright, rotateGray90 } from '../src/omr/orientation';
import { isolatePaper } from '../src/omr/pageIsolation';
import { fitHomography, fitHomographyLeastSquares, fitSimilarity, mapPoint } from '../src/omr/perspectiveCorrection';
import type { Homography } from '../src/omr/perspectiveCorrection';
import { decodePageQr } from '../src/omr/qrDecoder';
import type { AlignmentMark, GrayImage, PixelImage, Point } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';

// ---------------------------------------------------------------- constants (mirrored)
const MAX_COMPONENT_FACTOR = 6;
const MARGIN_PX = 4;
const MARGIN_INK_LIMIT = 0.15;
const TOUCHING_PREDICTION_RATIO = 0.25;
const TOUCHING_SQUARE_FILL = 0.95;

const OUT = '/tmp/6a-report';
mkdirSync(OUT, { recursive: true });

const PHOTO = join('Örnek Telefon Görüntüleri', '6a.jpg');

/** Same feed as the browser scanner / run-photos.mts. */
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
  const data = context.getImageData(0, 0, width, height).data;
  return { width, height, data: new Uint8ClampedArray(data) };
}

const saveGray = (image: GrayImage, name: string) => {
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  const out = context.createImageData(image.width, image.height);
  for (let i = 0; i < image.data.length; i++) {
    const v = image.data[i]!;
    out.data[i * 4] = v; out.data[i * 4 + 1] = v; out.data[i * 4 + 2] = v; out.data[i * 4 + 3] = 255;
  }
  context.putImageData(out, 0, 0);
  const file = join(OUT, name);
  writeFileSync(file, canvas.toBuffer('image/png'));
  return file;
};

/** Raw 8-bit binary grayscale (P5). No colour profile, no alpha, no resampling — a lossless
 * container for comparing an exact pixel permutation. */
const savePgm = (image: GrayImage, name: string) => {
  const header = Buffer.from(`P5\n${image.width} ${image.height}\n255\n`, 'ascii');
  const file = join(OUT, name);
  writeFileSync(file, Buffer.concat([header, Buffer.from(image.data)]));
  return file;
};

const pgmFromFile = (file: string): GrayImage => {
  const buffer = readFileSync(file);
  let pos = 0;
  const isSpace = (byte: number) => byte === 32 || byte === 9 || byte === 10 || byte === 13;
  const token = () => {
    while (pos < buffer.length && isSpace(buffer[pos]!)) pos++;
    if (buffer[pos] === 35) { while (pos < buffer.length && buffer[pos] !== 10) pos++; return token(); }
    const start = pos;
    while (pos < buffer.length && !isSpace(buffer[pos]!)) pos++;
    return buffer.subarray(start, pos).toString('ascii');
  };
  const magic = token();
  if (magic !== 'P5') throw new Error(`not a P5 PGM: ${magic}`);
  const width = Number(token()), height = Number(token()), maxValue = Number(token());
  if (maxValue !== 255) throw new Error(`only 8-bit PGM supported, got maxval ${maxValue}`);
  pos++;
  return { width, height, data: new Uint8Array(buffer.subarray(pos, pos + width * height)) };
};

const grayFromFile = async (file: string): Promise<GrayImage> => {
  const image = await loadImage(readFileSync(file));
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, image.width, image.height).data;
  const gray = new Uint8Array(image.width * image.height);
  for (let i = 0; i < gray.length; i++) gray[i] = data[i * 4]!;
  return { width: image.width, height: image.height, data: gray };
};

const heading = (title: string) => console.log(`\n${'='.repeat(78)}\n${title}\n${'='.repeat(78)}`);

/** Filter-free component search: largest 8-connected component whose bbox could be a printed
 * square. Used only to establish ground truth for the report — never to influence detection. */
function findSquareCentre(image: GrayImage, bounds: { left: number; right: number; top: number; bottom: number },
  threshold: number): { cx: number; cy: number; w: number; h: number; count: number } | null {
  const w = Math.min(bounds.right, image.width - 1) - bounds.left + 1;
  const h = Math.min(bounds.bottom, image.height - 1) - bounds.top + 1;
  const visited = new Uint8Array(w * h);
  let best: { cx: number; cy: number; w: number; h: number; count: number } | null = null;
  for (let start = 0; start < visited.length; start++) {
    if (visited[start]) continue;
    visited[start] = 1;
    if (image.data[(bounds.top + Math.floor(start / w)) * image.width + bounds.left + (start % w)]! > threshold) continue;
    const queue = [start];
    let read = 0, count = 1, sumX = 0, sumY = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    while (read < queue.length) {
      const at = queue[read++]!, x = at % w, y = Math.floor(at / w);
      sumX += x; sumY += y;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * w + nx;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h || visited[next]) continue;
        visited[next] = 1;
        if (image.data[(bounds.top + ny) * image.width + bounds.left + nx]! <= threshold) { queue.push(next); count++; }
      }
    }
    const boxW = maxX - minX + 1, boxH = maxY - minY + 1;
    if (Math.min(boxW, boxH) < 12) continue;
    const globalCx = bounds.left + Math.round(sumX / count), globalCy = bounds.top + Math.round(sumY / count);
    if (!best || count > best.count) best = { cx: globalCx, cy: globalCy, w: boxW, h: boxH, count };
  }
  return best;
}

// ============================================================================================
// PART A — rotation mathematics
// ============================================================================================
async function partA() {
  heading('PART A — landscape→upright rotation: mathematical verification');

  // A1. Pure mapping law of rotateGray90(turns=1).
  // Source (stored) is W×H. orientation.ts writes  out[x*H + (H-1-y)] = value for source (x,y),
  // and the destination is H wide × W high, so dest index = yu*H + xu.
  //   ⇒ xu = H-1-ys ,  yu = xs        (H = stored height)
  const W = 7, H = 4;
  const src: GrayImage = { width: W, height: H, data: new Uint8Array(W * H) };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) src.data[y * W + x] = (y * W + x + 1) & 0xff;
  const rot = rotateGray90(src, 1);
  let lawOk = rot.width === H && rot.height === W;
  const lawErrors: string[] = [];
  for (let ys = 0; ys < H; ys++) for (let xs = 0; xs < W; xs++) {
    const xu = H - 1 - ys, yu = xs;
    const got = rot.data[yu * rot.width + xu]!;
    const want = src.data[ys * W + xs]!;
    if (got !== want) { lawOk = false; lawErrors.push(`stored(${xs},${ys})→upright(${xu},${yu}) got ${got} want ${want}`); }
  }
  console.log(`A1  rotateGray90(turns=1) mapping law  xu = H-1-ys , yu = xs`);
  console.log(`    dimensions ${W}×${H} → ${rot.width}×${rot.height}`);
  console.log(`    every source pixel accounted for: ${lawOk ? 'YES' : 'NO'}${lawOk ? '' : ' → ' + lawErrors.slice(0, 5).join('; ')}`);

  // A2. Inverse consistency of unrotatePoint against the forward law.
  const { unrotatePoint } = await import('../src/omr/orientation');
  let inverseOk = true;
  for (let ys = 0; ys < H; ys++) for (let xs = 0; xs < W; xs++) {
    const xu = H - 1 - ys, yu = xs;
    const back = unrotatePoint({ x: xu, y: yu }, 1, W, H);
    if (back.x !== xs || back.y !== ys) { inverseOk = false; }
  }
  console.log(`A2  unrotatePoint inverts the forward law on all ${W * H} pixels: ${inverseOk ? 'YES' : 'NO'}`);

  // A3. Direction of ImageMagick -rotate 90 vs rotateGray90, on an asymmetric probe patch.
  // Pure black pixel in the top-left of a 4×2 patch; whichever corner it lands in names the direction.
  const pw = 4, ph = 2;
  const probe: GrayImage = { width: pw, height: ph, data: new Uint8Array(pw * ph).fill(255) };
  probe.data[0] = 0;                        // stored top-left
  probe.data[pw - 1] = 0;                   // stored top-right
  const probeFile = saveGray(probe, 'probe-stored.png');
  execFileSync('convert', [probeFile, '-rotate', '90', join(OUT, 'probe-im.png')]);
  execFileSync('convert', [probeFile, '-transpose', join(OUT, 'probe-transpose.png')]);
  const im = await grayFromFile(join(OUT, 'probe-im.png'));
  const tr = await grayFromFile(join(OUT, 'probe-transpose.png'));
  const ours = rotateGray90(probe, 1);
  const darkSpots = (g: GrayImage) => {
    const spots: Point[] = [];
    for (let y = 0; y < g.height; y++) for (let x = 0; x < g.width; x++) if (g.data[y * g.width + x]! < 128) spots.push({ x, y });
    return spots.sort((a, b) => a.y - b.y || a.x - b.x).map(p => `(${p.x},${p.y})`).join(' ');
  };
  console.log(`A3  direction probe, black at stored (0,0) and (${pw - 1},0); dest ${im.width}×${im.height}`);
  console.log(`      rotateGray90(t=1) → ${darkSpots(ours)}`);
  console.log(`      IM -rotate 90     → ${darkSpots(im)}`);
  console.log(`      IM -transpose     → ${darkSpots(tr)}`);

  // A4. Whole-image equality on the real photo, after the same grayscale path the pipeline uses.
  // Compared through PGM (raw 8-bit, no colour profile, no alpha) so that any difference is a real
  // difference in the rotation and not an ImageMagick colour-management round-trip.
  const photo = await loadPhoto(PHOTO);
  const gray = toGrayscale(photo);
  console.log(`\nA4  real photo 6a.jpg`);
  console.log(`    browser feed (long side ${SCAN_LIMITS.longSide})   : ${photo.width}×${photo.height} ${photo.data.constructor.name}`);
  console.log(`    grayscale                                   : ${gray.width}×${gray.height}`);
  const storedPgm = savePgm(gray, 'stored.pgm');
  const oursFull = rotateGray90(gray, 1);
  execFileSync('convert', [storedPgm, '-rotate', '90', join(OUT, 'im-rot90.pgm')]);
  const imFull = pgmFromFile(join(OUT, 'im-rot90.pgm'));
  console.log(`    rotateGray90(t=1)                           : ${oursFull.width}×${oursFull.height}`);
  console.log(`    IM -rotate 90 (PGM, lossless)               : ${imFull.width}×${imFull.height}`);
  let diff = 0, maxDiff = 0, firstDiffs: string[] = [];
  if (imFull.width === oursFull.width && imFull.height === oursFull.height) {
    for (let i = 0; i < oursFull.data.length; i++) {
      const d = Math.abs(oursFull.data[i]! - imFull.data[i]!);
      if (d) { diff++; if (d > maxDiff) maxDiff = d; if (firstDiffs.length < 5) firstDiffs.push(`idx ${i}: ours ${oursFull.data[i]} im ${imFull.data[i]}`); }
    }
  } else diff = -1;
  console.log(`    differing pixels: ${diff < 0 ? 'DIMENSION MISMATCH' : `${diff} (max |Δ| = ${maxDiff})`}`);
  if (firstDiffs.length) console.log(`      e.g. ${firstDiffs.join(' | ')}`);
  const identical = diff === 0;
  console.log(`    ⇒ rotateGray90(turns=1) == ImageMagick -rotate 90 : ${identical ? 'BIT-EXACT' : 'NOT identical'}`);

  // A5. Cross-check every turn against ImageMagick, so both direction and multi-turn law are pinned.
  const turnNames = ['90', '180', '270'];
  for (let t = 1; t <= 3; t++) {
    execFileSync('convert', [storedPgm, '-rotate', String(90 * t), join(OUT, `im-rot${90 * t}.pgm`)]);
    const ref = pgmFromFile(join(OUT, `im-rot${90 * t}.pgm`));
    const mine = rotateGray90(gray, t);
    let d = 0;
    if (ref.width === mine.width && ref.height === mine.height) {
      for (let i = 0; i < mine.data.length; i++) if (mine.data[i] !== ref.data[i]) d++;
    } else d = -1;
    console.log(`A5  turns=${t} (${turnNames[t - 1]}°): ${mine.width}×${mine.height} vs IM ${ref.width}×${ref.height} → ${d === 0 ? 'BIT-EXACT' : d < 0 ? 'DIMENSION MISMATCH' : `${d} differing px`}`);
  }

  // A6. quarterTurnsToUpright must pick the k that brings the symbol's top edge to +x.
  // Clockwise turn k adds +90° to every content vector angle in y-down coordinates, so the
  // requirement is angle + k·90° ≡ 0 (mod 360). A top edge pointing +y therefore needs k = 3
  // (three clockwise = one counter-clockwise), and one pointing −y needs k = 1.
  const edgeCases: { name: string; corners: Point[]; expect: number }[] = [
    { name: 'top edge → +x  (already upright)', corners: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }], expect: 0 },
    { name: 'top edge → +y  (rotate 3 CW)', corners: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 1 }, { x: -1, y: 0 }], expect: 3 },
    { name: 'top edge → −x  (rotate 2 CW)', corners: [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }], expect: 2 },
    { name: 'top edge → −y  (rotate 1 CW)', corners: [{ x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 1, y: 0 }], expect: 1 },
  ];
  console.log('\nA6  quarterTurnsToUpright on the four cardinal poses:');
  let a6ok = true;
  for (const c of edgeCases) {
    const k = quarterTurnsToUpright(c.corners);
    const ok = k === c.expect;
    if (!ok) a6ok = false;
    console.log(`      ${c.name.padEnd(34)} → k=${k} expected ${c.expect} ${ok ? 'OK' : 'MISMATCH'}`);
  }
  console.log(`      ⇒ all four cardinal poses: ${a6ok ? 'CORRECT' : 'FAILED'}`);
  return { identical: identical && lawOk && inverseOk && a6ok };
}

// ============================================================================================
// PART B — instrumented candidate census
// ============================================================================================
type Head = {
  count: number; cx: number; cy: number;
  left: number; top: number; right: number; bottom: number;
  minX: number; minY: number; maxX: number; maxY: number;
};

type Candidate = {
  /** component identity inside this threshold pass */
  index: number;
  count: number; cx: number; cy: number;
  bbox: { w: number; h: number };
  stage: string;
  reject?: string;
  blobRejected?: boolean;
  head?: Head;
  headCount?: number; windowFill?: number; clipped?: boolean;
  predictionError?: number; squareFill?: number; solid?: number; marginInk?: number;
  /** Global (upright-frame) bounds of the component and of the square window chosen for it. */
  bboxGlobal?: { left: number; top: number; right: number; bottom: number };
  headGlobal?: { left: number; top: number; right: number; bottom: number };
  /** Margin-frame ink split into the mark's own pixels and genuine foreign ink. */
  marginBreakdown?: { own: number; foreign: number; total: number; foreignSamples: string[] };
  accepted?: boolean;
};

type Rejections = {
  size: number; shape: number; square: number; solid: number; distance: number;
  /** Production merges these two into its single `unstable` counter; split here for diagnosis. */
  unstable: number; window: number; margin: number; blob: number;
};

type PassResult = {
  threshold: number;
  candidates: Candidate[];
  rejected: Rejections;
  /** The component that actually contains the ground-truth square, if it appears in this window. */
  watch?: Candidate;
  best?: Candidate;
  failReason?: string;
};

/** How far a candidate travelled: bigger = deeper through the filter chain. */
const STAGE_ORDER = ['reject-blob', 'reject-window', 'reject-size', 'reject-shape',
  'reject-distance', 'reject-square', 'reject-solid', 'reject-margin', 'ACCEPTED'];

/** Exact mirror of squareWindow() in alignmentDetector.ts. */
function squareWindow(component: number[], width: number, cx: number, cy: number, area: number): Head | null {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const at of component) {
    const x = at % width, y = Math.floor(at / width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  }
  const span = Math.sqrt(area);
  const box = Math.min(maxX - minX + 1, maxY - minY + 1);
  if (box < span * 0.5) return null;
  const side = Math.max(span * 0.8, Math.min(box, span * 2.2));
  let best: Head | null = null;
  for (let offsetY = -1; offsetY <= 1; offsetY++) for (let offsetX = -1; offsetX <= 1; offsetX++) {
    const centerX = cx + offsetX * side * 0.3, centerY = cy + offsetY * side * 0.3;
    const left = Math.round(centerX - side / 2), top = Math.round(centerY - side / 2);
    const right = left + Math.round(side) - 1, bottom = top + Math.round(side) - 1;
    let inside = 0, sumX = 0, sumY = 0;
    let hMinX = Infinity, hMaxX = -Infinity, hMinY = Infinity, hMaxY = -Infinity;
    for (const at of component) {
      const x = at % width, y = Math.floor(at / width);
      if (x < left || x > right || y < top || y > bottom) continue;
      inside++;
      sumX += x; sumY += y;
      hMinX = Math.min(hMinX, x); hMaxX = Math.max(hMaxX, x);
      hMinY = Math.min(hMinY, y); hMaxY = Math.max(hMaxY, y);
    }
    if (!inside || (best && inside <= best.count)) continue;
    best = { count: inside, cx: sumX / inside, cy: sumY / inside, left, top, right, bottom,
      minX: hMinX, minY: hMinY, maxX: hMaxX, maxY: hMaxY };
  }
  return best;
}

/** Exact mirror of marginInkFraction() in alignmentDetector.ts. */
function marginInkFraction(image: GrayImage, left: number, top: number, width: number, height: number, head: Head, threshold: number): number {
  let ink = 0, total = 0;
  const margin = MARGIN_PX, limit = threshold * 1.25;
  const left0 = Math.max(head.minX - margin, 0), right0 = Math.min(head.maxX + margin, width - 1);
  const top0 = Math.max(head.minY - margin, 0), bottom0 = Math.min(head.maxY + margin, height - 1);
  const sample = (x: number, y: number) => {
    total++;
    if (image.data[(top + y) * image.width + left + x]! <= limit) ink++;
  };
  for (let x = left0; x <= right0; x += 2) { sample(x, top0); sample(x, bottom0); }
  for (let y = top0; y <= bottom0; y += 2) { sample(left0, y); sample(right0, y); }
  return total ? ink / total : 1;
}

/** Exact mirror of searchAtThreshold(), but keeping every candidate's measurements. */
function searchAtThreshold(image: GrayImage, mark: AlignmentMark, prediction: Homography, mmCenter: Point,
  predicted: Point, area: number, radius: number, left: number, top: number, width: number, height: number,
  threshold: number, watchGlobal?: Point): PassResult {
  const visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
  const candidates: Candidate[] = [];
  const watchLocal = watchGlobal && watchGlobal.x >= left && watchGlobal.x <= left + width - 1 &&
    watchGlobal.y >= top && watchGlobal.y <= top + height - 1
    ? { x: watchGlobal.x - left, y: watchGlobal.y - top } : undefined;
  let watch: Candidate | undefined;
  const rejected: Rejections = { size: 0, shape: 0, square: 0, solid: 0, distance: 0, unstable: 0, window: 0, margin: 0, blob: 0 };
  for (let start = 0; start < visited.length; start++) {
    if (visited[start]) continue;
    visited[start] = 1;
    const startX = start % width, startY = Math.floor(start / width);
    if (image.data[(top + startY) * image.width + left + startX]! > threshold) continue;
    let read = 0, count = 1, sumX = 0, sumY = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = start;
    while (read < count) {
      const at = queue[read++]!, x = at % width, y = Math.floor(at / width);
      sumX += x; sumY += y;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited[next]) continue;
        visited[next] = 1;
        if (image.data[(top + ny) * image.width + left + nx]! <= threshold) queue[count++] = next;
      }
    }
    const cx = sumX / count, cy = sumY / count;
    const candidate: Candidate = {
      index: candidates.length, count, cx, cy,
      bbox: { w: maxX - minX + 1, h: maxY - minY + 1 }, stage: 'component',
    };
    candidates.push(candidate);
    if (watchLocal && !watch) {
      for (let index = 0; index < count; index++) {
        if (queue[index] === watchLocal.y * width + watchLocal.x) { watch = candidate; break; }
      }
    }
    if (count > area * MAX_COMPONENT_FACTOR) { rejected.blob++; candidate.blobRejected = true; candidate.reject = `blob: ${count} px > ${(area * MAX_COMPONENT_FACTOR).toFixed(0)} px (${MAX_COMPONENT_FACTOR}× a printed square)`; candidate.stage = 'reject-blob'; continue; }
    const pixels = Array.from(queue.subarray(0, count));
    const head = squareWindow(pixels, width, cx, cy, area);
    if (!head) { rejected.unstable++; rejected.window++; candidate.reject = 'unstable: squareWindow() found no window holding ≥50% of a square'; candidate.stage = 'reject-window'; continue; }
    const headWidth = head.right - head.left + 1, headHeight = head.bottom - head.top + 1;
    const windowFill = head.count / (headWidth * headHeight);
    const clipped = head.left <= 0 || head.top <= 0 || head.right >= width - 1 || head.bottom >= height - 1;
    candidate.head = head; candidate.headCount = head.count; candidate.windowFill = windowFill; candidate.clipped = clipped;
    candidate.bboxGlobal = { left: left + minX, top: top + minY, right: left + maxX, bottom: top + maxY };
    candidate.headGlobal = { left: left + head.left, top: top + head.top, right: left + head.right, bottom: top + head.bottom };
    if (head.count < area * 0.5 || head.count > area * 1.8 || windowFill < 0.43 || clipped) {
      rejected.size++;
      const why: string[] = [];
      if (head.count < area * 0.5) why.push(`head ink ${head.count} < ${(area * 0.5).toFixed(0)} (0.5× area)`);
      if (head.count > area * 1.8) why.push(`head ink ${head.count} > ${(area * 1.8).toFixed(0)} (1.8× area)`);
      if (windowFill < 0.43) why.push(`windowFill ${windowFill.toFixed(3)} < 0.43`);
      if (clipped) why.push('head touches the search-window border (clipped)');
      candidate.reject = `size: ${why.join('; ')}`; candidate.stage = 'reject-size'; continue;
    }
    if (head.maxX - head.minX + 1 < headWidth * 0.85 || head.maxY - head.minY + 1 < headHeight * 0.85) {
      rejected.shape++;
      candidate.reject = `shape: ink spans ${head.maxX - head.minX + 1}×${head.maxY - head.minY + 1} of a ${headWidth}×${headHeight} window (<0.85)`;
      candidate.stage = 'reject-shape'; continue;
    }
    const headCenter = { x: left + head.cx, y: top + head.cy };
    const predictionError = Math.hypot(headCenter.x - predicted.x, headCenter.y - predicted.y);
    candidate.predictionError = predictionError;
    if (predictionError > radius * 0.9) {
      rejected.distance++;
      candidate.reject = `distance: ${predictionError.toFixed(1)} px > ${(radius * 0.9).toFixed(1)} px (0.9× radius)`;
      candidate.stage = 'reject-distance'; continue;
    }
    let squareFill = 0;
    for (let degrees = 0; degrees < 90; degrees += 2) {
      const angle = degrees * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let index = 0; index < count; index++) {
        const at = queue[index]!, x = at % width, y = Math.floor(at / width);
        if (x < head.left || x > head.right || y < head.top || y > head.bottom) continue;
        const dx = x - head.cx, dy = y - head.cy;
        const u = dx * cosine + dy * sine, v = dy * cosine - dx * sine;
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      const pixel = Math.abs(cosine) + Math.abs(sine);
      squareFill = Math.max(squareFill, head.count / ((maxU - minU + pixel) * (maxV - minV + pixel)));
    }
    candidate.squareFill = squareFill;
    if (squareFill < 0.84) {
      rejected.square++;
      candidate.reject = `square: squareFill ${squareFill.toFixed(3)} < 0.84 (disc would be 0.785)`;
      candidate.stage = 'reject-square'; continue;
    }
    let solid = 0, checked = 0;
    for (let sy = -2; sy <= 2; sy++) for (let sx = -2; sx <= 2; sx++) {
      const probe = mapPoint(prediction, { x: mmCenter.x + sx * mark.width * 0.1, y: mmCenter.y + sy * mark.height * 0.1 });
      const x = Math.round(headCenter.x + probe.x - predicted.x), y = Math.round(headCenter.y + probe.y - predicted.y);
      if (x >= 0 && y >= 0 && x < image.width && y < image.height && image.data[y * image.width + x]! <= threshold) solid++;
      checked++;
    }
    candidate.solid = solid / checked;
    if (solid / checked < 0.92) {
      rejected.solid++;
      candidate.reject = `solid: ${solid}/${checked} = ${(solid / checked).toFixed(3)} < 0.92`;
      candidate.stage = 'reject-solid'; continue;
    }
    const marginInk = marginInkFraction(image, left, top, width, height, head, threshold);
    candidate.marginInk = marginInk;
    if (marginInk > MARGIN_INK_LIMIT) {
      // Same frame as marginInkFraction() samples, but each dark sample is attributed either to the
      // candidate's own connected component or to something else in the picture.
      const own = new Set<number>();
      for (let index = 0; index < count; index++) own.add(queue[index]!);
      const margin = MARGIN_PX, limit = threshold * 1.25;
      const left0 = Math.max(head.minX - margin, 0), right0 = Math.min(head.maxX + margin, width - 1);
      const top0 = Math.max(head.minY - margin, 0), bottom0 = Math.min(head.maxY + margin, height - 1);
      let ownInk = 0, foreignInk = 0, totalSamples = 0;
      const foreignSamples: string[] = [];
      const sample = (x: number, y: number) => {
        totalSamples++;
        if (image.data[(top + y) * image.width + left + x]! > limit) return;
        if (own.has(y * width + x)) ownInk++;
        else { foreignInk++; if (foreignSamples.length < 6) foreignSamples.push(`(${left + x},${top + y})v${image.data[(top + y) * image.width + left + x]}`); }
      };
      for (let x = left0; x <= right0; x += 2) { sample(x, top0); sample(x, bottom0); }
      for (let y = top0; y <= bottom0; y += 2) { sample(left0, y); sample(right0, y); }
      candidate.marginBreakdown = { own: ownInk, foreign: foreignInk, total: totalSamples, foreignSamples };
    }
    if (marginInk > MARGIN_INK_LIMIT) {
      const isPrintedSquare = predictionError <= radius * TOUCHING_PREDICTION_RATIO &&
        squareFill >= TOUCHING_SQUARE_FILL && head.count >= area * 0.8 && head.count <= area * 1.3;
      if (!isPrintedSquare) {
        rejected.unstable++; rejected.margin++;
        candidate.reject = `unstable: margin ink ${(marginInk * 100).toFixed(0)}% > 15% and not the unmistakable printed square`;
        candidate.stage = 'reject-margin'; continue;
      }
    }
    candidate.accepted = true; candidate.stage = 'ACCEPTED';
  }
  // production returns the cheapest cost; mirror it so "best" matches
  const cost = (c: Candidate) => (c.predictionError ?? Infinity) / radius + Math.abs(Math.log(c.count / area)) * 0.3;
  const acceptedList = candidates.filter(c => c.accepted);
  acceptedList.sort((a, b) => cost(a) - cost(b));
  const best = acceptedList[0];
  if (best && acceptedList[1] && cost(acceptedList[1]) - cost(best) < 0.12) {
    return { threshold, candidates, rejected, watch, failReason: 'two near-equal dark areas; the printed square could not be told apart' };
  }
  return { threshold, candidates, rejected, watch, best };
}

type PredictionReport = {
  label: string;
  prediction: Homography;
  predicted: Point;
  area: number; scale: number; radius: number; distanceMm: number;
  window?: { left: number; top: number; width: number; height: number };
  outside?: string;
  background?: number; otsu?: number; thresholds?: number[];
  passes: PassResult[];
  /** Journey of the ground-truth square through the filter chain, per threshold. */
  watch?: Candidate;
  outcome: string;
};

/** Exact mirror of locateMark()'s windowing + threshold selection, with the census kept. */
function locateMarkInstrumented(image: GrayImage, mark: AlignmentMark, prediction: Homography, qrCenter: Point,
  label: string, watchGlobal?: Point): PredictionReport {
  const mmCenter = { x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 };
  const predicted = mapPoint(prediction, mmCenter);
  const corners = [
    { x: mark.x, y: mark.y }, { x: mark.x + mark.width, y: mark.y },
    { x: mark.x + mark.width, y: mark.y + mark.height }, { x: mark.x, y: mark.y + mark.height },
  ].map(p => mapPoint(prediction, p));
  const area = Math.abs(corners.reduce((sum, p, i) => {
    const next = corners[(i + 1) % 4]!;
    return sum + p.x * next.y - p.y * next.x;
  }, 0)) / 2;
  const scale = Math.sqrt(area / (mark.width * mark.height));
  const report: PredictionReport = { label, prediction, predicted, area, scale, radius: 0, distanceMm: 0, passes: [], outcome: '' };
  if (!Number.isFinite(scale) || scale < 1.5 || scale > 30) {
    report.outcome = `REJECTED before search: scale ${scale.toFixed(1)} outside [1.5, 30]`;
    return report;
  }
  const distanceMm = Math.hypot(mmCenter.x - qrCenter.x, mmCenter.y - qrCenter.y);
  const radius = Math.min(500, Math.ceil(scale * (8 + distanceMm * 0.22)));
  report.distanceMm = distanceMm; report.radius = radius;
  const left = Math.max(0, Math.floor(predicted.x - radius)), top = Math.max(0, Math.floor(predicted.y - radius));
  const right = Math.min(image.width - 1, Math.ceil(predicted.x + radius)), bottom = Math.min(image.height - 1, Math.ceil(predicted.y + radius));
  const width = right - left + 1, height = bottom - top + 1;
  if (width < 5 || height < 5) {
    report.outside = `search window is ${width}×${height} px — the prediction lands outside the image`;
    report.outcome = `REJECTED: ${report.outside}`;
    return report;
  }
  report.window = { left, top, width, height };
  const histogram = new Uint32Array(256);
  let samples = 0;
  for (let y = top; y <= bottom; y += 4) for (let x = left; x <= right; x += 4) {
    histogram[image.data[y * image.width + x]!] = histogram[image.data[y * image.width + x]!]! + 1;
    samples++;
  }
  let background = 255, cumulative = 0;
  for (let value = 0; value < 256; value++) {
    cumulative += histogram[value]!;
    if (cumulative >= samples * 0.85) { background = value; break; }
  }
  let otsu = 128, histSum = 0;
  for (let i = 0; i < 256; i++) histSum += i * histogram[i]!;
  let sumB = 0, wB = 0, maxVar = 0;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t]!;
    if (!wB) continue;
    const wF = samples - wB;
    if (!wF) break;
    sumB += t * histogram[t]!;
    const mB = sumB / wB, mF = (histSum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > maxVar) { maxVar = between; otsu = t; }
  }
  const thresholds = [...new Set([
    Math.max(20, Math.round(background * 0.55)),
    Math.max(20, Math.round(background * 0.70)),
    Math.max(20, otsu),
  ])];
  report.background = background; report.otsu = otsu; report.thresholds = thresholds;
  for (const threshold of thresholds) {
    const pass = searchAtThreshold(image, mark, prediction, mmCenter, predicted, area, radius, left, top, width, height, threshold, watchGlobal);
    report.passes.push(pass);
    if (pass.watch && !report.watch) report.watch = pass.watch;
    if (pass.best) { report.outcome = `ACCEPTED at threshold ${threshold}`; return report; }
  }
  const last = report.passes.at(-1)!;
  report.outcome = `REJECTED at every threshold; last threshold ${last.threshold} → ${last.failReason ?? 'no accepted candidate'}`;
  return report;
}

async function partB() {
  heading('PART B — upright 6a: bottom-left candidate census');

  const photo = await loadPhoto(PHOTO);
  const gray = toGrayscale(photo);
  console.log(`stored (browser feed)          : ${gray.width}×${gray.height}`);

  // --- replicate the orientation normalisation exactly as analyzePage does
  let isolated = isolatePaper(gray), decoded = decodePageQr(isolated.image), turns = 0;
  for (let q = 1; q < 4 && !decoded; q++) {
    const trial = isolatePaper(rotateGray90(gray, q));
    const candidate = decodePageQr(trial.image);
    if (candidate) { isolated = trial; decoded = candidate; turns = q; }
  }
  if (!decoded) { console.log('QR never decoded — cannot continue'); return; }
  const qrTurns = quarterTurnsToUpright(decoded.corners);
  const totalTurns = (turns + qrTurns) % 4;
  console.log(`QR decoded with turns=${turns} (clockwise quarter turns on the stored image)`);
  console.log(`quarterTurnsToUpright(corners)=${qrTurns} → totalTurns=${totalTurns}`);
  if (totalTurns !== turns) {
    const upright = isolatePaper(rotateGray90(gray, totalTurns));
    const retry = decodePageQr(upright.image);
    isolated = upright; decoded = retry ?? decoded;
  }
  const source = isolated.image;
  console.log(`upright page (after isolatePaper): ${source.width}×${source.height}  (origin ${isolated.originX},${isolated.originY})`);
  console.log(`QR corners in upright frame      : ${decoded.corners.map(p => `(${p.x.toFixed(1)},${p.y.toFixed(1)})`).join(' ')}`);

  const identity = parsePageIdentity(decoded.text, formDefinition);
  const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
  const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
  const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };

  // --- predictions, exactly as analyzePage builds them
  const predictionH = fitHomography(qr.innerCorners, decoded.corners);
  const predictionS = fitSimilarity(qr.innerCorners, decoded.corners);
  console.log(`\npredictions: [0] projective fitHomography(QR corners)   [1] fitSimilarity(QR corners)`);

  // --- locate all four marks with each prediction, to rebuild the salvage anchor set
  const found = new Map<string, { x: number; y: number }>();
  const foundMetrics: { id: string; via: string; c: Candidate; area: number; threshold: number }[] = [];
  for (const mark of page.alignmentMarks) {
    for (const [name, pred] of [['homography', predictionH], ['similarity', predictionS]] as const) {
      const r = locateMarkInstrumented(source, mark, pred, qrCenter, `${mark.id}/${name}`);
      if (r.outcome.startsWith('ACCEPTED')) {
        const pass = r.passes.at(-1)!;
        const best = pass.best!;
        found.set(mark.id, { x: best.cx + r.window!.left, y: best.cy + r.window!.top });
        foundMetrics.push({ id: mark.id, via: name, c: best, area: r.area, threshold: pass.threshold });
        break;
      }
    }
  }
  console.log(`\nmarks located by the first pass: ${[...found.keys()].join(', ') || '(none)'}`);
  for (const [id, p] of found) console.log(`   ${id.padEnd(13)} ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`);

  // Reference profile: this is what a *successfully detected* printed square measures like.
  console.log(`\nREFERENCE — the three squares that WERE accepted (same filters, same image):`);
  for (const m of foundMetrics) {
    const c = m.c;
    const b = c.bboxGlobal!;
    console.log(`   ${m.id.padEnd(13)} via ${m.via.padEnd(10)} @thr ${String(m.threshold).padStart(3)}` +
      `  centre (${(m.c.cx).toFixed(0)},${(m.c.cy).toFixed(0)}) local` +
      `  bbox ${b.right - b.left + 1}×${b.bottom - b.top + 1}` +
      `  ink ${c.count}  head ${c.headCount}  winFill ${c.windowFill!.toFixed(3)}` +
      `  sqFill ${c.squareFill!.toFixed(3)}  solid ${c.solid!.toFixed(3)}  margin ${(c.marginInk! * 100).toFixed(0)}%` +
      `  area(1 square) ${m.area.toFixed(0)}px²  ink/area ${(c.count / m.area).toFixed(2)}` +
      `  head/area ${(c.headCount! / m.area).toFixed(2)}`);
  }

  // --- salvage refit, exactly as detectAlignmentMarks builds it
  const physical = [...found.keys()].map(id => {
    const def = page.alignmentMarks.find(m => m.id === id)!;
    return { x: def.x + def.width / 2, y: def.y + def.height / 2 };
  });
  const refit = fitHomographyLeastSquares(
    [...qr.innerCorners, ...physical],
    [...decoded.corners, ...[...found.values()]],
  );
  console.log(`\nsalvage refit built from ${qr.innerCorners.length} QR corners + ${physical.length} located square(s)`);

  // --- the missing mark
  const missingId = page.alignmentMarks.map(m => m.id).find(id => !found.has(id))!;
  const missing = page.alignmentMarks.find(m => m.id === missingId)!;
  const missingMm = { x: missing.x + missing.width / 2, y: missing.y + missing.height / 2 };
  console.log(`\nmissing mark: ${missingId}  physical centre (${missingMm.x}, ${missingMm.y}) mm`);

  const simPredicted = mapPoint(predictionS, missingMm);
  const refitPredicted = mapPoint(refit, missingMm);

  // Ground truth for the missing square, found WITHOUT any of the pipeline's filter logic:
  // a plain 8-connected flood fill over the bottom-left quadrant, keeping the largest component
  // whose bounding box could plausibly be a 5 mm printed square.
  const watch = findSquareCentre(source, { left: 0, right: 400, top: 2200, bottom: source.height - 1 }, 140);
  console.log(`\nGROUND TRUTH (filter-free flood fill, x≤400, y≥2200, threshold 140):`);
  if (watch) {
    console.log(`   bottom-left printed square centre = (${watch.cx}, ${watch.cy})  bbox ${watch.w}×${watch.h}  ink ${watch.count}`);
    console.log(`   distance to similarity prediction (${simPredicted.x.toFixed(0)},${simPredicted.y.toFixed(0)}) = ${Math.hypot(watch.cx - simPredicted.x, watch.cy - simPredicted.y).toFixed(0)} px`);
    console.log(`   distance to salvage refit       (${refitPredicted.x.toFixed(0)},${refitPredicted.y.toFixed(0)}) = ${Math.hypot(watch.cx - refitPredicted.x, watch.cy - refitPredicted.y).toFixed(0)} px`);
    console.log(`   distance to projective prediction (${mapPoint(predictionH, missingMm).x.toFixed(0)},${mapPoint(predictionH, missingMm).y.toFixed(0)}) = ${Math.hypot(watch.cx - mapPoint(predictionH, missingMm).x, watch.cy - mapPoint(predictionH, missingMm).y).toFixed(0)} px`);
    const z = 90, factor = 6;
    const left0 = Math.max(0, Math.round(watch.cx - z)), top0 = Math.max(0, Math.round(watch.cy - z));
    const zw = Math.min(source.width - 1, left0 + 2 * z) - left0 + 1, zh = Math.min(source.height - 1, top0 + 2 * z) - top0 + 1;
    const canvas = createCanvas(zw * factor, zh * factor);
    const context = canvas.getContext('2d');
    const out = context.createImageData(zw * factor, zh * factor);
    for (let y = 0; y < zh * factor; y++) for (let x = 0; x < zw * factor; x++) {
      const v = source.data[(top0 + Math.floor(y / factor)) * source.width + left0 + Math.floor(x / factor)]!;
      const i = (y * zw * factor + x) * 4;
      out.data[i] = v; out.data[i + 1] = v; out.data[i + 2] = v; out.data[i + 3] = 255;
    }
    context.putImageData(out, 0, 0);
    const file = join(OUT, 'square-zoom.png');
    writeFileSync(file, canvas.toBuffer('image/png'));
    console.log(`   zoomed 6× crop around it → ${file}  (region x ${left0}..${left0 + zw - 1}, y ${top0}..${top0 + zh - 1})`);
  } else {
    console.log('   no plausible square-sized component found — the assumption needs revisiting');
  }
  const watchPoint = watch ? { x: watch.cx, y: watch.cy } : undefined;

  const reports: PredictionReport[] = [
    locateMarkInstrumented(source, missing, predictionH, qrCenter, 'homography (prediction 0)', watchPoint),
    locateMarkInstrumented(source, missing, predictionS, qrCenter, 'similarity (prediction 1)', watchPoint),
    locateMarkInstrumented(source, missing, refit, qrCenter, 'salvage refit', watchPoint),
  ];

  for (const r of reports) {
    console.log(`\n--- ${r.label}`);
    console.log(`    predicted centre         : (${r.predicted.x.toFixed(1)}, ${r.predicted.y.toFixed(1)})`);
    console.log(`    implied square area      : ${r.area.toFixed(0)} px²  (side ${Math.sqrt(r.area).toFixed(1)} px, scale ${r.scale.toFixed(2)} px/mm)`);
    console.log(`    distance to QR centre    : ${r.distanceMm.toFixed(1)} mm → search radius ${r.radius} px`);
    if (r.outside) { console.log(`    ${r.outcome}`); continue; }
    const w = r.window!;
    console.log(`    search window            : x ${w.left}..${w.left + w.width - 1}, y ${w.top}..${w.top + w.height - 1}  (${w.width}×${w.height} px)`);
    console.log(`    background (85th pct)    : ${r.background}   otsu: ${r.otsu}   thresholds: ${r.thresholds!.join(', ')}`);
    for (const p of r.passes) {
      console.log(`      threshold ${String(p.threshold).padStart(3)}: components ${p.candidates.length}` +
        ` | blob ${p.rejected.blob}` +
        ` | window-unstable ${p.rejected.window}` +
        ` | size ${p.rejected.size}, shape ${p.rejected.shape}, distance ${p.rejected.distance},` +
        ` square ${p.rejected.square}, solid ${p.rejected.solid}, margin-unstable ${p.rejected.margin}` +
        `  [production's merged "unstable" = ${p.rejected.unstable}]` +
        (p.best ? ' → ACCEPTED' : ''));
    }
    console.log(`    outcome: ${r.outcome}`);
    if (r.watch) {
      const c = r.watch;
      console.log(`    ⇒ the ACTUAL printed square (component containing the ground-truth centre) in this pass:`);
      console.log(`        centroid (${(r.window!.left + c.cx).toFixed(0)},${(r.window!.top + c.cy).toFixed(0)})  bbox ${c.bbox.w}×${c.bbox.h}  ink ${c.count}`);
      console.log(`        head ink ${c.headCount ?? '—'}/${c.bbox.w * c.bbox.h}  windowFill ${c.windowFill?.toFixed(3) ?? '—'}` +
        `  clipped ${c.clipped ?? '—'}  squareFill ${c.squareFill?.toFixed(3) ?? 'not reached'}` +
        `  solid ${c.solid?.toFixed(3) ?? '—'}  margin ${c.marginInk !== undefined ? (c.marginInk * 100).toFixed(0) + '%' : '—'}`);
      console.log(`        reached stage: ${c.stage}${c.reject ? ' → ' + c.reject : ''}`);
      if (c.bboxGlobal && c.headGlobal) {
        const bg = c.bboxGlobal, hg = c.headGlobal;
        console.log(`        component bbox x ${bg.left}..${bg.right} (${bg.right - bg.left + 1} px), y ${bg.top}..${bg.bottom} (${bg.bottom - bg.top + 1} px)`);
        console.log(`        square window  x ${hg.left}..${hg.right} (${hg.right - hg.left + 1} px), y ${hg.top}..${hg.bottom} (${hg.bottom - hg.top + 1} px)` +
          `  → component rows left outside the window: ${Math.max(0, hg.top - bg.top) + Math.max(0, bg.bottom - hg.bottom)},` +
          ` columns: ${Math.max(0, hg.left - bg.left) + Math.max(0, bg.right - hg.right)}`);
      }
      if (c.marginBreakdown) {
        const m = c.marginBreakdown;
        console.log(`        margin frame: ${m.total} samples, dark ${m.own + m.foreign}` +
          ` → from THIS mark's own pixels ${m.own}, from genuine foreign ink ${m.foreign}` +
          (m.foreignSamples.length ? `  e.g. ${m.foreignSamples.join(' ')}` : ''));
        console.log(`        ⇒ margin test is triggered by the mark's own ${m.own} pixels, not by an occluding line/shadow`);
      }
      console.log(`        filter budget for this prediction: area ${r.area.toFixed(0)} px²` +
        ` → head ink must be in [${(r.area * 0.5).toFixed(0)}, ${(r.area * 1.8).toFixed(0)}], windowFill ≥ 0.43, squareFill ≥ 0.84, solid ≥ 0.92, margin ≤ 15%, dPred ≤ ${(r.radius * 0.9).toFixed(0)} px`);
    } else {
      console.log(`    ⇒ the actual printed square is NOT a component of this window at any threshold`);
    }
    // detailed census for the LAST threshold (that is the one production reports on)
    const last = r.passes.at(-1)!;
    const ranked = [...last.candidates].sort((a, b) => {
      const rank = (c: Candidate) => c.accepted ? STAGE_ORDER.length : STAGE_ORDER.indexOf(c.stage);
      return rank(b) - rank(a) || b.count - a.count;
    });
    const byStage = new Map<string, number>();
    for (const c of last.candidates) byStage.set(c.stage, (byStage.get(c.stage) ?? 0) + 1);
    console.log(`    stage histogram at threshold ${last.threshold}: ` +
      [...byStage.entries()].sort((a, b) => STAGE_ORDER.indexOf(b[0]) - STAGE_ORDER.indexOf(a[0]))
        .map(([stage, n]) => `${stage}×${n}`).join(', '));
    console.log(`    every component, deepest-filtering first:`);
    for (const c of ranked) {
      const gx = (c.head ? r.window!.left + c.head.cx : r.window!.left + c.cx).toFixed(0);
      const gy = (c.head ? r.window!.top + c.head.cy : r.window!.top + c.cy).toFixed(0);
      const bits = [
        `#${String(c.index).padStart(3)}`,
        `ctr (${String(gx).padStart(4)},${String(gy).padStart(4)})`,
        `bbox ${String(c.bbox.w).padStart(3)}×${String(c.bbox.h).padStart(3)}`,
        `ink ${String(c.count).padStart(5)}`,
      ];
      if (c.headCount !== undefined) bits.push(`head ${String(c.headCount).padStart(5)}`, `winFill ${c.windowFill!.toFixed(3)}`);
      if (c.squareFill !== undefined) bits.push(`sqFill ${c.squareFill.toFixed(3)}`);
      if (c.marginInk !== undefined) bits.push(`margin ${(c.marginInk * 100).toFixed(0)}%`);
      if (c.predictionError !== undefined) bits.push(`dPred ${c.predictionError.toFixed(0)}px`);
      bits.push(`→ ${c.reject ?? c.stage}`);
      console.log(`      ${bits.join('  ')}`);
      const dSim = Math.hypot(Number(gx) - simPredicted.x, Number(gy) - simPredicted.y);
      const dRefit = Math.hypot(Number(gx) - refitPredicted.x, Number(gy) - refitPredicted.y);
      console.log(`           distance to similarity prediction ${dSim.toFixed(0)} px | to salvage refit ${dRefit.toFixed(0)} px`);
    }
  }

  // --- PART C: independent look at the region, so the census is not the only witness
  heading('PART C — independent region inspection (no filter logic involved)');
  const maxX = Math.min(source.width - 1, Math.round(Math.max(refitPredicted.x, simPredicted.x, ...found.values().map(p => p.x)) + 260));
  const regionLeft = 0, regionRight = Math.min(source.width - 1, 640);
  const regionTop = 2150, regionBottom = Math.min(source.height - 1, 2549);
  const rw = regionRight - regionLeft + 1, rh = regionBottom - regionTop + 1;
  const crop: GrayImage = { width: rw, height: rh, data: new Uint8Array(rw * rh) };
  for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
    crop.data[y * rw + x] = source.data[(regionTop + y) * source.width + regionLeft + x]!;
  }
  const cropFile = saveGray(crop, 'region-bottom-left.png');
  console.log(`region x ${regionLeft}..${regionRight}, y ${regionTop}..${regionBottom} → ${cropFile} (${rw}×${rh})`);
  console.log(`predictions in this frame: similarity (${simPredicted.x.toFixed(0)},${simPredicted.y.toFixed(0)})`
    + `  refit (${refitPredicted.x.toFixed(0)},${refitPredicted.y.toFixed(0)})`);

  // ASCII ink map, 8×8 blocks: '#' very dark, '+' dark, '.' light, ' ' paper.
  const block = 8;
  console.log(`\nink map (${block}px blocks; column header = x/10, row label = y):`);
  let header = '      ';
  for (let x = 0; x < rw; x += block) header += (Math.floor((regionLeft + x) / 10) % 10 === 0 ? '|' : ' ');
  console.log(header);
  for (let y = 0; y < rh; y += block) {
    let line = '';
    for (let x = 0; x < rw; x += block) {
      let sum = 0, n = 0, min = 255;
      for (let by = y; by < Math.min(y + block, rh); by++) for (let bx = x; bx < Math.min(x + block, rw); bx++) {
        const v = crop.data[by * rw + bx]!;
        sum += v; n++; if (v < min) min = v;
      }
      const mean = sum / n;
      line += min < 60 ? '#' : min < 130 ? '+' : mean < 215 ? '.' : ' ';
    }
    console.log(`y${String(regionTop + y).padStart(4)} ${line}`);
  }

  // Raw connected components (8-connected), no size/shape filter at all, in this region.
  for (const threshold of [100, 140, 175]) {
    const visited = new Uint8Array(rw * rh);
    const big: { count: number; cx: number; cy: number; w: number; h: number }[] = [];
    for (let start = 0; start < visited.length; start++) {
      if (visited[start]) continue;
      visited[start] = 1;
      if (crop.data[start]! > threshold) continue;
      const queue = [start];
      let read = 0, count = 1, sumX = 0, sumY = 0;
      let minX = rw, minY = rh, maxX = 0, maxY = 0;
      while (read < queue.length) {
        const at = queue[read++]!, x = at % rw, y = Math.floor(at / rw);
        sumX += x; sumY += y;
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy, next = ny * rw + nx;
          if (nx < 0 || ny < 0 || nx >= rw || ny >= rh || visited[next]) continue;
          visited[next] = 1;
          if (crop.data[next]! <= threshold) { queue.push(next); count++; }
        }
      }
      const w = maxX - minX + 1, h = maxY - minY + 1;
      if (Math.min(w, h) >= 12) big.push({ count, cx: regionLeft + sumX / count, cy: regionTop + sumY / count, w, h });
    }
    big.sort((a, b) => b.count - a.count);
    console.log(`\nthreshold ${threshold}: ${big.length} components with min(bbox) ≥ 12 px:`);
    for (const c of big.slice(0, 14)) {
      console.log(`   centre (${c.cx.toFixed(0)},${c.cy.toFixed(0)})  bbox ${c.w}×${c.h}  ink ${c.count}` +
        `  dSim ${Math.hypot(c.cx - simPredicted.x, c.cy - simPredicted.y).toFixed(0)}px` +
        `  dRefit ${Math.hypot(c.cx - refitPredicted.x, c.cy - refitPredicted.y).toFixed(0)}px`);
    }
  }

  // --- cross-validation: production's own message must reproduce our counts
  heading('PART B validation — instrument vs production');
  const failures: AlignmentFailure[] = [];
  detectAlignmentMarks(source, page.alignmentMarks, [predictionH, predictionS], qrCenter,
    entry => failures.push(entry), { mm: qr.innerCorners, px: decoded.corners });
  const live = failures.find(f => f.markId === missingId)?.reason ?? '(none)';
  console.log(`production message for ${missingId}:\n  ${live}\n`);
  const simLast = reports[1]!.passes.at(-1)!;
  const refitLast = reports[2]!.passes.at(-1)!;
  const fmt = (p: PassResult) => `size ${p.rejected.size}; margin-unstable ${p.rejected.unstable}` +
    ` (blob ${p.rejected.blob}, window ${p.rejected.unstable}, shape ${p.rejected.shape}, distance ${p.rejected.distance}, square ${p.rejected.square}, solid ${p.rejected.solid})`;
  console.log(`instrument, similarity, last threshold : ${fmt(simLast)}`);
  console.log(`instrument, salvage refit, last threshold: ${fmt(refitLast)}`);
  console.log(`\n(production groups "window-unstable" and "margin-unstable" under one label` +
    ` "gölgeye veya çizgiye bağlıydı", so compare size counts exactly and unstable sums.)`);
}

async function main() {
  const a = await partA();
  await partB();
  heading('PART A verdict');
  console.log(`rotateGray90 is the exact inverse-free implementation of a clockwise quarter turn`);
  console.log(`and matches ImageMagick -rotate 90 bit-for-bit: ${a.identical}`);
}

main().catch(error => { console.error(error); process.exit(1); });
