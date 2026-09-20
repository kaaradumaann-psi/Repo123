import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { autoScanDocument } from '../../src/scanner/documentScan';
import type { PixelImage } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';
const dir = 'docs/TestGorselleri';
for (const n of readdirSync(dir).filter(n => /\.jpe?g$/i.test(n)).sort()) {
  const img = await loadImage(readFileSync(join(dir, n)));
  const s = Math.min(1, SCAN_LIMITS.longSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0, w, h);
  const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
  const r = autoScanDocument(rgba);
  console.log(`${n}\traw=${img.width}x${img.height}\tin=${w}x${h}\tquad=${r.quad?'Y':'N'}\twarp=${r.warped?'Y':'N'}\tppm=${r.pixelsPerMm.toFixed(1)}\tout=${r.image.width}x${r.image.height}\tstages=${r.stages.join(',')}`);
}
