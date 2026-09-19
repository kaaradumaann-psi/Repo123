/**
 * AŞAMA 4 devamı — B2/B3/B4 gerçek fotoğraflarında GT köşe hassasiyetini artırıp
 * (full-res Otsu blob diyagonal ekstremumları ±birkaç px) analyzePage'i tekrar dener.
 * Ayrıca köşe sırası rotasyonu hipotezini (fiziksel üst kenar) sınamak için 4 rotasyonu da dener.
 */
import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { applyManualCorners } from '../../src/scanner/manualWarp';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { GrayImage, PixelImage, Point } from '../../src/omr/omrTypes';

type Quad = [Point, Point, Point, Point];

async function loadPhoto(path: string): Promise<{ rgba: PixelImage; gray: GrayImage }> {
  const image = await loadImage(readFileSync(path));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const g = new Uint8Array(image.width * image.height);
  for (let i = 0; i < g.length; i++) {
    const at = i * 4;
    g[i] = Math.round(0.299 * data[at]! + 0.587 * data[at + 1]! + 0.114 * data[at + 2]!);
  }
  return { rgba: { width: image.width, height: image.height, data }, gray: { width: image.width, height: image.height, data: g } };
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

function largestComponentCorners(gray: GrayImage, threshold: number): Quad | null {
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
  const coverage = best.length / (width * height);
  if (coverage > 0.90 || coverage < 0.08) return null;
  let tl = { s: Infinity, p: { x: 0, y: 0 } }, tr = { s: -Infinity, p: { x: 0, y: 0 } };
  let br = { s: -Infinity, p: { x: 0, y: 0 } }, bl = { s: Infinity, p: { x: 0, y: 0 } };
  for (const at of best) {
    const x = at % width, y = Math.floor(at / width);
    const sum = x + y, diff = x - y;
    if (sum < tl.s) tl = { s: sum, p: { x, y } };
    if (diff > tr.s) tr = { s: diff, p: { x, y } };
    if (sum > br.s) br = { s: sum, p: { x, y } };
    if (diff < bl.s) bl = { s: diff, p: { x, y } };
  }
  return [tl.p, tr.p, br.p, bl.p];
}

function grayToRgba(image: GrayImage): PixelImage {
  const data = new Uint8ClampedArray(image.width * image.height * 4);
  for (let i = 0; i < image.data.length; i++) {
    const v = image.data[i]!;
    const at = i * 4;
    data[at] = v; data[at + 1] = v; data[at + 2] = v; data[at + 3] = 255;
  }
  return { width: image.width, height: image.height, data };
}

const rotateOrder = (q: Quad, k: number): Quad => [q[k % 4]!, q[(k + 1) % 4]!, q[(k + 2) % 4]!, q[(k + 3) % 4]!];

const files = ['docs/TestGorselleri/5870507625873608526.jpg', 'docs/TestGorselleri/5870507625873608539.jpg', 'docs/TestGorselleri/5870507625873608522.jpg'];
for (const file of files) {
  const { rgba, gray } = await loadPhoto(file);
  const t = otsu(gray);
  const corners = largestComponentCorners(gray, t);
  if (!corners) { console.log(`| ${file} | blob birleşik (GT yok) | — | — | — |`); continue; }
  console.log(`--- ${file} otsu(t=${t}) köşeler: ${corners.map(p => `(${p.x},${p.y})`).join(' ')}`);
  for (let k = 0; k < 4; k++) {
    const ordered = rotateOrder(corners, k);
    try {
      const warped = applyManualCorners({ source: rgba, corners: ordered, pageWidthMm: 210, pageHeightMm: 297 });
      const read = await analyzePage(grayToRgba(warped.normalized), formDefinition);
      const marked = read.ok ? read.items.filter(i => i.status === 'reliable' || i.status === 'single').length : 0;
      console.log(`| rot${k} | warp ✅ | analyzePage: ${read.ok ? `✅ ok sayfa=${read.pageNumber} işaretli=${marked}` : `❌ ${read.code}`} |`);
    } catch (error) {
      console.log(`| rot${k} | warp ❌ ${error instanceof Error ? error.message.slice(0, 50) : error} |`);
    }
  }
}

// B3/B4: AŞAMA 3 manuel GT (kağıda yapışık) × 4 sıra rotasyonu
const manualGt: Record<string, Quad> = {
  'docs/TestGorselleri/5870507625873608526.jpg': [{ x: 70, y: 90 }, { x: 1210, y: 70 }, { x: 1230, y: 850 }, { x: 90, y: 890 }],
  'docs/TestGorselleri/5870507625873608522.jpg': [{ x: 95, y: 300 }, { x: 860, y: 250 }, { x: 855, y: 980 }, { x: 55, y: 1030 }],
};
for (const [file, corners] of Object.entries(manualGt)) {
  const { rgba } = await loadPhoto(file);
  console.log(`--- ${file} MANUEL GT rotasyon taraması`);
  for (let k = 0; k < 4; k++) {
    const ordered = rotateOrder(corners, k);
    try {
      const warped = applyManualCorners({ source: rgba, corners: ordered, pageWidthMm: 210, pageHeightMm: 297 });
      const read = await analyzePage(grayToRgba(warped.normalized), formDefinition);
      const marked = read.ok ? read.items.filter(i => i.status === 'reliable' || i.status === 'single').length : 0;
      console.log(`| rot${k} | warp ✅ | analyzePage: ${read.ok ? `✅ ok sayfa=${read.pageNumber} işaretli=${marked}` : `❌ ${read.code}`} |`);
    } catch (error) {
      console.log(`| rot${k} | warp ❌ ${error instanceof Error ? error.message.slice(0, 50) : error} |`);
    }
  }
}
