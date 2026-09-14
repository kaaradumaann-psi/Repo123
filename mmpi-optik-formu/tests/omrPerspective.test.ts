import assert from 'node:assert/strict';
import test from 'node:test';
import { fitHomography, inspectPageGeometry, mapPoint, pageCorners, warpPerspective } from '../src/omr/perspectiveCorrection';
import type { Homography } from '../src/omr/perspectiveCorrection';

test('synthetic homography recovers known projective mapping, including unseen interior points', () => {
  const known: Homography = [5.9, -.45, 90, .35, 6.2, 52, .00038, -.00021, 1];
  const source = [{ x: 12.5, y: 12.5 }, { x: 197.5, y: 12.5 }, { x: 197.5, y: 284.5 }, { x: 12.5, y: 284.5 }];
  const fitted = fitHomography(source, source.map(point => mapPoint(known, point)));
  for (const point of [...source, { x: 47, y: 69.125 }, { x: 182, y: 268.875 }, { x: 0, y: 0 }]) {
    const actual = mapPoint(fitted, point), expected = mapPoint(known, point);
    assert.ok(Math.hypot(actual.x - expected.x, actual.y - expected.y) < 1e-8);
  }
});

test('synthetic degenerate and non-finite homographies are rejected', () => {
  const line = [0, 1, 2, 3].map(x => ({ x, y: 0 }));
  assert.throws(() => fitHomography(line, pageCorners(20, 30)));
  assert.throws(() => fitHomography(pageCorners(20, 30), line));
  assert.throws(() => fitHomography(line.slice(0, 3), line));
  assert.throws(() => fitHomography([{ x: NaN, y: 0 }, ...line.slice(1)], line));
  assert.throws(() => mapPoint([1, 0, 0, 0, 1, 0, 1, 0, 0], { x: 0, y: 1 }));
});

test('synthetic geometry allows rotation, detects cropping, rejects reflection and extreme perspective', () => {
  const upright: Homography = [6, 0, 32, 0, 6, 32, 0, 0, 1];
  assert.equal(inspectPageGeometry(upright, 210, 297, { width: 1324, height: 1846 }).cropped, false);
  assert.equal(inspectPageGeometry([6, 0, -20, 0, 6, 32, 0, 0, 1], 210, 297, { width: 1324, height: 1846 }).cropped, true);
  const rotated = inspectPageGeometry([0, -6, 1814, 6, 0, 32, 0, 0, 1], 210, 297, { width: 1846, height: 1324 });
  assert.equal(rotated.cropped, false);
  assert.equal(rotated.pixelsPerMm, 6);
  assert.throws(() => inspectPageGeometry([-6, 0, 1300, 0, 6, 32, 0, 0, 1], 210, 297, { width: 1324, height: 1846 }));
  assert.throws(() => inspectPageGeometry([6, 0, 32, 0, 6, 32, .02, 0, 1], 210, 297, { width: 1324, height: 1846 }));
});

test('synthetic inverse warp samples centres bilinearly and bounds output allocation', () => {
  const source = { width: 4, height: 4, data: Uint8Array.from({ length: 16 }, (_, i) => Math.floor(i / 4) * 40 + (i % 4) * 10) };
  const identity: Homography = [1, 0, -.5, 0, 1, -.5, 0, 0, 1];
  assert.deepEqual(warpPerspective(source, identity, 4, 4, 1), source);
  const shifted: Homography = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  assert.deepEqual([...warpPerspective(source, shifted, 2, 2, 1).data], [25, 35, 65, 75]);
  assert.throws(() => warpPerspective(source, identity, 100_000, 100_000));
  assert.throws(() => warpPerspective(source, identity, 4, 4, 0));
  assert.throws(() => warpPerspective({ ...source, data: new Uint8Array(0) }, identity, 4, 4, 1));
});
