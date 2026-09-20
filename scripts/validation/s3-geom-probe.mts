/* Audit: geometry/QR-consistency evidence for the isotropic-upscale (S3) rescue. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { isotropicUpscale, grayToPixelImage } from '../../src/scanner/documentScan';
import { normalizeShadows } from '../../src/scanner/shadowNormalization';
import { analyzePage } from '../../src/omr/analyzePage';
import { decodePageQr } from '../../src/omr/qrDecoder';
import { isolatePaper } from '../../src/omr/pageIsolation';
import { rotateGray90 } from '../../src/omr/orientation';
import { createPageQr, parsePageIdentity } from '../../src/form/pageIdentity';
import { detectAlignmentMarks } from '../../src/omr/alignmentDetector';
import { evaluateQrConsistency } from '../../src/omr/alignmentVerification';
import { fitHomography, fitSimilarity, inspectPageGeometry } from '../../src/omr/perspectiveCorrection';
import { toGrayscale } from '../../src/omr/imageQuality';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';
const name = process.argv[2]!;
const img = await loadImage(readFileSync(join('docs/TestGorselleri', `${name}.jpg`)));
const w = img.width, h = img.height;
const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0);
const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
const gray = toGrayscale(rgba);
const base = Math.min(3, Math.sqrt(9_000_000 / (w * h)));
for (const factor of [Math.round(base * 10) / 10, 2, 3]) {
  const up = isotropicUpscale(gray, factor);
  const cleaned = normalizeShadows(up, { force: true, radiusFraction: 0.08 });
  const r = await analyzePage(grayToPixelImage(cleaned), formDefinition);
  const tag = `x${factor.toFixed(1)}`;
  if (!r.ok) { console.log(`${tag}: ${r.code}`); continue; }
  // replay internals for evidence
  let isolated = isolatePaper(cleaned), decoded = decodePageQr(isolated.image), turns = 0;
  for (let q = 1; q < 4 && !decoded; q++) { const t = isolatePaper(rotateGray90(cleaned, q)); const d = decodePageQr(t.image); if (d) { isolated = t; decoded = d; turns = q; } }
  const identity = parsePageIdentity(decoded!.text, formDefinition);
  const page = formDefinition.pages.find(p => p.pageNumber === identity.pageNumber)!;
  const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
  const preds = [fitHomography(qr.innerCorners, decoded!.corners), fitSimilarity(qr.innerCorners, decoded!.corners)];
  const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
  const marks = detectAlignmentMarks(isolated.image, page.alignmentMarks, preds, qrCenter, () => {}, { mm: qr.innerCorners, px: decoded!.corners });
  const physical = page.alignmentMarks.map(m => ({ x: m.x + m.width / 2, y: m.y + m.height / 2 }));
  const tf = fitHomography(physical, marks!.map(m => m.center));
  const geom = inspectPageGeometry(tf, formDefinition.pageWidthMm, formDefinition.pageHeightMm, isolated.image, 4);
  const agree = evaluateQrConsistency(tf, qr.innerCorners, decoded!.corners, geom.pixelsPerMm);
  console.log(`${tag}: OK p${r.pageNumber} m=${r.items.filter(i => i.status !== 'blank').length} qrTurns=${turns} ppm=${geom.pixelsPerMm.toFixed(2)} agreeErr=${agree.agreement.errorPx.toFixed(1)}px lim=${agree.agreement.limitPx.toFixed(1)}px per=[${agree.agreement.perCornerPx.map(v => v.toFixed(1)).join(',')}]`);
  break;
}
