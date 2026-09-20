/* Audit-only: QR-crop preprocessing variant experiment (options A-M, classical only). */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { autoScanDocument, whiteDocumentFilter, sharpen } from '../../src/scanner/documentScan';
import { normalizeShadows } from '../../src/scanner/shadowNormalization';
import { binarize } from '../../src/scanner/enhancement';
import { formDefinition } from '../../src/omr/formDefinition';
import { toGrayscale } from '../../src/omr/imageQuality';
import type { GrayImage, PixelImage, Point } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';

const dir = 'docs/TestGorselleri';
const FILES = process.argv.slice(2);
const qrArea = formDefinition.pages[0]!.qrArea;

function resize(gray: GrayImage, scale: number, nearest = false): GrayImage {
  const w = Math.round(gray.width * scale), h = Math.round(gray.height * scale);
  const data = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(gray.height - 1, (y + 0.5) / scale - 0.5);
    for (let x = 0; x < w; x++) {
      const sx = Math.min(gray.width - 1, (x + 0.5) / scale - 0.5);
      if (nearest) { data[y * w + x] = gray.data[Math.round(sy) * gray.width + Math.round(sx)]!; continue; }
      const x0 = Math.floor(sx), y0 = Math.floor(sy);
      const x1 = Math.min(gray.width - 1, x0 + 1), y1 = Math.min(gray.height - 1, y0 + 1);
      const dx = sx - x0, dy = sy - y0;
      const top = gray.data[y0 * gray.width + x0]! * (1 - dx) + gray.data[y0 * gray.width + x1]! * dx;
      const bot = gray.data[y1 * gray.width + x0]! * (1 - dx) + gray.data[y1 * gray.width + x1]! * dx;
      data[y * w + x] = Math.round(top * (1 - dy) + bot * dy);
    }
  }
  return { width: w, height: h, data };
}
/** Jin-2023-style blind sharpen: push local maxima up / minima down, then keep two-tone bias. */
function blindSharpen(g: GrayImage, radius = 1, amount = 0.8): GrayImage {
  const { width, height, data } = g;
  const out = new Uint8Array(data.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let mx = 0, mn = 255;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      const yy = Math.min(height - 1, Math.max(0, y + dy)), xx = Math.min(width - 1, Math.max(0, x + dx));
      const v = data[yy * width + xx]!; if (v > mx) mx = v; if (v < mn) mn = v;
    }
    const v = data[y * width + x]!;
    const mid = (mx + mn) / 2;
    const target = v >= mid ? mx : mn;
    out[y * width + x] = Math.max(0, Math.min(255, Math.round(v + (target - v) * amount)));
  }
  return { width, height, data: out };
}
const toRGBA = (g: GrayImage) => {
  const d = new Uint8ClampedArray(g.width * g.height * 4);
  for (let i = 0; i < g.data.length; i++) { d[i * 4] = g.data[i]!; d[i * 4 + 1] = g.data[i]!; d[i * 4 + 2] = g.data[i]!; d[i * 4 + 3] = 255; }
  return d;
};
const dec = (g: GrayImage) => (jsQR(toRGBA(g), g.width, g.height, { inversionAttempts: 'attemptBoth' }) ? 'Y' : 'n');

for (const name of FILES) {
  const img = await loadImage(readFileSync(join(dir, `${name}.jpg`)));
  const s = Math.min(1, SCAN_LIMITS.longSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0, w, h);
  const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0, 0, w, h).data) };
  const scan = autoScanDocument(rgba, { corners: undefined, pixelsPerMm: 8, clean: 'none' });
  const gray = toGrayscale(scan.image);
  const ppm = 8;
  const x0 = Math.max(0, Math.floor((qrArea.x - 8) * ppm)), y0 = Math.max(0, Math.floor((qrArea.y - 8) * ppm));
  const x1 = Math.min(gray.width, Math.ceil((qrArea.x + qrArea.width + 8) * ppm)), y1 = Math.min(gray.height, Math.ceil((qrArea.y + qrArea.height + 8) * ppm));
  const data = new Uint8Array((x1 - x0) * (y1 - y0));
  for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) data[(y - y0) * (x1 - x0) + (xx - x0)] = gray.data[y * gray.width + xx]!;
  const crop: GrayImage = { width: x1 - x0, height: y1 - y0, data };
  // also crop from RAW (no warp) using detector quad? raw crop needs QR location unknown; use whole-raw upscale variants too
  const rawGray = toGrayscale(rgba);
  const results: string[] = [];
  const push = (label: string, g: GrayImage) => results.push(`${label}=${dec(g)}`);
  push('crop_raw', crop);
  push('x2', resize(crop, 2)); push('x3', resize(crop, 3)); push('x4', resize(crop, 4));
  push('x2near', resize(crop, 2, true));
  push('x2+sharp', sharpen(resize(crop, 2), 0.9, 1, 2));
  push('x2+blind', blindSharpen(resize(crop, 2)));
  push('x3+blind', blindSharpen(resize(crop, 3)));
  push('x2+white', whiteDocumentFilter(resize(crop, 2)));
  push('x2+shadow', normalizeShadows(resize(crop, 2), { force: true, radiusFraction: 0.25 }));
  push('x2+sauvola', binarize(resize(crop, 2)));
  push('x3+sauvola', binarize(resize(crop, 3)));
  push('x2+shadow+sauvola', binarize(normalizeShadows(resize(crop, 2), { force: true, radiusFraction: 0.25 })));
  push('x2+blind+sauvola', binarize(blindSharpen(resize(crop, 2))));
  console.log(`${name} (${crop.width}x${crop.height}): ${results.join(' ')}`);
}
