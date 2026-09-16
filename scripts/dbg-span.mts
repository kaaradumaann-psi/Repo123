import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { formDefinition } from '../src/omr/formDefinition';
import type { PixelImage } from '../src/omr/omrTypes';
import { SCAN_LIMITS } from '../src/scanner/imageIO';
import { toGrayscale } from '../src/omr/imageQuality';
import { isolatePaper } from '../src/omr/pageIsolation';
import { decodePageQr } from '../src/omr/qrDecoder';
import { parsePageIdentity, createPageQr } from '../src/form/pageIdentity';
import { detectAlignmentMarks } from '../src/omr/alignmentDetector';
import { fitHomography, fitSimilarity, mapPoint } from '../src/omr/perspectiveCorrection';
import type { Homography } from '../src/omr/perspectiveCorrection';

async function loadPhoto(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const scale = Math.min(1, SCAN_LIMITS.longSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff'; context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return { width, height, data: new Uint8ClampedArray(context.getImageData(0, 0, width, height).data) };
}
const photo = await loadPhoto(join('Örnek Telefon Görüntüleri', 'c4.jpg'));
const gray = toGrayscale(photo);
const iso = isolatePaper(gray);
const dec = decodePageQr(iso.image)!;
const identity = parsePageIdentity(dec.text, formDefinition);
const page = formDefinition.pages[0]!;
const qr = createPageQr(formDefinition, identity.batchId, identity.pageNumber);
const predictions = [fitHomography(qr.innerCorners, dec.corners), fitSimilarity(qr.innerCorners, dec.corners)];
const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
const markers = detectAlignmentMarks(iso.image, page.alignmentMarks, predictions, qrCenter, () => {}, { mm: qr.innerCorners, px: dec.corners })!;
const physicalCenters = page.alignmentMarks.map(mark => ({ x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 }));
const transform = fitHomography(physicalCenters, markers.map(m => m.center));
console.log('origin', iso.originX, iso.originY, 'iso size', iso.image.width, iso.image.height);
for (const n of [97, 107, 117]) {
  const item = page.items.find(c => c.itemNumber === n)!;
  const area = item.responseAreas[0]!;
  const c = { x: area.x + area.width / 2, y: area.y + area.height / 2 };
  const p = mapPoint(transform, c);
  console.log(`item ${n} D: mm(${c.x.toFixed(1)},${c.y.toFixed(1)}) -> photo(${(p.x + iso.originX).toFixed(0)},${(p.y + iso.originY).toFixed(0)})`);
}
// sanity: what photo y-range does block 3 D column span?
const a97 = page.items.find(c => c.itemNumber === 97)!.responseAreas[0]!;
const a144 = page.items.find(c => c.itemNumber === 144)!.responseAreas[0]!;
const p1 = mapPoint(transform, { x: a97.x + 1.75, y: a97.y + 1.75 });
const p2 = mapPoint(transform, { x: a144.x + 1.75, y: a144.y + 1.75 });
console.log('block3 D column photo span: y', p1.y.toFixed(0), '->', p2.y.toFixed(0), ' x', p1.x.toFixed(0), '->', p2.x.toFixed(0));
