import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { autoScanDocument } from '../../src/scanner/documentScan';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { PixelImage } from '../../src/omr/omrTypes';
const img = await loadImage(readFileSync('docs/TestGorselleri/c1.jpg'));
const w = img.width, h = img.height;
const c = createCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img as any, 0, 0);
const rgba: PixelImage = { width: w, height: h, data: new Uint8ClampedArray(x.getImageData(0,0,w,h).data) };
const scan = autoScanDocument(rgba, { clean: 'full' });
console.log('warped', scan.warped, scan.image.width, scan.image.height, scan.note);
const r = await analyzePage(scan.image, formDefinition);
console.log(r.ok ? 'OK' : `${r.code}: ${r.message}`);
// also raw baseline for comparison
const r2 = await analyzePage(rgba, formDefinition);
console.log('raw:', r2.ok ? `OK p${r2.pageNumber} m=${r2.items.filter(i=>i.status!=='blank').length}` : r2.code);
