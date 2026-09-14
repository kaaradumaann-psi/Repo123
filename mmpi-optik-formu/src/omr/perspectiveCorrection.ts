import type { GrayImage, Point } from './omrTypes';

/** Row-major matrix mapping physical millimetres to source pixel centres. */
export type Homography = [number, number, number, number, number, number, number, number, number];
export const CANONICAL_PIXELS_PER_MM = 8;
export const MAX_WARP_PIXELS = 8_000_000;

function multiply(a: Homography, b: Homography): Homography {
  return Array.from({ length: 9 }, (_, i) => {
    const row = Math.floor(i / 3), col = i % 3;
    return a[row * 3]! * b[col]! + a[row * 3 + 1]! * b[col + 3]! + a[row * 3 + 2]! * b[col + 6]!;
  }) as Homography;
}

function normalize(points: readonly Point[]) {
  if (points.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) throw new Error('Non-finite point');
  const x = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const y = points.reduce((sum, p) => sum + p.y, 0) / points.length;
  const rms = Math.sqrt(points.reduce((sum, p) => sum + (p.x - x) ** 2 + (p.y - y) ** 2, 0) / points.length);
  if (rms < 1e-8) throw new Error('Degenerate points');
  const scale = Math.SQRT2 / rms;
  return {
    points: points.map(p => ({ x: (p.x - x) * scale, y: (p.y - y) * scale })),
    matrix: [scale, 0, -x * scale, 0, scale, -y * scale, 0, 0, 1] as Homography,
    inverse: [1 / scale, 0, x, 0, 1 / scale, y, 0, 0, 1] as Homography,
  };
}

/** Four correspondences, normalized coordinates and partial-pivot elimination. Throws on degeneracy. */
export function fitHomography(from: readonly Point[], to: readonly Point[]): Homography {
  if (from.length !== 4 || to.length !== 4) throw new Error('Four correspondences required');
  const source = normalize(from), target = normalize(to);
  const rows: number[][] = [];
  source.points.forEach(({ x, y }, i) => {
    const { x: u, y: v } = target.points[i]!;
    rows.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    rows.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  });
  for (let col = 0; col < 8; col++) {
    let pivot = col;
    for (let row = col + 1; row < 8; row++) if (Math.abs(rows[row]![col]!) > Math.abs(rows[pivot]![col]!)) pivot = row;
    if (Math.abs(rows[pivot]![col]!) < 1e-9) throw new Error('Singular homography');
    [rows[col], rows[pivot]] = [rows[pivot]!, rows[col]!];
    const divisor = rows[col]![col]!;
    for (let j = col; j <= 8; j++) rows[col]![j] = rows[col]![j]! / divisor;
    for (let row = 0; row < 8; row++) {
      if (row === col) continue;
      const factor = rows[row]![col]!;
      for (let j = col; j <= 8; j++) rows[row]![j] = rows[row]![j]! - factor * rows[col]![j]!;
    }
  }
  const fitted = [...rows.map(row => row[8]!), 1] as Homography;
  const result = multiply(multiply(target.inverse, fitted), source.matrix);
  if (Math.abs(result[8]) < 1e-10) throw new Error('Projective horizon at origin');
  return result.map(value => value / result[8]) as Homography;
}

export function mapPoint(matrix: Homography, point: Point): Point {
  const [a, b, c, d, e, f, g, h, i] = matrix;
  const denominator = g * point.x + h * point.y + i;
  if (Math.abs(denominator) < 1e-10) throw new Error('Point on projective horizon');
  const mapped = { x: (a * point.x + b * point.y + c) / denominator, y: (d * point.x + e * point.y + f) / denominator };
  if (!Number.isFinite(mapped.x) || !Number.isFinite(mapped.y)) throw new Error('Non-finite projection');
  return mapped;
}

export function pageCorners(widthMm: number, heightMm: number): Point[] {
  return [{ x: 0, y: 0 }, { x: widthMm, y: 0 }, { x: widthMm, y: heightMm }, { x: 0, y: heightMm }];
}

/** Conservative provisional limits; rotations are allowed, reflections and strong foreshortening are not. */
export function inspectPageGeometry(matrix: Homography, widthMm: number, heightMm: number, image: { width: number; height: number }) {
  const sourceCorners = pageCorners(widthMm, heightMm).map(p => mapPoint(matrix, p));
  let minScale = Infinity, maxScale = 0, minDenominator = Infinity, maxDenominator = 0;
  for (let row = 0; row <= 4; row++) for (let col = 0; col <= 4; col++) {
    const x = col * widthMm / 4, y = row * heightMm / 4;
    const w = matrix[6] * x + matrix[7] * y + matrix[8];
    if (w <= 0) throw new Error('Projective horizon or reflection');
    minDenominator = Math.min(minDenominator, w);
    maxDenominator = Math.max(maxDenominator, w);
    const p = mapPoint(matrix, { x, y });
    const a = (matrix[0] - p.x * matrix[6]) / w, b = (matrix[1] - p.x * matrix[7]) / w;
    const c = (matrix[3] - p.y * matrix[6]) / w, d = (matrix[4] - p.y * matrix[7]) / w;
    const determinant = a * d - b * c;
    const trace = a * a + b * b + c * c + d * d;
    const discriminant = Math.sqrt(Math.max(0, trace * trace - 4 * determinant * determinant));
    const small = Math.sqrt(Math.max(0, (trace - discriminant) / 2));
    const large = Math.sqrt((trace + discriminant) / 2);
    if (determinant <= 0 || small < .01 || large / small > 2.1) throw new Error('Extreme perspective or reflection');
    minScale = Math.min(minScale, small);
    maxScale = Math.max(maxScale, large);
  }
  if (maxScale / minScale > 2.5 || minDenominator / maxDenominator < .45) throw new Error('Extreme perspective');
  // A subpixel margin accommodates raster-centre fitting, not a missing strip of paper.
  const cropped = sourceCorners.some(p => p.x < -1.5 || p.y < -1.5 || p.x > image.width + .5 || p.y > image.height + .5);
  return { sourceCorners, pixelsPerMm: minScale, maxPixelsPerMm: maxScale, cropped };
}

/** Bilinear inverse sampling: each canonical pixel centre is mapped into the source. No canvas. */
export function warpPerspective(source: GrayImage, physicalToSource: Homography, widthMm: number, heightMm: number,
  pixelsPerMm = CANONICAL_PIXELS_PER_MM): GrayImage {
  const width = Math.round(widthMm * pixelsPerMm), height = Math.round(heightMm * pixelsPerMm);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width * height > MAX_WARP_PIXELS ||
    !Number.isFinite(pixelsPerMm) || pixelsPerMm <= 0 || source.width < 1 || source.height < 1 ||
    !Number.isInteger(source.width) || !Number.isInteger(source.height) || source.data.length !== source.width * source.height ||
    physicalToSource.some(value => !Number.isFinite(value))) throw new Error('Invalid or oversized warp');
  const data = new Uint8Array(width * height);
  const [a, b, c, d, e, f, g, h, i] = physicalToSource;
  for (let y = 0; y < height; y++) {
    const mmY = (y + .5) / pixelsPerMm;
    for (let x = 0; x < width; x++) {
      const mmX = (x + .5) / pixelsPerMm, w = g * mmX + h * mmY + i;
      const sx = (a * mmX + b * mmY + c) / w, sy = (d * mmX + e * mmY + f) / w;
      if (!Number.isFinite(sx) || !Number.isFinite(sy) || sx < -.5 || sy < -.5 || sx > source.width - .5 || sy > source.height - .5) {
        data[y * width + x] = 255;
        continue;
      }
      const xx = Math.max(0, Math.min(source.width - 1, sx)), yy = Math.max(0, Math.min(source.height - 1, sy));
      const x0 = Math.floor(xx), y0 = Math.floor(yy), x1 = Math.min(x0 + 1, source.width - 1), y1 = Math.min(y0 + 1, source.height - 1);
      const dx = xx - x0, dy = yy - y0;
      const top = source.data[y0 * source.width + x0]! * (1 - dx) + source.data[y0 * source.width + x1]! * dx;
      const bottom = source.data[y1 * source.width + x0]! * (1 - dx) + source.data[y1 * source.width + x1]! * dx;
      data[y * width + x] = Math.round(top * (1 - dy) + bottom * dy);
    }
  }
  return { width, height, data };
}
