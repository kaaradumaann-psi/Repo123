import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { isotropicUpscale } from '../../src/scanner/documentScan';
import { normalizeShadows } from '../../src/scanner/shadowNormalization';
import { decodePageQr } from '../../src/omr/qrDecoder';
import { isolatePaper } from '../../src/omr/pageIsolation';
import { toGrayscale } from '../../src/omr/imageQuality';
import { rotateGray90 } from '../../src/omr/orientation';
import type { PixelImage, GrayImage } from '../../src/omr/omrTypes';
const name = process.argv[2]!;
const img = await loadImage(readFileSync(join('docs/TestGorselleri', `${name}.jpg`)));
const w = img.width, h = img.height;
const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0);
const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
const raw = toGrayscale(rgba);
const tryDec = (g: GrayImage, label: string) => {
  let d = decodePageQr(isolatePaper(g).image), t = 0;
  for (let q = 1; q < 4 && !d; q++) { d = decodePageQr(isolatePaper(rotateGray90(g, q)).image); if (d) t = q; }
  console.log(`${label}: ${d ? `Y t${t} "${d.text.slice(0, 24)}"` : 'N'}`);
};
for (const f of [1, 1.5, 2, 2.7, 3]) {
  const u = f === 1 ? raw : isotropicUpscale(raw, f);
  tryDec(u, `x${f} none (${u.width}x${u.height})`);
  tryDec(normalizeShadows(u, { force: true, radiusFraction: 0.08 }), `x${f} shadow`);
}
