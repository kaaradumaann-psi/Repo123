import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { autoScanAndAnalyze } from '../../src/scanner/scanAndAnalyze';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';
import { SCAN_LIMITS } from '../../src/scanner/imageIO';

const dir = 'docs/TestGorselleri';
const only = process.argv.slice(2);
const names = readdirSync(dir).filter(n => /\.jpe?g$/i.test(n) && (!only.length || only.some(o => n.includes(o)))).sort();
for (const n of names) {
  const img = await loadImage(readFileSync(join(dir, n)));
  const s = Math.min(1, SCAN_LIMITS.longSide / Math.max(img.width, img.height));
  const w = Math.round(img.width * s), h = Math.round(img.height * s);
  const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0, w, h);
  const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
  const t0 = Date.now();
  const a = await autoScanAndAnalyze(rgba, formDefinition);
  const ms = Date.now() - t0;
  const att = a.attempts.map((t, i) => `S${i}=${t.ok ? 'OK' : t.code}`).join(' ');
  const final = a.result.ok ? `OK p${a.result.pageNumber} marked=${a.result.items.filter(i=>i.status!=='blank').length}` : `FAIL ${a.result.code}`;
  console.log(`${n}\t${att}\t=> ${final}\t(${ms}ms)`);
  const out = createCanvas(a.scan.image.width, a.scan.image.height);
  const oc = out.getContext('2d');
  const id = oc.createImageData(a.scan.image.width, a.scan.image.height);
  id.data.set(a.scan.image.data); oc.putImageData(id, 0, 0);
  writeFileSync(`scripts/validation/scan-out/${n.replace(/\.jpe?g$/i,'')}-final.jpg`, out.toBuffer('image/jpeg'));
}
