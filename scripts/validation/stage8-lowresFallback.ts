/**
 * FIX-3 doğrulaması — LOW_RESOLUTION'da manuel 4-köşe fallback zinciri.
 * Ürün kararı değişikliği tek koşul: (ALIGNMENT_MISSING || LOW_RESOLUTION) → ManuelCornerEditor.
 *
 * Adımlar (kullanıcının beklediği sıra):
 *  1. Otomatik akış …526 / …539'da LOW_RESOLUTION ile duruyor mu? (başarısızlık semantiği korunuyor)
 *  2. Genişletilmiş koşul bu kodlarda fallback açar mı? (ScannerWorkspace koşulu birebir kopya)
 *  3-4. Kullanıcı köşeleri belirledi → mevcut applyManualCorners (manualWarp→fitHomography→warpPerspective)
 *  5-6. Mevcut analyzePage warp çıktısını okuyor mu? (sayfa 2, 11 işaret — AŞAMA 4 referansı)
 */
import { readFileSync } from 'node:fs';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { applyManualCorners } from '../../src/scanner/manualWarp';
import { analyzePage } from '../../src/omr/analyzePage';
import { formDefinition } from '../../src/omr/formDefinition';
import type { GrayImage, PixelImage, Point } from '../../src/omr/omrTypes';

type Quad = [Point, Point, Point, Point];

async function loadPhotoRgba(path: string): Promise<PixelImage> {
  const image = await loadImage(readFileSync(path));
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image as unknown as CanvasImageSource, 0, 0);
  const { data } = ctx.getImageData(0, 0, image.width, image.height);
  return { width: image.width, height: image.height, data };
}

function grayToRgba(image: GrayImage): PixelImage {
  const data = new Uint8ClampedArray(image.width * image.height * 4);
  for (let i = 0; i < image.data.length; i++) {
    const v = image.data[i]!;
    const at = i * 4;
    data[at] = v; data[at + 1] = v; data[at + 2] = v; data[at + 3] = 255;
  }
  return { width: image.width, height: image.height, data };
}

/** ScannerWorkspace'teki genişletilmiş koşulun birebir kopyası (davranış kanıtı için). */
const opensManualFallback = (code: string) => code === 'ALIGNMENT_MISSING' || code === 'LOW_RESOLUTION';

// AŞAMA 4'te doğrulanmış, sayfaya yapışık köşeler (fiziksel TL/TR/BR/BL sırası)
const cases: { name: string; file: string; corners: Quad }[] = [
  {
    name: '…526', file: 'docs/TestGorselleri/5870507625873608526.jpg',
    corners: [{ x: 1210, y: 70 }, { x: 1230, y: 850 }, { x: 90, y: 890 }, { x: 70, y: 90 }],
  },
  {
    name: '…539', file: 'docs/TestGorselleri/5870507625873608539.jpg',
    corners: [{ x: 1279, y: 165 }, { x: 1279, y: 959 }, { x: 33, y: 956 }, { x: 0, y: 134 }],
  },
];

console.log('| Fotoğraf | 1) otomatik analyzePage | 2) fallback koşulu | 3-4) manualWarp | 5-6) manuel analyzePage |');
console.log('|---|---|---|---|---|');
for (const test of cases) {
  const rgba = await loadPhotoRgba(test.file);
  const auto = await analyzePage(rgba, formDefinition);
  const autoText = auto.ok ? `ok (beklenmeyen!)` : `❌ ${auto.code}`;
  const fallback = !auto.ok && opensManualFallback(auto.code);
  if (!fallback) {
    console.log(`| ${test.name} | ${autoText} | koşul AÇMAZ ❌ | — | — |`);
    continue;
  }
  const warped = applyManualCorners({ source: rgba, corners: test.corners, pageWidthMm: 210, pageHeightMm: 297 });
  const manual = await analyzePage(grayToRgba(warped.normalized), formDefinition);
  const marked = manual.ok ? manual.items.filter(i => i.status === 'reliable' || i.status === 'single').length : 0;
  console.log(`| ${test.name} | ${autoText} | fallback açılır ✅ | warped ${warped.normalized.width}×${warped.normalized.height} ✅ | ${manual.ok ? `✅ ok · sayfa ${manual.pageNumber} · ${marked} işaretli` : `❌ ${(manual as { code?: string }).code}`} |`);
}
