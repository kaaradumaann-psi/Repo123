/**
 * Diagnostic harness: runs the REAL analyzePage pipeline over the phone photos in
 * "Örnek Telefon Görüntüleri" exactly the way the browser scanner feeds it
 * (bounded to SCAN_LIMITS.longSide, RGBA pixels). Prints per-page summaries and
 * every item that did not come back 'blank' or 'reliable' so we can see where the
 * printed separator lines collide with the detector.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { analyzePage } from '../src/omr/analyzePage';
import { formDefinition } from '../src/omr/formDefinition';
import type { PixelImage } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';

async function loadPhoto(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const scale = Math.min(1, SCAN_LIMITS.longSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  const data = context.getImageData(0, 0, width, height).data;
  return { width, height, data: new Uint8ClampedArray(data) };
}

const dir = process.argv[2] ?? 'Örnek Telefon Görüntüleri';
const only = process.argv.slice(3);
const names = readdirSync(dir).filter(name => name.endsWith('.jpg') && (!only.length || only.includes(name))).sort();
for (const name of names) {
  const photo = await loadPhoto(join(dir, name));
  const started = Date.now();
  const result = await analyzePage(photo, formDefinition);
  const ms = Date.now() - started;
  if (!result.ok) {
    console.log(`\n== ${name} :: FAIL ${result.code}: ${result.message} (${ms} ms)`);
    continue;
  }
  const counts: Record<string, number> = {};
  for (const item of result.items) counts[item.status] = (counts[item.status] ?? 0) + 1;
  const odd = result.items.filter(item => item.status !== 'blank');
  console.log(`\n== ${name} :: page ${result.pageNumber} ok=${result.ok} ${ms} ms status=${JSON.stringify(counts)} warnings=${result.warnings.length}`);
  for (const item of odd) {
    console.log(`   #${String(item.itemNumber).padStart(3)} ${item.status.padEnd(9)} choice=${item.choiceId ?? '-'} conf=${item.confidence.toFixed(2)} :: ${item.reason}`);
  }
}
