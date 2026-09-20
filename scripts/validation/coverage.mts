import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { detectDocumentQuad } from '../../src/scanner/documentDetection';
import { toGrayscale } from '../../src/omr/imageQuality';
import type { PixelImage } from '../../src/omr/omrTypes';
const dir = 'docs/TestGorselleri';
for (const n of readdirSync(dir).filter(n => /\.jpe?g$/i.test(n)).sort()) {
  const img = await loadImage(readFileSync(join(dir, n)));
  const w = img.width, h = img.height;
  const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0);
  const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
  const q = detectDocumentQuad(toGrayscale(rgba));
  if (!q) { console.log(`${n}\tnoquad`); continue; }
  const cs = q.corners;
  let area = 0;
  for (let i = 0; i < 4; i++) { const a = cs[i]!, b = cs[(i+1)%4]!; area += a.x*b.y - b.x*a.y; }
  area = Math.abs(area)/2;
  const ratio = area/(w*h);
  const ang = (p: {x:number,y:number}, r: {x:number,y:number}) => Math.abs(Math.atan2(r.y-p.y, r.x-p.x));
  const e0 = ang(cs[0]!, cs[1]!) * 180/Math.PI, e1 = ang(cs[1]!, cs[2]!) * 180/Math.PI;
  const axH = Math.min(e0, 180-e0), axV = Math.min(Math.abs(90-e1), 90-Math.abs(90-e1));
  console.log(`${n}\tratio=${ratio.toFixed(3)} tiltH=${axH.toFixed(1)} tiltV=${axV.toFixed(1)}`);
}
