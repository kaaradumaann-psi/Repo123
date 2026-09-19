/** 5a.jpg'yi 270° döndürüp analyzePage'e ver: QR yönelim mi sorunu? */
import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';

const image = await loadImage(readFileSync('docs/TestGorselleri/5a.jpg'));
for (const deg of [0, 90, 180, 270]) {
  const w = deg % 180 === 0 ? image.width : image.height;
  const h = deg % 180 === 0 ? image.height : image.width;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(image as unknown as CanvasImageSource, -image.width / 2, -image.height / 2);
  const { data } = ctx.getImageData(0, 0, w, h);
  const rgba: PixelImage = { width: w, height: h, data };
  const read = await analyzePage(rgba, formDefinition);
  const marked = read.ok ? read.items.filter(i => i.status === 'reliable' || i.status === 'single').length : 0;
  console.log(`rot${deg}: ${read.ok ? `✅ ok sayfa=${read.pageNumber} işaretli=${marked}` : `❌ ${read.code} — ${read.message.slice(0, 70)}`}`);
}
