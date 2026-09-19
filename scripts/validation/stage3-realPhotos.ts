/**
 * AŞAMA 3 (rev.2) — GERÇEK fotoğraflarda canlı-önizleme sayfa tespiti ölçümü.
 *
 * Ürün kodunu DEĞİŞTİRMEZ. CameraCapture.frameToGray akışını taklit eder (stride 2 →
 * yarı çözünürlük gri) ve mevcut `adviseCameraFrame` / `detectPageBox` çıktısını ölçer.
 *
 * GT (ground truth) köşe stratejisi:
 *  1) Otsu eşiğiyle en büyük parlak bileşen → diyagonal ekstremumlar (±(x+y), ±(x−y)) → GT quad
 *     (bileşen kadrajın %92'sini aşarsa zemin sayfayla birleşmiş demektir → 'GT-belirsiz')
 *  2) Görsel tahmin sabitleri (MANUAL_GT) — read_file ile görüntülenen fotoğraflardan, yarı-
 *     çözünürlük uzayına bölünür.
 *  3) Overlay kompozitleri scripts/validation/out/ altına yazılır → görsel doğrulama.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { adviseCameraFrame, detectPageBox, pageBoxCorners } from '../../src/scanner/cameraAdvisor';
import type { GrayImage, Point } from '../../src/omr/omrTypes';

const DIR = 'docs/TestGorselleri';
const OUT = 'scripts/validation/out';
mkdirSync(OUT, { recursive: true });

const PHOTOS = [
  '1a.jpg', '2a.jpg', '3a.jpg', '4a.jpg', '5a.jpg', '6a.jpg', '7a.jpg',
  'c1.jpg', 'c2.jpg', 'c3.jpg', 'c4.jpg',
  ...Array.from({ length: 19 }, (_, i) => `58705076258736085${22 + i}.jpg`),
];

/** read_file ile görülen fotoğraflardan görsel GT (tam çözünürlük, TL/TR/BR/BL sırası). */
const MANUAL_GT: Record<string, [Point, Point, Point, Point]> = {
  '5870507625873608522.jpg': [{ x: 95, y: 300 }, { x: 860, y: 250 }, { x: 855, y: 980 }, { x: 55, y: 1030 }],
  '5870507625873608526.jpg': [{ x: 70, y: 90 }, { x: 1210, y: 70 }, { x: 1230, y: 850 }, { x: 90, y: 890 }],
  'c1.jpg': [{ x: 55, y: 20 }, { x: 1210, y: 25 }, { x: 1200, y: 1765 }, { x: 30, y: 1750 }],
  '1a.jpg': [{ x: 20, y: 20 }, { x: 2185, y: 15 }, { x: 2190, y: 3290 }, { x: 25, y: 3295 }],
};

/** CameraCapture.frameToGray ile aynı: stride-2 downscale + luma. */
async function photoToPreviewGray(path: string): Promise<{ gray: GrayImage; fullW: number; fullH: number }> {
  const image = await loadImage(readFileSync(path));
  const w = Math.max(60, Math.floor(image.width / 2));
  const h = Math.max(60, Math.floor(image.height / 2));
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0, w, h);
  const rgba = ctx.getImageData(0, 0, w, h).data;
  const data = new Uint8Array(w * h);
  for (let i = 0; i < data.length; i++) {
    const at = i * 4;
    data[i] = Math.round(0.299 * rgba[at]! + 0.587 * rgba[at + 1]! + 0.114 * rgba[at + 2]!);
  }
  return { gray: { width: w, height: h, data }, fullW: image.width, fullH: image.height };
}

function otsu(gray: GrayImage): number {
  const hist = new Float64Array(256);
  for (const v of gray.data) hist[v]!++;
  const total = gray.data.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i]!;
  let sumB = 0, wB = 0, best = -1, threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t]!;
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t]!;
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; threshold = t; }
  }
  return threshold;
}

/** En büyük parlak bileşenin maskesi + alanı (detectPageBox'un BFS'iyle aynı mantık). */
function largestBrightComponent(gray: GrayImage, threshold: number) {
  const { width, height, data } = gray;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let best: number[] = [];
  for (let start = 0; start < visited.length; start++) {
    if (visited[start] || data[start]! < threshold) { visited[start] = 1; continue; }
    const pixels: number[] = [];
    let read = 0, count = 1;
    visited[start] = 1; queue[0] = start; pixels.push(start);
    while (read < count) {
      const at = queue[read++]!;
      const x = at % width, y = Math.floor(at / width);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited[next]) continue;
        visited[next] = 1;
        if (data[next]! < threshold) continue;
        queue[count++] = next; pixels.push(next);
      }
    }
    if (pixels.length > best.length) best = pixels;
  }
  return best;
}

/** Bileşen piksellerinin diyagonal ekstremumları → döndürülmüş dikdörtgen köşeleri (TL/TR/BR/BL). */
function extremeCorners(pixels: number[], width: number): [Point, Point, Point, Point] {
  let tl = { s: Infinity, p: { x: 0, y: 0 } }, tr = { s: -Infinity, p: { x: 0, y: 0 } };
  let br = { s: -Infinity, p: { x: 0, y: 0 } }, bl = { s: Infinity, p: { x: 0, y: 0 } };
  for (const at of pixels) {
    const x = at % width, y = Math.floor(at / width);
    const sum = x + y, diff = x - y;
    if (sum < tl.s) tl = { s: sum, p: { x, y } };
    if (diff > tr.s) tr = { s: diff, p: { x, y } };
    if (sum > br.s) br = { s: sum, p: { x, y } };
    if (diff < bl.s) bl = { s: diff, p: { x, y } };
  }
  return [tl.p, tr.p, br.p, bl.p];
}

function fillQuadMask(mask: Uint8Array, width: number, height: number, corners: Point[]) {
  const ys = corners.map(p => p.y);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(height - 1, Math.ceil(Math.max(...ys)));
  const edges: [Point, Point][] = [[corners[0]!, corners[1]!], [corners[1]!, corners[2]!], [corners[2]!, corners[3]!], [corners[3]!, corners[0]!]];
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (const [a, b] of edges) {
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    xs.sort((m, n) => m - n);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x0 = Math.max(0, Math.round(xs[i]!)), x1 = Math.min(width - 1, Math.round(xs[i + 1]!));
      for (let x = x0; x <= x1; x++) mask[y * width + x] = 1;
    }
  }
}

function iou(a: Uint8Array, b: Uint8Array): number {
  let inter = 0, union = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] && b[i]) inter++;
    if (a[i] || b[i]) union++;
  }
  return union ? inter / union : 0;
}

function drawOverlay(gray: GrayImage, gt: Point[] | null, box: Point[] | null, outPath: string) {
  const canvas = createCanvas(gray.width, gray.height);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(gray.width, gray.height);
  for (let i = 0; i < gray.data.length; i++) {
    const v = gray.data[i]!;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const draw = (corners: Point[], color: string) => {
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath(); ctx.stroke();
    ctx.fillStyle = color;
    for (const p of corners) { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
  };
  if (gt) draw(gt, '#00c400');
  if (box) draw(box, '#ff2020');
  writeFileSync(outPath, canvas.toBuffer('image/png'));
}

console.log('| Fotoğraf | Boyut | hint | pageDetected | box | kutu kapsama | kutu aspect | GT köşe hatası ort/max (px) | IoU(GT,box) |');
console.log('|---|---|---|---|---|---|---|---|---|');

for (const name of PHOTOS) {
  const path = join(DIR, name);
  const { gray, fullW, fullH } = await photoToPreviewGray(path);
  const advice = adviseCameraFrame(gray);
  const box = advice.pageBox ? pageBoxCorners(advice.pageBox) : null;
  const boxArea = advice.pageBox ? (advice.pageBox.width * advice.pageBox.height) / (gray.width * gray.height) : 0;
  const boxAspect = advice.pageBox ? advice.pageBox.width / advice.pageBox.height : 0;

  // GT: önce manuel görsel sabit (varsa), değilse blob ekstremumları
  let gt: [Point, Point, Point, Point] | null = null;
  let gtSource = '';
  if (MANUAL_GT[name]) {
    gt = MANUAL_GT[name].map(p => ({ x: p.x / 2, y: p.y / 2 })) as [Point, Point, Point, Point];
    gtSource = 'manuel-görsel(±12px)';
  } else {
    const threshold = otsu(gray);
    const component = largestBrightComponent(gray, threshold);
    const coverage = component.length / (gray.width * gray.height);
    if (coverage > 0.08 && coverage < 0.90) {
      gt = extremeCorners(component, gray.width);
      gtSource = `otsu-blob(t=${threshold})`;
    }
  }

  let meanErr = '', maxErr = '', iouText = '';
  if (gt && box) {
    const errors = gt.map(tc => Math.min(...box.map(d => Math.hypot(d.x - tc.x, d.y - tc.y))));
    meanErr = (errors.reduce((a, b) => a + b, 0) / 4).toFixed(1);
    maxErr = Math.max(...errors).toFixed(1);
    const gtMask = new Uint8Array(gray.width * gray.height);
    fillQuadMask(gtMask, gray.width, gray.height, gt);
    const boxMask = new Uint8Array(gray.width * gray.height);
    const bx0 = Math.min(...box.map(p => p.x)), bx1 = Math.max(...box.map(p => p.x));
    const by0 = Math.min(...box.map(p => p.y)), by1 = Math.max(...box.map(p => p.y));
    for (let y = Math.max(0, Math.round(by0)); y <= Math.min(gray.height - 1, Math.round(by1)); y++)
      for (let x = Math.max(0, Math.round(bx0)); x <= Math.min(gray.width - 1, Math.round(bx1)); x++) boxMask[y * gray.width + x] = 1;
    iouText = iou(gtMask, boxMask).toFixed(3);
  } else if (gt && !box) {
    meanErr = maxErr = iouText = '— (kutu yok)';
  }

  if (gt) drawOverlay(gray, gt, box, join(OUT, `${basename(name, '.jpg')}-overlay.png`));

  const boxText = advice.pageBox
    ? `x:${advice.pageBox.x} y:${advice.pageBox.y} ${advice.pageBox.width}×${advice.pageBox.height}`
    : '—';
  console.log(`| ${name} | ${fullW}×${fullH} | ${advice.hint} | ${advice.pageDetected ? 'evet' : 'hayır'} | ${boxText} | ${(boxArea * 100).toFixed(1)}% | ${boxAspect ? boxAspect.toFixed(2) : '—'} | ${meanErr}${maxErr ? ' / ' + maxErr : ''}${gtSource ? ` (${gtSource})` : ''} | ${iouText} |`);
}
