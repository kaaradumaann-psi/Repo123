import type { AlignmentMark, GrayImage, Point } from './omrTypes';
import { mapPoint } from './perspectiveCorrection';
import type { Homography } from './perspectiveCorrection';

export type DetectedAlignmentMark = { id: string; center: Point; area: number; fill: number; predictionError: number };

type Candidate = DetectedAlignmentMark & { cost: number };

/**
 * Locates one printed square for one predicted transform; never substitutes a predicted centre.
 * Returns null when the transform mispredicts or no real square satisfies every filter.
 */
function locateMark(image: GrayImage, mark: AlignmentMark, prediction: Homography, qrCenter: Point) {
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
  if (!Number.isFinite(scale) || scale < 1.5 || scale > 30) return null;
  // Any prediction is least certain far from the small symbol. Search remains capped at 1 MP/mark.
  const distanceMm = Math.hypot(mmCenter.x - qrCenter.x, mmCenter.y - qrCenter.y);
  const radius = Math.min(500, Math.ceil(scale * (8 + distanceMm * .09)));
  const left = Math.max(0, Math.floor(predicted.x - radius)), top = Math.max(0, Math.floor(predicted.y - radius));
  const right = Math.min(image.width - 1, Math.ceil(predicted.x + radius)), bottom = Math.min(image.height - 1, Math.ceil(predicted.y + radius));
  const width = right - left + 1, height = bottom - top + 1;
  if (width < 5 || height < 5) return null;
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
    if (count < area * .5 || count > area * 1.8 || fill < .43 || minX === 0 || minY === 0 || maxX === width - 1 || maxY === height - 1) continue;
    const cx = sumX / count, cy = sumY / count;
    const vx = sumXX / count - cx * cx, vy = sumYY / count - cy * cy, covariance = sumXY / count - cx * cy;
    const spread = Math.hypot(vx - vy, 2 * covariance);
    if (vx + vy - spread <= 0 || (vx + vy + spread) / (vx + vy - spread) > 4.5) continue;
    const center = { x: left + cx, y: top + cy };
    const predictionError = Math.hypot(center.x - predicted.x, center.y - predicted.y);
    if (predictionError > radius * .9) continue;
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
    if (squareFill < .84) continue;
    let solid = 0, checked = 0;
    for (let sy = -2; sy <= 2; sy++) for (let sx = -2; sx <= 2; sx++) {
      const probe = mapPoint(prediction, { x: mmCenter.x + sx * mark.width * .1, y: mmCenter.y + sy * mark.height * .1 });
      const x = Math.round(center.x + probe.x - predicted.x), y = Math.round(center.y + probe.y - predicted.y);
      if (x >= 0 && y >= 0 && x < image.width && y < image.height && image.data[y * image.width + x]! <= threshold) solid++;
      checked++;
    }
    if (solid / checked < .92) continue;
    candidates.push({ id: mark.id, center, area: count, fill, predictionError,
      cost: predictionError / radius + Math.abs(Math.log(count / area)) * .3 });
  }
  candidates.sort((a, b) => a.cost - b.cost);
  const best = candidates[0];
  if (!best || (candidates[1] && candidates[1].cost - best.cost < .12)) return null;
  const { cost: _cost, ...measurement } = best;
  return measurement;
}

/**
 * Detects real dark connected components near predicted positions; never substitutes a prediction.
 * Predictions are tried in order because each is wrong in a different way: a projective fit to the
 * four QR corners tracks genuine perspective but amplifies sub-pixel noise on rotated sheets, while
 * a similarity fit is stable under rotation and drifts under strong perspective. A mark counts as
 * found only when one prediction passes every filter above.
 */
export function detectAlignmentMarks(image: GrayImage, marks: readonly AlignmentMark[],
  predictions: readonly Homography[], qrCenter: Point): DetectedAlignmentMark[] | null {
  if (marks.length !== 4 || predictions.length < 1) return null;
  const detected: DetectedAlignmentMark[] = [];
  for (const mark of marks) {
    let found: DetectedAlignmentMark | null = null, lastError: unknown;
    for (const prediction of predictions) {
      try { found = locateMark(image, mark, prediction, qrCenter); }
      catch (error) { lastError = error; }
      if (found) break;
    }
    // A throwing prediction keeps its original meaning when nothing else locates the square.
    if (!found) { if (lastError !== undefined) throw lastError; return null; }
    if (detected.some(previous => Math.hypot(previous.center.x - found!.center.x, previous.center.y - found!.center.y) < Math.sqrt(found!.area))) {
      return null;
    }
    detected.push(found);
  }
  return detected;
}
