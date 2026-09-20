/* Audit-only diagnostics: replays analyzePage internals on the failing captures. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { autoScanDocument, cleanDocument, whiteDocumentFilter, sharpen } from '../../src/scanner/documentScan';
import { normalizeShadows } from '../../src/scanner/shadowNormalization';
import { binarize } from '../../src/scanner/enhancement';
import { formDefinition } from '../../src/omr/formDefinition';
import { createPageQr, parsePageIdentity } from '../../src/form/pageIdentity';
import { decodePageQr } from '../../src/omr/qrDecoder';
import { isolatePaper } from '../../src/omr/pageIsolation';
import { detectAlignmentMarks } from '../../src/omr/alignmentDetector';
import { evaluateQrConsistency } from '../../src/omr/alignmentVerification';
import { fitHomography, fitSimilarity, inspectPageGeometry, inspectFeatureContainment } from '../../src/omr/perspectiveCorrection';
import { toGrayscale } from '../../src/omr/imageQuality';
import { analyzePage } from '../../src/omr/analyzePage';
import { rotateGray90, quarterTurnsToUpright } from '../../src/omr/orientation';
import type { GrayImage, PixelImage } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';

const dir = 'docs/TestGorselleri';
const FILES = process.argv.slice(2);
const CONFIGS: { id: string; ppm?: number; clean: 'full' | 'shadow' | 'none' }[] = [
  { id: 'S0full', clean: 'full' },
  { id: 'S1shadow8', ppm: 8, clean: 'shadow' },
  { id: 'S1none8', ppm: 8, clean: 'none' },
  { id: 'X12shadow', ppm: 12, clean: 'shadow' },
  { id: 'X12none', ppm: 12, clean: 'none' },
];

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
const toRGBA = (g: GrayImage) => {
  const d = new Uint8ClampedArray(g.width * g.height * 4);
  for (let i = 0; i < g.data.length; i++) { d[i * 4] = g.data[i]!; d[i * 4 + 1] = g.data[i]!; d[i * 4 + 2] = g.data[i]!; d[i * 4 + 3] = 255; }
  return d;
};
const tryJsQr = (g: GrayImage) => jsQR(toRGBA(g), g.width, g.height, { inversionAttempts: 'attemptBoth' });

function claheLite(g: GrayImage): GrayImage {
  const hist = new Uint32Array(256);
  for (const v of g.data) hist[v]!++;
  const cdf = new Float64Array(256); let acc = 0;
  for (let i = 0; i < 256; i++) { acc += hist[i]!; cdf[i] = acc; }
  const n = g.data.length; const data = new Uint8Array(n);
  for (let i = 0; i < n; i++) data[i] = Math.round((cdf[g.data[i]!]! / n) * 255);
  return { ...g, data };
}

for (const name of FILES) {
  const img = await loadImage(readFileSync(join(dir, `${name}.jpg`)));
  const s = Math.min(1, SCAN_LIMITS.longSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0, w, h);
  const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0, 0, w, h).data) };
  console.log(`\n=== ${name} (${w}x${h})`);
  let qrCrop: GrayImage | null = null;
  for (const cfg of CONFIGS) {
    const scan = autoScanDocument(rgba, { pixelsPerMm: cfg.ppm, clean: cfg.clean });
    const gray = toGrayscale(scan.image);
    // orientation + QR, exactly like analyzePage
    let isolated = isolatePaper(gray), decoded = decodePageQr(isolated.image), turns = 0;
    for (let q = 1; q < 4 && !decoded; q++) {
      const trial = isolatePaper(rotateGray90(gray, q));
      const cand = decodePageQr(trial.image);
      if (cand) { isolated = trial; decoded = cand; turns = q; }
    }
    const direct = await analyzePage(scan.image, formDefinition);
    const line = [`[${cfg.id}] warp=${scan.warped ? 'Y' : 'N'} ppm=${scan.pixelsPerMm} analyzePage=${direct.ok ? 'OK' : direct.code}`];
    if (!decoded) { line.push('QR=UNREADABLE'); console.log(line.join(' ')); continue; }
    line.push(`QR=ok turns=${turns}`);
    let identity;
    try { identity = parsePageIdentity(decoded.text, formDefinition); }
    catch { line.push('IDENTITY=MISMATCH'); console.log(line.join(' ')); continue; }
    line.push(`page=${identity.pageNumber}`);
    const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
    const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
    const source = isolated.image;
    let predictions;
    try { predictions = [fitHomography(qr.innerCorners, decoded.corners), fitSimilarity(qr.innerCorners, decoded.corners)]; }
    catch { line.push('PRED=throw'); console.log(line.join(' ')); continue; }
    const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
    const failures: string[] = [];
    let markers = null;
    try {
      markers = detectAlignmentMarks(source, page.alignmentMarks, predictions, qrCenter,
        e => failures.push(`${e.markId}:${e.reason}`), { mm: qr.innerCorners, px: decoded.corners });
    } catch (e) { line.push(`MARKS=throw(${(e as Error).message})`); }
    if (!markers) { line.push(`MARKS=MISSING {${failures.join(' | ')}}`); console.log(line.join(' ')); continue; }
    line.push('MARKS=ok');
    const physical = page.alignmentMarks.map(m => ({ x: m.x + m.width / 2, y: m.y + m.height / 2 }));
    let transform;
    try { transform = fitHomography(physical, markers.map(m => m.center)); }
    catch { line.push('TFIT=throw'); console.log(line.join(' ')); continue; }
    try {
      const rects = [...page.alignmentMarks, page.qrArea, ...page.items.flatMap(i => i.responseAreas)];
      const inset = Math.min(...rects.flatMap(r => [r.x, r.y, formDefinition.pageWidthMm - (r.x + r.width), formDefinition.pageHeightMm - (r.y + r.height)]));
      const tol = Math.max(2, Math.min(6, inset / 2));
      const geometry = inspectPageGeometry(transform, formDefinition.pageWidthMm, formDefinition.pageHeightMm, source, tol);
      line.push(`geom_ppm=${geometry.pixelsPerMm.toFixed(2)} overshoot=${geometry.cropOvershootMm?.toFixed(1)}`);
      const containment = inspectFeatureContainment(transform, [...page.alignmentMarks, { ...page.qrArea, id: 'qr' }], source, geometry.pixelsPerMm);
      line.push(`margin=${containment.minMarginMm.toFixed(1)}mm`);
      const agreement = evaluateQrConsistency(transform, qr.innerCorners, decoded.corners, geometry.pixelsPerMm);
      line.push(`agree err=${agreement.agreement.errorPx.toFixed(1)}px lim=${agreement.agreement.limitPx.toFixed(1)}px per=[${agreement.agreement.perCornerPx.map(v => v.toFixed(0)).join(',')}] ${agreement.ok ? 'OK' : '=>INVALID_GEOMETRY'}`);
    } catch (e) { line.push(`GEOM=throw(${(e as Error).message})`); }
    console.log(line.join(' '));
    if (cfg.id === 'S1shadow8' && !qrCrop) {
      // canonical mm→px is identity*ppm on warped output; crop the QR area for variant experiments
      const ppm = 8;
      const a = qr.area;
      const x0 = Math.max(0, Math.floor((a.x - 6) * ppm)), y0 = Math.max(0, Math.floor((a.y - 6) * ppm));
      const x1 = Math.min(gray.width, Math.ceil((a.x + a.width + 6) * ppm)), y1 = Math.min(gray.height, Math.ceil((a.y + a.height + 6) * ppm));
      const data = new Uint8Array((x1 - x0) * (y1 - y0));
      for (let y = y0; y < y1; y++) for (let xx = x0; xx < x1; xx++) data[(y - y0) * (x1 - x0) + (xx - x0)] = gray.data[y * gray.width + xx]!;
      qrCrop = { width: x1 - x0, height: y1 - y0, data };
    }
  }
  if (qrCrop) {
    const variants: [string, GrayImage][] = [
      ['raw', qrCrop],
      ['x2bil', resize(qrCrop, 2)],
      ['x3bil', resize(qrCrop, 3)],
      ['x2near', resize(qrCrop, 2, true)],
      ['x2+unsharp', sharpen(resize(qrCrop, 2), 0.9, 1, 2)],
      ['x2+white', whiteDocumentFilter(resize(qrCrop, 2))],
      ['x2+shadow', normalizeShadows(resize(qrCrop, 2), { force: true, radiusFraction: 0.2 })],
      ['x2+sauvola', binarize(resize(qrCrop, 2))],
      ['x2+clahe', claheLite(resize(qrCrop, 2))],
      ['x2+contrast', cleanDocument(resize(qrCrop, 2)).image],
    ];
    const res = variants.map(([label, g]) => `${label}=${tryJsQr(g) ? 'Y' : 'n'}`).join(' ');
    console.log(`  QR-VARIANTS(${qrCrop.width}x${qrCrop.height}): ${res}`);
  }
}
