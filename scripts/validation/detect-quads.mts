import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { detectDocumentQuad } from '../../src/scanner/documentDetection';
import { toGrayscale } from '../../src/omr/imageQuality';
import type { PixelImage } from '../../src/omr/omrTypes';
import { writeFileSync } from 'node:fs';

const dir = 'docs/TestGorselleri';
const names = readdirSync(dir).filter(n => /\.jpe?g$/i.test(n)).sort();
for (const n of names) {
  const img = await loadImage(readFileSync(join(dir, n)));
  const c = createCanvas(img.width, img.height); const x = c.getContext('2d');
  x.drawImage(img as any, 0, 0);
  const rgba: PixelImage = { width: img.width, height: img.height, data: new Uint8ClampedArray(x.getImageData(0, 0, img.width, img.height).data) };
  const gray = toGrayscale(rgba);
  const t0 = Date.now();
  const quad = detectDocumentQuad(gray);
  const ms = Date.now() - t0;
  if (!quad) { console.log(`${n}\tNO-QUAD (${ms}ms)`); continue; }
  console.log(`${n}\tcov=${quad.coverage.toFixed(2)} rect=${quad.rectangularity.toFixed(3)} asp=${quad.aspect.toFixed(2)} ink=${quad.inkCoverage.toFixed(2)} sup=${quad.edgeSupport.toFixed(2)} score=${quad.score.toFixed(3)} ${ms}ms  ${quad.corners.map(p=>`(${p.x|0},${p.y|0})`).join(' ')}`);
  x.strokeStyle = '#ff0066'; x.lineWidth = Math.max(3, img.width / 200); x.beginPath();
  quad.corners.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)); x.closePath(); x.stroke();
  const labels = ['TL','TR','BR','BL'];
  x.fillStyle = '#00ccff'; x.font = `${Math.round(img.width/18)}px sans-serif`;
  quad.corners.forEach((p,i)=>{ x.beginPath(); x.arc(p.x,p.y,img.width/60,0,7); x.fill(); x.fillText(labels[i]!, p.x+10, p.y-10); });
  writeFileSync(`scripts/validation/scan-out/${n.replace(/\.jpe?g$/i,'')}-quad.jpg`, c.toBuffer('image/jpeg'));
}
