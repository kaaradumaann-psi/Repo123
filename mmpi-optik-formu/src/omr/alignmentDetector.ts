import type { AlignmentMark, GrayImage, Point } from './omrTypes';
import { mapPoint } from './perspectiveCorrection';
import type { Homography } from './perspectiveCorrection';

export type DetectedAlignmentMark = { id: string; center: Point; area: number; fill: number; predictionError: number };

/** One failed attempt, in words a person can act on. */
export type AlignmentFailure = { markId: string; reason: string };

type Candidate = DetectedAlignmentMark & { cost: number };
type LocateResult = { ok: true; mark: DetectedAlignmentMark } | { ok: false; reason: string };

/**
 * Locates one printed square for one predicted transform; never substitutes a predicted centre.
 * Every rejection path reports why, so a real capture can be diagnosed instead of guessed at.
 */
function locateMark(image: GrayImage, mark: AlignmentMark, prediction: Homography, qrCenter: Point): LocateResult {
  const mmCenter = { x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 };
  const predicted = mapPoint(prediction, mmCenter);
  const corners = [
    { x: mark.x, y: mark.y }, { x: mark.x + mark.width, y: mark.y },
    { x: mark.x + mark.width, y: mark.y + mark.height }, { x: mark.x, y: mark.y + mark.height },
  ].map(p => mapPoint(prediction, p));
  const area = Math.abs(corners.reduce((sum, p, i) => {
    const next = corners[(i + 1) % 4]!;
    return sum + p.x * next.y - p.y * next.x;
  }, 0)) / 2;
  const scale = Math.sqrt(area / (mark.width * mark.height));
  if (!Number.isFinite(scale) || scale < 1.5 || scale > 30) {
    return { ok: false, reason: `kare görüntüde beklenen boyutta değil (ölçek ${scale.toFixed(1)})` };
  }
  // Any prediction is least certain far from the small symbol. Search remains capped at 1 MP/mark.
  const distanceMm = Math.hypot(mmCenter.x - qrCenter.x, mmCenter.y - qrCenter.y);
  const radius = Math.min(500, Math.ceil(scale * (8 + distanceMm * .09)));
  const left = Math.max(0, Math.floor(predicted.x - radius)), top = Math.max(0, Math.floor(predicted.y - radius));
  const right = Math.min(image.width - 1, Math.ceil(predicted.x + radius)), bottom = Math.min(image.height - 1, Math.ceil(predicted.y + radius));
  const width = right - left + 1, height = bottom - top + 1;
  if (width < 5 || height < 5) return { ok: false, reason: 'karenin bulunması gereken alan görüntünün dışında' };
  const histogram = new Uint32Array(256);
  let samples = 0;
  for (let y = top; y <= bottom; y += 4) for (let x = left; x <= right; x += 4) {
    const value = image.data[y * image.width + x]!;
    histogram[value] = histogram[value]! + 1;
    samples++;
  }
  let background = 255, cumulative = 0;
  for (let value = 0; value < 256; value++) {
    cumulative += histogram[value]!;
    if (cumulative >= samples * .85) { background = value; break; }
  }
  const threshold = Math.max(20, background * .55);
  const visited = new Uint8Array(width * height), queue = new Int32Array(width * height);
  const candidates: Candidate[] = [];
  const rejected = { size: 0, shape: 0, square: 0, solid: 0, distance: 0 };
  for (let start = 0; start < visited.length; start++) {
    if (visited[start]) continue;
    visited[start] = 1;
    const startX = start % width, startY = Math.floor(start / width);
    if (image.data[(top + startY) * image.width + left + startX]! > threshold) continue;
    let read = 0, count = 1, sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    queue[0] = start;
    while (read < count) {
      const at = queue[read++]!, x = at % width, y = Math.floor(at / width);
      sumX += x; sumY += y; sumXX += x * x; sumYY += y * y; sumXY += x * y;
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy, next = ny * width + nx;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height || visited[next]) continue;
        visited[next] = 1;
        if (image.data[(top + ny) * image.width + left + nx]! <= threshold) queue[count++] = next;
      }
    }
    const fill = count / ((maxX - minX + 1) * (maxY - minY + 1));
    const clipped = minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1;
    if (count < area * .5 || count > area * 1.8 || fill < .43 || clipped) { rejected.size++; continue; }
    const cx = sumX / count, cy = sumY / count;
    const vx = sumXX / count - cx * cx, vy = sumYY / count - cy * cy, covariance = sumXY / count - cx * cy;
    const spread = Math.hypot(vx - vy, 2 * covariance);
    if (vx + vy - spread <= 0 || (vx + vy + spread) / (vx + vy - spread) > 4.5) { rejected.shape++; continue; }
    const center = { x: left + cx, y: top + cy };
    const predictionError = Math.hypot(center.x - predicted.x, center.y - predicted.y);
    if (predictionError > radius * .9) { rejected.distance++; continue; }
    // Bounded observed-rectangle search: no prediction is certain enough to supply local edge angles.
    let squareFill = 0;
    for (let degrees = 0; degrees < 90; degrees += 2) {
      const angle = degrees * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
      let minU = Infinity, maxU = -Infinity, minV = Infinity, maxV = -Infinity;
      for (let i = 0; i < count; i++) {
        const at = queue[i]!, dx = at % width - cx, dy = Math.floor(at / width) - cy;
        const u = dx * cosine + dy * sine, v = dy * cosine - dx * sine;
        minU = Math.min(minU, u); maxU = Math.max(maxU, u);
        minV = Math.min(minV, v); maxV = Math.max(maxV, v);
      }
      const pixel = Math.abs(cosine) + Math.abs(sine);
      squareFill = Math.max(squareFill, count / ((maxU - minU + pixel) * (maxV - minV + pixel)));
    }
    if (squareFill < .84) { rejected.square++; continue; }
    let solid = 0, checked = 0;
    for (let sy = -2; sy <= 2; sy++) for (let sx = -2; sx <= 2; sx++) {
      const probe = mapPoint(prediction, { x: mmCenter.x + sx * mark.width * .1, y: mmCenter.y + sy * mark.height * .1 });
      const x = Math.round(center.x + probe.x - predicted.x), y = Math.round(center.y + probe.y - predicted.y);
      if (x >= 0 && y >= 0 && x < image.width && y < image.height && image.data[y * image.width + x]! <= threshold) solid++;
      checked++;
    }
    if (solid / checked < .92) { rejected.solid++; continue; }
    candidates.push({ id: mark.id, center, area: count, fill, predictionError,
      cost: predictionError / radius + Math.abs(Math.log(count / area)) * .3 });
  }
  candidates.sort((a, b) => a.cost - b.cost);
  const best = candidates[0];
  if (!best) {
    const found = rejected.size + rejected.shape + rejected.square + rejected.solid + rejected.distance;
    if (!found) return { ok: false, reason: 'beklenen konumda koyu bir alan yok (kare kadrajda değil, çok soluk veya gölge/parlama altında)' };
    const detail: string[] = [];
    if (rejected.size) detail.push(`${rejected.size} aday boyut veya dolgunluk ölçütünü geçmedi`);
    if (rejected.distance) detail.push(`${rejected.distance} aday tahmin edilen konuma çok uzaktı`);
    if (rejected.square) detail.push(`${rejected.square} aday kare biçiminde değildi`);
    if (rejected.solid) detail.push(`${rejected.solid} adayın içi yeterince dolu değildi`);
    if (rejected.shape) detail.push(`${rejected.shape} aday biçim ölçütünü geçmedi`);
    return { ok: false, reason: detail.join('; ') };
  }
  if (candidates[1] && candidates[1].cost - best.cost < .12) {
    return { ok: false, reason: 'birden çok benzer koyu alan var, doğru kare ayırt edilemedi' };
  }
  const { cost: _cost, ...measurement } = best;
  return { ok: true, mark: measurement };
}

/**
 * Detects real dark connected components near predicted positions; never substitutes a prediction.
 * Predictions are tried in order because each is wrong in a different way: a projective fit to the
 * four QR corners tracks genuine perspective but amplifies sub-pixel noise on rotated sheets, while
 * a similarity fit is stable under rotation and drifts under strong perspective. A mark counts as
 * found only when one prediction passes every filter above.
 */
export function detectAlignmentMarks(image: GrayImage, marks: readonly AlignmentMark[],
  predictions: readonly Homography[], qrCenter: Point,
  onFailure?: (failure: AlignmentFailure) => void): DetectedAlignmentMark[] | null {
  if (marks.length !== 4 || predictions.length < 1) return null;
  const detected: DetectedAlignmentMark[] = [];
  for (const mark of marks) {
    let found: DetectedAlignmentMark | null = null, lastError: unknown;
    const reasons: string[] = [];
    for (const prediction of predictions) {
      try {
        const result = locateMark(image, mark, prediction, qrCenter);
        if (result.ok) { found = result.mark; break; }
        reasons.push(result.reason);
      } catch (error) { lastError = error; }
    }
    // A throwing prediction keeps its original meaning when nothing else locates the square.
    if (!found) {
      if (lastError !== undefined && !reasons.length) throw lastError;
      onFailure?.({ markId: mark.id, reason: [...new Set(reasons)].join(' · ') || 'bulunamadı' });
      return null;
    }
    if (detected.some(previous => Math.hypot(previous.center.x - found!.center.x, previous.center.y - found!.center.y) < Math.sqrt(found!.area))) {
      onFailure?.({ markId: mark.id, reason: 'başka bir kareyle aynı konumda görünüyor' });
      return null;
    }
    detected.push(found);
  }
  return detected;
}

/** Turns detector failures into one actionable Turkish sentence. */
export function describeAlignmentFailures(failures: readonly AlignmentFailure[]): string {
  const base = 'Dört siyah hizalama karesi ayrı ayrı bulunamadı; sayfanın tamamı görünmeli.';
  if (!failures.length) return base;
  const labels: Record<string, string> = {
    'top-left': 'sol üst', 'top-right': 'sağ üst', 'bottom-left': 'sol alt', 'bottom-right': 'sağ alt',
  };
  const detail = failures.map(failure =>
    `${labels[failure.markId] ?? failure.markId} kare: ${failure.reason}`).join(' | ');
  return `${base} Bulunamayan ${failures.length} kare var — ${detail}. ` +
    'Kâğıdın dört köşesi de kadrajda olacak şekilde, gölgesiz ve sayfaya dik açıdan yeniden çekin.';
}
