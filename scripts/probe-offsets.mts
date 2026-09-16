/** For named items: where are the true ring centres (wide search, 2.4 mm) vs nominal?
 * Also draws crosses on the photo crop: nominal positions (red) and wide-search ring centres (green). */
import { readFileSync, writeFileSync } from 'node:fs';
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
import { fitHomography, fitSimilarity, warpPerspective, CANONICAL_PIXELS_PER_MM, mapPoint } from '../src/omr/perspectiveCorrection';
import type { Homography } from '../src/omr/perspectiveCorrection';

function invertHomography(m: Homography): Homography {
  const [a, b, c, d, e, f, g, h, i] = m;
  const C11 = e * i - f * h, C12 = f * g - d * i, C13 = d * h - e * g;
  const C21 = c * h - b * i, C22 = a * i - c * g, C23 = b * g - a * h;
  const C31 = b * f - c * e, C32 = c * d - a * f, C33 = a * e - b * d;
  const det = a * C11 + b * C12 + c * C13;
  if (Math.abs(det) < 1e-12) throw new Error('Singular');
  return [
    C11 / det, C21 / det, C31 / det,
    C12 / det, C22 / det, C32 / det,
    C13 / det, C23 / det, C33 / det,
  ] as Homography;
}
import { RING_REFINE, fitRingCenter } from '../src/omr/bubbleRingRefinement';

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
const all = page.items.flatMap(item => item.responseAreas);

// Wide-search diagnostic: temporarily widen the budget via monkey-patched module copy is overkill;
// instead re-implement the search here with a 2.4 mm budget (same math as searchRingOffset).
function wideSearch(cx: number, cy: number, reference: number, neighbours: ResponseArea[]): { dx: number; dy: number; completeness: number } {
  const sectors = RING_REFINE.searchSectors;
  const candidates: { dx: number; dy: number }[] = [{ dx: 0, dy: 0 }];
  for (const radius of [0.25, 0.5, 0.75, 1, 1.3, 1.6, 1.9, 2.2]) {
    const count = Math.max(8, Math.round(radius * 16));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI;
      candidates.push({ dx: radius * Math.cos(angle), dy: radius * Math.sin(angle) });
    }
  }
  const inside = (a: ResponseArea, x: number, y: number) => {
    const c = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    return ((x - c.x) / (a.width / 2)) ** 2 + ((y - c.y) / (a.height / 2)) ** 2 <= 1;
  };
  let best = { dx: 0, dy: 0, completeness: 0, rms: 1e9 };
  for (const cand of candidates) {
    let hits = 0, sumSq = 0;
    for (let sector = 0; sector < sectors; sector++) {
      const angle = ((sector + 0.5) / sectors) * 2 * Math.PI;
      const cos = Math.cos(angle), sin = Math.sin(angle);
      let bestDark = -1, bestR = NaN;
      for (let r = 1.2; r <= 2.05 + 1e-9; r += 0.1) {
        const px = Math.round(cx + cand.dx * ppm + cos * r * ppm - 0.5);
        const py = Math.round(cy + cand.dy * ppm + sin * r * ppm - 0.5);
        if (px < 0 || py < 0 || px >= normalized.width || py >= normalized.height) continue;
        const xMm = (px + 0.5) / ppm, yMm = (py + 0.5) / ppm;
        if (neighbours.some(nb => inside(nb, xMm, yMm))) continue;
        const d = Math.max(0, Math.min(1, (reference - normalized.data[py * normalized.width + px]!) / Math.max(1, reference)));
        if (d > bestDark) { bestDark = d; bestR = r; }
      }
      if (bestDark >= RING_REFINE.darknessThreshold && Math.abs(bestR - 1.6) <= RING_REFINE.searchRadiusToleranceMm) {
        hits++; sumSq += (bestR - 1.6) ** 2;
      } else sumSq += 0.09;
    }
    const completeness = hits / sectors;
    const rms = Math.sqrt(sumSq / sectors);
    if (completeness > best.completeness + 1e-9 || (Math.abs(completeness - best.completeness) <= 1e-9 && rms < best.rms)) {
      best = { dx: cand.dx, dy: cand.dy, completeness, rms };
    }
  }
  return best;
}

// Reference levels + neighbours: reuse via a tiny inline copy of the module logic.
function refAndNeighbours(area: ResponseArea): { reference: number; neighbours: ResponseArea[] } {
  const c = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  const r = Math.min(area.width, area.height) / 2;
  const cx = c.x * ppm, cy = c.y * ppm;
  const inside = (a: ResponseArea, x: number, y: number) => {
    const cc = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
    return ((x - cc.x) / (a.width / 2)) ** 2 + ((y - cc.y) / (a.height / 2)) ** 2 <= 1;
  };
  const neighbours = all.filter(candidate => {
    if (candidate.responseId === area.responseId) return false;
    const o = { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 };
    return Math.hypot(o.x - c.x, o.y - c.y) <= r + 0.45 + r + 1.85 + Math.min(candidate.width, candidate.height) / 2;
  });
  const collect = (inner: number, outer: number): number[] => {
    const vals: number[] = [];
    for (let y = Math.floor(cy - outer * ppm); y <= Math.ceil(cy + outer * ppm); y++)
      for (let x = Math.floor(cx - outer * ppm); x <= Math.ceil(cx + outer * ppm); x++) {
        if (x < 0 || y < 0 || x >= normalized.width || y >= normalized.height) continue;
        const xMm = (x + 0.5) / ppm, yMm = (y + 0.5) / ppm;
        const d = Math.hypot(xMm - c.x, yMm - c.y);
        if (d < inner || d > outer || neighbours.some(nb => inside(nb, xMm, yMm))) continue;
        vals.push(normalized.data[y * normalized.width + x]!);
      }
    return vals;
  };
  const p85 = (vs: number[]) => { if (!vs.length) return 0; const s = [...vs].sort((a, b) => a - b); return s[Math.floor((s.length - 1) * 0.8)]!; };
  const reference = Math.max(p85(collect(r + 0.35, r + 0.95)), p85(collect(r + 1.25, r + 1.85)), 120);
  return { reference, neighbours };
}

const inv = invertHomography ? invertHomography(transform) : null;
const photoPoints: { x: number; y: number; kind: 'nom' | 'ring' }[] = [];
for (const itemNumber of itemNumbers) {
  const item = page.items.find(candidate => candidate.itemNumber === itemNumber)!;
  for (const area of item.responseAreas) {
    const c = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
    const { reference, neighbours } = refAndNeighbours(area);
    const hit = wideSearch(c.x * ppm, c.y * ppm, reference, neighbours);
    const baseFit = fitRingCenter(normalized, area, all);
    console.log(`#${itemNumber} ${area.choiceId} wide=(dx=${hit.dx.toFixed(2)},dy=${hit.dy.toFixed(2)}) comp=${(hit.completeness * 100).toFixed(0)}% rms=${hit.rms.toFixed(3)} baseFit=${baseFit.ok ? 'ok' : 'NOM'}`);
    // Inverse-map to photo for the overlay.
    const toPhoto = (xMm: number, yMm: number) => {
      const p = inv ? mapPoint(inv, { x: xMm, y: yMm }) : { x: -1, y: -1 };
      return { x: p.x + iso.originX, y: p.y + iso.originY };
    };
    const nom = toPhoto(c.x, c.y);
    const ring = toPhoto(c.x + hit.dx, c.y + hit.dy);
    photoPoints.push({ x: nom.x, y: nom.y, kind: 'nom' });
    photoPoints.push({ x: ring.x, y: ring.y, kind: 'ring' });
  }
}
// Draw overlay on the photo.
const xs = photoPoints.map(p => p.x), ys = photoPoints.map(p => p.y);
const x0 = Math.max(0, Math.floor(Math.min(...xs)) - 30), y0 = Math.max(0, Math.floor(Math.min(...ys)) - 30);
const x1 = Math.min(iso.image.width - 1, Math.ceil(Math.max(...xs)) + 30), y1 = Math.min(iso.image.height - 1, Math.ceil(Math.max(...ys)) + 30);
const w = x1 - x0, h = y1 - y0, zoom = 3;
const canvas = createCanvas(w * zoom, h * zoom);
const ctx = canvas.getContext('2d');
// paint photo grayscale
const img = ctx.createImageData(w * zoom, h * zoom);
for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
  const v = iso.image.data[(y0 + j) * iso.image.width + x0 + i]!;
  for (let zj = 0; zj < zoom; zj++) for (let zi = 0; zi < zoom; zi++) {
    const at = ((j * zoom + zj) * w * zoom + i * zoom + zi) * 4;
    img.data[at] = img.data[at + 1] = img.data[at + 2] = v; img.data[at + 3] = 255;
  }
}
ctx.putImageData(img, 0, 0);
const drawCross = (p: { x: number; y: number }, color: string) => {
  const px = (p.x - x0) * zoom, py = (p.y - y0) * zoom;
  if (px < 0 || py < 0 || px > w * zoom || py > h * zoom) return;
  const s = 9;
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(px - s, py); ctx.lineTo(px + s, py); ctx.moveTo(px, py - s); ctx.lineTo(px, py + s); ctx.stroke();
};
for (const p of photoPoints) drawCross(p, p.kind === 'nom' ? '#ff0000' : '#00cc00');
writeFileSync(`/home/user/prev/overlay_${name.replace('.jpg', '')}.png`, canvas.toBuffer('image/png'));
console.log('overlay written (red=nominal, green=wide-search ring centre)');
