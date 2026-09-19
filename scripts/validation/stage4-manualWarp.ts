/**
 * AŞAMA 4 — Manuel 4-köşe düzeltmenin uçtan uca ölçümü.
 * Ürün kodunu DEĞİŞTİRMEZ; `applyManualCorners` + `analyzePage` çağrılır.
 *
 * Bölüm A — Sentetik 4 senaryo (hafif / orta / güçlü perspektif + döndürülmüş):
 *   renderSyntheticPage → bilinen köşelerle "fotoğraf" içine warp → applyManualCorners
 *   → geri kazanılan sayfa ile orijinal içerik karşılaştırılır (RMSE + %|Δ|>25).
 *
 * Bölüm B — Gerçek fotoğraf 4 senaryo (GT köşeler AŞAMA 3'ten, overlay-doğrulanmış):
 *   applyManualCorners → PNG kayıt (görsel kontrol) → analyzePage (OMR kabul ediyor mu?).
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { applyManualCorners } from '../../src/scanner/manualWarp';
import { fitHomography, mapPoint } from '../../src/omr/perspectiveCorrection';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import { renderSyntheticPage } from '../../tests/fixtures/omrSynthetic';
import type { GrayImage, PixelImage, Point } from '../../src/omr/omrTypes';

const OUT = 'scripts/validation/out';
mkdirSync(OUT, { recursive: true });
const PAGE_W = 210, PAGE_H = 297, PPM = 6;
const CONTENT_W = Math.round(PAGE_W * PPM), CONTENT_H = Math.round(PAGE_H * PPM);

type Quad = [Point, Point, Point, Point];

const luma = (r: number, g: number, b: number) => Math.round(0.299 * r + 0.587 * g + 0.114 * b);

function pixelToGray(image: PixelImage): GrayImage {
  const data = new Uint8Array(image.width * image.height);
  for (let i = 0; i < data.length; i++) {
    const at = i * 4;
    data[i] = luma(image.data[at]!, image.data[at + 1]!, image.data[at + 2]!);
  }
  return { width: image.width, height: image.height, data };
}

/** dst(photo) → src(content) homografisiyle bilinear örnekleme; içerik dışı zemin değeri. */
function renderPhoto(content: GrayImage, dst: Quad, photoW: number, photoH: number, background: (x: number, y: number) => number): PixelImage {
  const h = fitHomography(dst, [
    { x: 0, y: 0 }, { x: content.width, y: 0 },
    { x: content.width, y: content.height }, { x: 0, y: content.height },
  ]);
  const data = new Uint8ClampedArray(photoW * photoH * 4);
  for (let y = 0; y < photoH; y++) for (let x = 0; x < photoW; x++) {
    const p = mapPoint(h, { x, y });
    let v: number;
    if (p.x >= 0 && p.y >= 0 && p.x < content.width - 1 && p.y < content.height - 1) {
      const x0 = Math.floor(p.x), y0 = Math.floor(p.y), fx = p.x - x0, fy = p.y - y0;
      const a = content.data[y0 * content.width + x0]!, b = content.data[y0 * content.width + x0 + 1]!;
      const c = content.data[(y0 + 1) * content.width + x0]!, d = content.data[(y0 + 1) * content.width + x0 + 1]!;
      v = Math.round(a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy);
    } else {
      v = background(x, y);
    }
    const at = (y * photoW + x) * 4;
    data[at] = v; data[at + 1] = v; data[at + 2] = v; data[at + 3] = 255;
  }
  return { width: photoW, height: photoH, data };
}

function compare(a: GrayImage, b: GrayImage): { rmse: number; badPct: number } {
  const n = Math.min(a.data.length, b.data.length);
  let sum = 0, bad = 0;
  for (let i = 0; i < n; i++) {
    const d = a.data[i]! - b.data[i]!;
    sum += d * d;
    if (Math.abs(d) > 25) bad++;
  }
  return { rmse: Math.sqrt(sum / n), badPct: (bad / n) * 100 };
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

function saveGrayPng(gray: GrayImage, path: string, scale = 1) {
  const w = Math.round(gray.width * scale), h = Math.round(gray.height * scale);
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(gray.width, gray.height);
  for (let i = 0; i < gray.data.length; i++) {
    const v = gray.data[i]!;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v; img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
  }
  const tmp = createCanvas(gray.width, gray.height);
  tmp.getContext('2d').putImageData(img, 0, 0);
  ctx.drawImage(tmp as unknown as CanvasImageSource, 0, 0, w, h);
  writeFileSync(path, canvas.toBuffer('image/png'));
}

function rotateQuad(cx: number, cy: number, w: number, deg: number): Quad {
  const hLen = (w * PAGE_H) / PAGE_W;
  const rad = (deg * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const base: Quad = [
    { x: cx - w / 2, y: cy - hLen / 2 }, { x: cx + w / 2, y: cy - hLen / 2 },
    { x: cx + w / 2, y: cy + hLen / 2 }, { x: cx - w / 2, y: cy + hLen / 2 },
  ];
  return base.map(p => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  })) as Quad;
}

async function loadPhotoRgba(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  return { width: image.width, height: image.height, data };
}

// ---------- Bölüm A: sentetik ---------- //
const rendered = renderSyntheticPage({ pixelsPerMm: PPM });
const contentGray = (() => {
  const full = pixelToGray(rendered);
  const m = 32; // SYNTHETIC_MARGIN
  const data = new Uint8Array(CONTENT_W * CONTENT_H);
  for (let y = 0; y < CONTENT_H; y++)
    for (let x = 0; x < CONTENT_W; x++) data[y * CONTENT_W + x] = full.data[(y + m) * full.width + x + m]!;
  return { width: CONTENT_W, height: CONTENT_H, data };
})();

const PHOTO_W = 1500, PHOTO_H = 2000;
const deskBackground = (x: number, y: number) => Math.round(80 + (40 * y) / PHOTO_H + 6 * Math.sin(x / 37));

const syntheticScenarios: { name: string; dst: Quad }[] = [
  { name: 'A1 hafif perspektif', dst: [{ x: 120, y: 80 }, { x: 1390, y: 110 }, { x: 1360, y: 1890 }, { x: 140, y: 1860 }] },
  { name: 'A2 orta perspektif', dst: [{ x: 200, y: 150 }, { x: 1300, y: 100 }, { x: 1420, y: 1900 }, { x: 100, y: 1850 }] },
  { name: 'A3 güçlü perspektif', dst: [{ x: 330, y: 220 }, { x: 1180, y: 120 }, { x: 1450, y: 1950 }, { x: 80, y: 1800 }] },
  { name: 'A4 döndürülmüş 20°', dst: rotateQuad(750, 980, 800, 20) },
];

console.log('### Bölüm A — sentetik (içerik 1260×1782, 6px/mm)');
console.log('| Senaryo | RMSE | %|Δ|>25 | karar |');
console.log('|---|---|---|---|');
for (const scenario of syntheticScenarios) {
  const photo = renderPhoto(contentGray, scenario.dst, PHOTO_W, PHOTO_H, deskBackground);
  const result = applyManualCorners({ source: photo, corners: scenario.dst, pageWidthMm: PAGE_W, pageHeightMm: PAGE_H, pixelsPerMm: PPM });
  const metric = compare(result.normalized, contentGray);
  const pass = metric.rmse < 15 && metric.badPct < 5;
  console.log(`| ${scenario.name} | ${metric.rmse.toFixed(2)} | ${metric.badPct.toFixed(2)}% | ${pass ? 'PASS' : 'FAIL'} |`);
  saveGrayPng(result.normalized, join(OUT, `stage4-${scenario.name.split(' ')[0]}-recovered.png`), 0.5);
}

// ---------- Bölüm B: gerçek fotoğraflar ---------- //
// AŞAMA 3 overlay-doğrulanmış GT köşeleri (tam çözünürlük, TL/TR/BR/BL)
const realCases: { name: string; file: string; corners: Quad }[] = [
  { name: 'B1 hafif persp. — c1.jpg', file: 'docs/TestGorselleri/c1.jpg', corners: [{ x: 55, y: 20 }, { x: 1210, y: 25 }, { x: 1200, y: 1765 }, { x: 30, y: 1750 }] },
  { name: 'B2 orta persp. — …539.jpg', file: 'docs/TestGorselleri/5870507625873608539.jpg', corners: [{ x: 74, y: 88 }, { x: 1186, y: 66 }, { x: 1230, y: 870 }, { x: 60, y: 906 }] },
  { name: 'B3 döndürülmüş ~90° — …526.jpg', file: 'docs/TestGorselleri/5870507625873608526.jpg', corners: [{ x: 70, y: 90 }, { x: 1210, y: 70 }, { x: 1230, y: 850 }, { x: 90, y: 890 }] },
  { name: 'B4 güçlü persp.+döndürülmüş — …522.jpg', file: 'docs/TestGorselleri/5870507625873608522.jpg', corners: [{ x: 95, y: 300 }, { x: 860, y: 250 }, { x: 855, y: 980 }, { x: 55, y: 1030 }] },
];

console.log('\n### Bölüm B — gerçek fotoğraflar (8px/mm çıktı 1680×2376)');
console.log('| Senaryo | validate+fit+warp | analyzePage | sayfa | işaretli madde | warnings |');
console.log('|---|---|---|---|---|---|');
for (const test of realCases) {
  try {
    const rgba = await loadPhotoRgba(test.file);
    const result = applyManualCorners({ source: rgba, corners: test.corners, pageWidthMm: PAGE_W, pageHeightMm: PAGE_H });
    saveGrayPng(result.normalized, join(OUT, `stage4-${test.name.split(' ')[0]}-recovered.png`), 0.3);
    const read = await analyzePage(grayToRgba(result.normalized), formDefinition);
    if (read.ok) {
      const marked = read.items.filter(item => item.status === 'reliable' || item.status === 'single').length;
      console.log(`| ${test.name} | ✅ | ✅ ok | ${read.pageNumber} | ${marked} | ${read.warnings.length} |`);
    } else {
      console.log(`| ${test.name} | ✅ | ❌ ${read.code} | — | — | — |`);
    }
  } catch (error) {
    console.log(`| ${test.name} | ❌ ${error instanceof Error ? error.message : error} | — | — | — | — |`);
  }
}

// ---------- Bölüm C: validateCorners negatif senaryoları (kod yolunda) ---------- //
console.log('\n### Bölüm C — reddedilmesi gerekenler');
const photoBase = renderPhoto(contentGray, syntheticScenarios[0]!.dst, PHOTO_W, PHOTO_H, deskBackground);
const negatives: { name: string; corners: Quad }[] = [
  { name: 'coincident (2 köşe çakışık)', corners: [{ x: 120, y: 80 }, { x: 122, y: 82 }, { x: 1360, y: 1890 }, { x: 140, y: 1860 }] },
  { name: 'self-intersection (bowtie)', corners: [{ x: 120, y: 80 }, { x: 1360, y: 1890 }, { x: 1390, y: 110 }, { x: 140, y: 1860 }] },
  { name: 'ters sıra (mirror)', corners: [{ x: 140, y: 1860 }, { x: 1360, y: 1890 }, { x: 1390, y: 110 }, { x: 120, y: 80 }] },
  { name: 'out-of-bounds (köşe kadraj dışı)', corners: [{ x: -50, y: 80 }, { x: 1390, y: 110 }, { x: 1360, y: 1890 }, { x: 140, y: 1860 }] },
];
for (const negative of negatives) {
  try {
    applyManualCorners({ source: photoBase, corners: negative.corners, pageWidthMm: PAGE_W, pageHeightMm: PAGE_H });
    console.log(`| ${negative.name} | ❌ REDDETMEDİ — BUG |`);
  } catch (error) {
    console.log(`| ${negative.name} | ✅ reddedildi: ${error instanceof Error ? error.message.slice(0, 60) : error} |`);
  }
}
