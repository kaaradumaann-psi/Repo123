/**
 * AŞAMA 6 — Enhancement modlarının GERÇEK warp edilmiş sayfalarda nicel testi.
 * Ürün kodunu DEĞİŞTİRMEZ.
 *
 * Sayfalar:
 *   P1 = c1.jpg warp (AŞAMA 4/B1) — temiz gerçek sayfa
 *   P2 = …526.jpg warp rot1 (AŞAMA 4 rafinesi) — gerçek telefon çekimi, sağda gölge
 *   P3 = P1 + enjekte diyagonal gölge (kontrollü flattening ölçümü)
 *
 * Metrikler: geometri (boyut korunumu), global std, P99–P1, kadran-ortalama spread (gölge),
 * zemin gürültüsü (boş bant patch std), kenar-halo oranı (|∇|>60 bandında |Δ| / bant-dışı |Δ|),
 * baloncuk halkası koyuluğu korunumu (formDefinition mm koordinatlarından örnekleme), BW siyah%.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { applyManualCorners } from '../../src/scanner/manualWarp';
import { applyEnhancement, ENHANCEMENT_MODES } from '../../src/scanner/enhancement';
import type { EnhancementMode } from '../../src/scanner/enhancement';
import { formDefinition } from '../../src/omr/formDefinition';
import type { GrayImage, PixelImage, Point } from '../../src/omr/omrTypes';

const OUT = 'scripts/validation/out';
mkdirSync(OUT, { recursive: true });
const PPM = 8;

type Quad = [Point, Point, Point, Point];

async function loadAndWarp(file: string, corners: Quad): Promise<GrayImage> {
  const image = await loadImage(readFileSync(file));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  const result = applyManualCorners({
    source: { width: image.width, height: image.height, data },
    corners, pageWidthMm: 210, pageHeightMm: 297, pixelsPerMm: PPM,
  });
  return result.normalized;
}

function injectShadow(image: GrayImage, strength = 80): GrayImage {
  const data = new Uint8Array(image.data);
  for (let y = 0; y < image.height; y++) for (let x = 0; x < image.width; x++) {
    // Sol üstten sağ alta doğru diyagonal gölge: sol üst -strength, sağ alt 0
    const t = 1 - (x / image.width * 0.6 + y / image.height * 0.4);
    const drop = Math.round(strength * t * t);
    const i = y * image.width + x;
    data[i] = Math.max(0, data[i]! - drop);
  }
  return { width: image.width, height: image.height, data };
}

function histogramPercentiles(image: GrayImage, lo: number, hi: number): [number, number] {
  const hist = new Uint32Array(256);
  for (const v of image.data) hist[v]!++;
  const total = image.data.length;
  const loT = total * lo, hiT = total * hi;
  let c = 0, low = 0, high = 255;
  for (let v = 0; v < 256; v++) { c += hist[v]!; if (c >= loT) { low = v; break; } }
  c = 0;
  for (let v = 0; v < 256; v++) { c += hist[v]!; if (c >= hiT) { high = v; break; } }
  return [low, high];
}

function globalStd(image: GrayImage): number {
  let sum = 0, sq = 0;
  for (const v of image.data) { sum += v; sq += v * v; }
  const n = image.data.length;
  return Math.sqrt(Math.max(0, sq / n - (sum / n) ** 2));
}

function quadrantSpread(image: GrayImage): number {
  const means: number[] = [];
  for (let qy = 0; qy < 2; qy++) for (let qx = 0; qx < 2; qx++) {
    const x0 = Math.floor(image.width * (qx * 0.5 + 0.05)), x1 = Math.floor(image.width * (qx * 0.5 + 0.45));
    const y0 = Math.floor(image.height * (qy * 0.5 + 0.05)), y1 = Math.floor(image.height * (qy * 0.5 + 0.45));
    let sum = 0, count = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { sum += image.data[y * image.width + x]!; count++; }
    means.push(sum / count);
  }
  return Math.max(...means) - Math.min(...means);
}

function patchStd(image: GrayImage): number {
  // mm (192..206, 100..200): içerik sağ kenarı (190mm) ile marker bölgesi (282mm) arası temiz kağıt bandı
  const x0 = 192 * PPM, x1 = 206 * PPM, y0 = 100 * PPM, y1 = 200 * PPM;
  let sum = 0, sq = 0, count = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const v = image.data[y * image.width + x]!;
    sum += v; sq += v * v; count++;
  }
  return Math.sqrt(Math.max(0, sq / count - (sum / count) ** 2));
}

function sobelMask(image: GrayImage, threshold: number): Uint8Array {
  const mask = new Uint8Array(image.width * image.height);
  for (let y = 1; y < image.height - 1; y++) for (let x = 1; x < image.width - 1; x++) {
    const i = y * image.width + x;
    const gx = -image.data[i - 1 - image.width]! - 2 * image.data[i - 1]! - image.data[i - 1 + image.width]!
      + image.data[i + 1 - image.width]! + 2 * image.data[i + 1]! + image.data[i + 1 + image.width]!;
    const gy = -image.data[i - image.width - 1]! - 2 * image.data[i - image.width]! - image.data[i - image.width + 1]!
      + image.data[i + image.width - 1]! + 2 * image.data[i + image.width]! + image.data[i + image.width + 1]!;
    if (Math.abs(gx) + Math.abs(gy) > threshold) mask[i] = 1;
  }
  return mask;
}

function dilate(mask: Uint8Array, width: number, height: number, radius: number): Uint8Array {
  const out = new Uint8Array(mask);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!mask[y * width + x]) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height) out[ny * width + nx] = 1;
    }
  }
  return out;
}

function haloRatio(original: GrayImage, modified: GrayImage): number {
  const band = dilate(sobelMask(original, 260), original.width, original.height, 2);
  let inSum = 0, inCount = 0, outSum = 0, outCount = 0;
  for (let i = 0; i < original.data.length; i++) {
    const d = Math.abs(modified.data[i]! - original.data[i]!);
    if (band[i]) { inSum += d; inCount++; } else { outSum += d; outCount++; }
  }
  return (inSum / Math.max(1, inCount)) / Math.max(1e-9, outSum / Math.max(1, outCount));
}

/** Baloncuk halkası koyuluğu: formDefinition mm koordinatlarında halka çevresi örnekleme. */
function ringDarkness(image: GrayImage): number {
  const page = formDefinition.pages[0]!;
  const values: number[] = [];
  for (let itemIndex = 0; itemIndex < 48; itemIndex += 2) {
    for (const area of page.items[itemIndex]!.responseAreas) {
      const cx = (area.x + area.width / 2) * PPM, cy = (area.y + area.height / 2) * PPM;
      const r = (area.width / 2 - 0.25) * PPM;
      const samples: number[] = [];
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        const sx = Math.round(cx + r * Math.cos(a)), sy = Math.round(cy + r * Math.sin(a));
        if (sx >= 0 && sy >= 0 && sx < image.width && sy < image.height) samples.push(image.data[sy * image.width + sx]!);
      }
      samples.sort((a, b) => a - b);
      values.push(255 - (samples[Math.floor(samples.length / 2)] ?? 255));
    }
  }
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)] ?? 0;
}

function blackPercent(image: GrayImage): number {
  let black = 0;
  for (const v of image.data) if (v < 128) black++;
  return (black / image.data.length) * 100;
}

function contactSheet(pages: GrayImage[], labels: string[], path: string, scale: number) {
  const w = Math.round(pages[0]!.width * scale), h = Math.round(pages[0]!.height * scale);
  const cols = 3, rows = Math.ceil(pages.length / cols);
  const canvas = createCanvas(cols * w, rows * (h + 18));
  const ctx = canvas.getContext('2d');
  const tmp = createCanvas(pages[0]!.width, pages[0]!.height);
  const tctx = tmp.getContext('2d');
  pages.forEach((page, index) => {
    const img = tctx.createImageData(page.width, page.height);
    for (let i = 0; i < page.data.length; i++) {
      const v = page.data[i]!;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    tctx.putImageData(img, 0, 0);
    const dx = (index % cols) * w, dy = Math.floor(index / cols) * (h + 18) + 18;
    ctx.drawImage(tmp as unknown as CanvasImageSource, dx, dy, w, h);
    ctx.fillStyle = '#000000';
    ctx.font = '12px sans-serif';
    ctx.fillText(labels[index]!, dx + 4, dy - 5);
  });
  writeFileSync(path, canvas.toBuffer('image/png'));
}

const P1 = await loadAndWarp('docs/TestGorselleri/c1.jpg',
  [{ x: 55, y: 20 }, { x: 1210, y: 25 }, { x: 1200, y: 1765 }, { x: 30, y: 1750 }]);
const P2 = await loadAndWarp('docs/TestGorselleri/5870507625873608526.jpg',
  [{ x: 1210, y: 70 }, { x: 1230, y: 850 }, { x: 90, y: 890 }, { x: 70, y: 90 }]); // rot1 düzeltilmiş sıra
const P3 = injectShadow(P1, 90);

const pages: { id: string; gray: GrayImage }[] = [
  { id: 'P1 (c1 warp — temiz)', gray: P1 },
  { id: 'P2 (…526 warp rot1 — gölgeli)', gray: P2 },
  { id: 'P3 (P1 + enjekte gölge)', gray: P3 },
];

for (const page of pages) {
  const base = page.gray;
  const baseStd = globalStd(base), baseSpread = quadrantSpread(base), baseNoise = patchStd(base), baseRing = ringDarkness(base);
  const [, baseHi] = histogramPercentiles(base, 0.01, 0.99);
  const [baseLo] = histogramPercentiles(base, 0.01, 0.99);
  console.log(`\n### ${page.id} (${base.width}×${base.height}) — ORIGINAL: std=${baseStd.toFixed(1)} P99–P1=${baseHi - baseLo} spread=${baseSpread.toFixed(1)} noise=${baseNoise.toFixed(2)} ring=${baseRing.toFixed(0)}`);
  console.log('| Mod | geom. | std | P99–P1 | kadran spread | noise | halo oranı | halka koyuluğu | siyah% |');
  console.log('|---|---|---|---|---|---|---|---|---|');
  const sheetImages: GrayImage[] = [];
  const sheetLabels: string[] = [];
  for (const mode of ENHANCEMENT_MODES) {
    const out = applyEnhancement(base, mode as EnhancementMode);
    const geom = out.width === base.width && out.height === base.height ? '✅' : '❌ DEĞİŞTİ';
    const [lo, hi] = histogramPercentiles(out, 0.01, 0.99);
    const std = globalStd(out), spread = quadrantSpread(out), noise = patchStd(out);
    const halo = mode === 'original' || mode === 'gray' ? 1 : haloRatio(base, out);
    const ring = mode === 'bw' ? NaN : ringDarkness(out);
    const black = mode === 'bw' ? blackPercent(out) : NaN;
    console.log(`| ${mode} | ${geom} | ${std.toFixed(1)} | ${hi - lo} | ${spread.toFixed(1)} | ${noise.toFixed(2)} | ${halo.toFixed(2)} | ${Number.isNaN(ring) ? '—' : ring.toFixed(0)} | ${Number.isNaN(black) ? '—' : black.toFixed(1) + '%'} |`);
    sheetImages.push(out);
    sheetLabels.push(mode);
  }
  contactSheet(sheetImages, sheetLabels, join(OUT, `stage6-${page.id.split(' ')[0]}-modes.png`), 0.16);
}
