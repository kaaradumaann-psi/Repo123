/**
 * AŞAMA 3 ölçümü — sentetik geometri kontrollü sayfa dörtgenleri üzerinde
 * `detectPageBox()` davranışını ölçer (gerçek fotoğraf repoda yok — AŞAMA 1 kaydı).
 *
 * Ürün kodunu DEĞİŞTİRMEZ; yalnızca mevcut dışa aktarımları çağırır.
 *
 * Senaryolarda gerçek sayfa köşeleri (TL/TR/BR/BL) konstrüksiyon gereği bilinir.
 * detectPageBox'un döndürdüğü kutu ile karşılaştırılır:
 *   - tespit var/yok
 *   - köşe hatası (her gerçek köşe ↔ en yakın tespit köşesi, px)
 *   - piksel IoU (gerçek dörtgen maskesi vs tespit dikdörtgeni)
 */
import { detectPageBox, pageBoxCorners } from '../../src/scanner/cameraAdvisor';
import type { GrayImage, Point } from '../../src/omr/omrTypes';

const FRAME_W = 960;
const FRAME_H = 720;

type Scenario = { name: string; corners: [Point, Point, Point, Point] };

/** A4 oranı: h = w * 297/210 */
function a4Height(w: number) { return (w * 297) / 210; }

function centeredAxisAligned(pageW: number): [Point, Point, Point, Point] {
  const h = a4Height(pageW);
  const x0 = (FRAME_W - pageW) / 2, y0 = (FRAME_H - h) / 2;
  return [
    { x: x0, y: y0 }, { x: x0 + pageW, y: y0 },
    { x: x0 + pageW, y: y0 + h }, { x: x0, y: y0 + h },
  ];
}

function rotate(corners: Point[], deg: number): [Point, Point, Point, Point] {
  const cx = FRAME_W / 2, cy = FRAME_H / 2;
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return corners.map(p => ({
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  })) as [Point, Point, Point, Point];
}

/** Trapez: üst kenar daralt + yatay kaydır (telefonu eğik tutma etkisi) */
function perspective(pageW: number, topScale: number, shiftX: number): [Point, Point, Point, Point] {
  const [tl, tr, br, bl] = centeredAxisAligned(pageW);
  const cx = FRAME_W / 2;
  const squeeze = (p: Point) => ({ x: cx + (p.x - cx) * topScale + shiftX, y: p.y });
  return [squeeze(tl), squeeze(tr), br, bl];
}

function fillQuad(image: GrayImage, corners: Point[], value: number) {
  // Konveks dörtgen için scanline doldurma
  const ys = corners.map(p => p.y);
  const minY = Math.max(0, Math.floor(Math.min(...ys)));
  const maxY = Math.min(image.height - 1, Math.ceil(Math.max(...ys)));
  const edges: [Point, Point][] = [[corners[0]!, corners[1]!], [corners[1]!, corners[2]!], [corners[2]!, corners[3]!], [corners[3]!, corners[0]!]];
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    for (const [a, b] of edges) {
      if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
        xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
      }
    }
    xs.sort((m, n) => m - n);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const x0 = Math.max(0, Math.round(xs[i]!)), x1 = Math.min(image.width - 1, Math.round(xs[i + 1]!));
      for (let x = x0; x <= x1; x++) image.data[y * image.width + x] = value;
    }
  }
}

function maskRect(image: GrayImage, corners: Point[], value: number) {
  const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
  fillQuad(image, [
    { x: Math.min(...xs), y: Math.min(...ys) }, { x: Math.max(...xs), y: Math.min(...ys) },
    { x: Math.max(...xs), y: Math.max(...ys) }, { x: Math.min(...xs), y: Math.max(...ys) },
  ], value);
}

function iou(maskA: Uint8Array, maskB: Uint8Array): number {
  let inter = 0, union = 0;
  for (let i = 0; i < maskA.length; i++) {
    const a = maskA[i]! > 127, b = maskB[i]! > 127;
    if (a && b) inter++;
    if (a || b) union++;
  }
  return union ? inter / union : 0;
}

const scenarios: Scenario[] = [
  { name: 'S0 axis-aligned (kontrol)', corners: centeredAxisAligned(430) },
  { name: 'S1 rotated 8°', corners: rotate(centeredAxisAligned(430), 8) },
  { name: 'S2 rotated 25°', corners: rotate(centeredAxisAligned(430), 25) },
  { name: 'S3 rotated 35°', corners: rotate(centeredAxisAligned(430), 35) },
  { name: 'S4 rotated 45°', corners: rotate(centeredAxisAligned(430), 45) },
  { name: 'S5 hafif perspektif (üst %80, +30px)', corners: perspective(430, 0.8, 30) },
  { name: 'S6 güçlü perspektif (üst %55, +80px)', corners: perspective(430, 0.55, 80) },
];

console.log(`Kare: ${FRAME_W}x${FRAME_H} | parlak sayfa=248, zemin=60 | Sayfa A4 (430 x ${a4Height(430).toFixed(0)})\n`);
console.log('| Senaryo | Tespit | IoU | Ort. köşe hatası (px) | Max köşe hatası (px) | Doğru şekil mi? |');
console.log('|---|---|---|---|---|---|');

for (const scenario of scenarios) {
  const image: GrayImage = { width: FRAME_W, height: FRAME_H, data: new Uint8Array(FRAME_W * FRAME_H).fill(60) };
  fillQuad(image, scenario.corners, 248);

  const box = detectPageBox(image);
  if (!box) {
    console.log(`| ${scenario.name} | ❌ YOK ("no-page") | — | — | — | — |`);
    continue;
  }
  const detected = pageBoxCorners(box);

  // Gerçek dörtgen maskesi vs tespit dikdörtgeni maskesi
  const trueMask: GrayImage = { width: FRAME_W, height: FRAME_H, data: new Uint8Array(FRAME_W * FRAME_H) };
  fillQuad(trueMask, scenario.corners, 255);
  const detMask: GrayImage = { width: FRAME_W, height: FRAME_H, data: new Uint8Array(FRAME_W * FRAME_H) };
  maskRect(detMask, detected, 255);
  const overlap = iou(trueMask.data, detMask.data);

  // Köşe hatası: her gerçek köşe için en yakın tespit köşesi mesafesi
  const errors = scenario.corners.map(trueCorner =>
    Math.min(...detected.map(d => Math.hypot(d.x - trueCorner.x, d.y - trueCorner.y))));
  const meanErr = errors.reduce((a, b) => a + b, 0) / errors.length;
  const maxErr = Math.max(...errors);

  // Tespit edilen şekil dikdörtgen dışında bir şey olabilir mi?
  const isRect = Math.abs(detected[0]!.y - detected[1]!.y) < 1e-9 && Math.abs(detected[2]!.y - detected[3]!.y) < 1e-9;
  console.log(`| ${scenario.name} | ✅ box | ${overlap.toFixed(3)} | ${meanErr.toFixed(1)} | ${maxErr.toFixed(1)} | axis-aligned dikdörtgen: ${isRect ? 'EVET (her zaman)' : 'HAYIR'} |`);
}
