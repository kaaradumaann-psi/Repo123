import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzePage, MAX_INPUT_PIXELS } from '../src/omr/analyzePage';
import { formDefinition } from '../src/omr/formDefinition';
import { createPageQr, parsePageIdentity } from '../src/form/pageIdentity';
import { detectItemMarks, measureResponse } from '../src/omr/markDetector';
import { mapPoint } from '../src/omr/perspectiveCorrection';
import type { PageReadResult, PageReadSuccess } from '../src/results/scanResultTypes';
import { blurSynthetic, cropSynthetic, illuminateSynthetic, projectSynthetic, renderSyntheticPage, rotateSynthetic, SYNTHETIC_BATCH, SYNTHETIC_MARGIN } from './fixtures/omrSynthetic';

function success(result: PageReadResult): PageReadSuccess {
  assert.ok(result.ok, result.ok ? undefined : `${result.code}: ${result.message}${result.quality ? ` ${JSON.stringify(result.quality)}` : ''}`);
  return result;
}

function failed(result: PageReadResult, code?: string) {
  assert.equal(result.ok, false, 'Unsafe success on a rejected synthetic scene');
  if (!result.ok && code) assert.equal(result.code, code);
  assert.ok(!('items' in result), 'Rejected pages must never expose answer results');
  assert.ok(!('normalized' in result));
}

test('synthetic exact form: blank, strong, faint, erased, multiple, weaker single and conflicting trace stay distinct', async () => {
  const result = success(await analyzePage(renderSyntheticPage({ marks: [
    { itemNumber: 2, choiceId: 'D', kind: 'strong' },
    { itemNumber: 3, choiceId: 'Y', kind: 'faint' },
    { itemNumber: 4, choiceId: 'D', kind: 'erased' },
    { itemNumber: 5, choiceId: 'D', kind: 'strong' }, { itemNumber: 5, choiceId: 'Y', kind: 'strong' },
    { itemNumber: 6, choiceId: 'Y', kind: 'single' },
    { itemNumber: 7, choiceId: 'D', kind: 'strong' }, { itemNumber: 7, choiceId: 'Y', kind: 'erased' },
  ] }), formDefinition));
  assert.deepEqual(result.items.slice(0, 7).map(item => item.status), ['blank', 'reliable', 'ambiguous', 'ambiguous', 'multiple', 'single', 'ambiguous']);
  assert.deepEqual(result.items.slice(0, 7).map(item => item.choiceId), [null, 'D', null, null, null, 'Y', null]);
  assert.equal(result.pageId, formDefinition.pages[0]!.pageId);
  assert.equal(result.batchId, SYNTHETIC_BATCH);
  assert.equal(result.fingerprint, formDefinition.fingerprint);
  assert.equal(result.normalized.width, 1680);
  assert.equal(result.normalized.height, 2376);
  assert.equal(result.normalized.data.length, 1680 * 2376);
  assert.equal(result.items.length, 144);
  assert.equal(result.quality.ok, true);
  assert.ok(result.quality.metrics.pixelsPerMm > 5.9);
  for (const item of result.items) {
    assert.ok(item.confidence >= 0 && item.confidence <= 1);
    assert.ok(item.reason.length > 15);
    assert.equal(item.measurements.length, 2);
    for (const measurement of item.measurements) {
      assert.ok(measurement.coverage >= 0 && measurement.coverage <= 1);
      assert.ok(measurement.darkness >= 0 && measurement.darkness <= 1);
    }
  }
  const strong = formDefinition.pages[0]!.items[1]!;
  assert.deepEqual(result.items[1]!.measurements, strong.responseAreas.map(area => measureResponse(result.normalized, area)));
  assert.equal(detectItemMarks(result.normalized, strong, { ...result.quality, score: .7 }).status, 'single');
  assert.equal(detectItemMarks(result.normalized, strong, { ...result.quality, ok: false }).status, 'invalid');
  assert.ok(result.sourceCorners.every((p, index) => {
    const expected = [{ x: 31.5, y: 31.5 }, { x: 1291.5, y: 31.5 }, { x: 1291.5, y: 1813.5 }, { x: 31.5, y: 1813.5 }][index]!;
    return Math.hypot(p.x - expected.x, p.y - expected.y) < 1;
  }));
});

test('synthetic page 4 maps all shortened-column boundaries and item 566 correctly', async () => {
  const marked = [433, 480, 481, 528, 529, 566];
  const result = success(await analyzePage(renderSyntheticPage({ pageNumber: 4,
    marks: marked.map(itemNumber => ({ itemNumber, choiceId: 'Y', kind: 'strong' })) }), formDefinition));
  assert.equal(result.pageNumber, 4);
  assert.equal(result.items.length, 134);
  assert.deepEqual(result.items.map(item => item.itemNumber), Array.from({ length: 134 }, (_, index) => index + 433));
  assert.deepEqual(result.items.filter(item => item.status === 'reliable').map(item => item.itemNumber), marked);
  assert.ok(result.items.filter(item => marked.includes(item.itemNumber)).every(item => item.choiceId === 'Y'));
});

test('synthetic QR missing or unreadable fails closed', async () => {
  failed(await analyzePage(renderSyntheticPage({ qrText: null }), formDefinition), 'QR_UNREADABLE');
  failed(await analyzePage(renderSyntheticPage({ qrText: 'NOT-THIS-FORM' }), formDefinition), 'QR_MISMATCH');
});

test('synthetic QR rejects wrong version, full fingerprint, batch syntax, page and page count', async () => {
  const valid = createPageQr(formDefinition, SYNTHETIC_BATCH, 1).text;
  for (const [index, replacement] of [[1, '1.0.0'], [2, `${formDefinition.fingerprint.slice(0, -1)}Z`],
    [3, 'invalid-batch'], [4, '5'], [4, '01'], [5, '3']] as const) {
    const fields = valid.split(':'); fields[index] = replacement;
    const text = fields.join(':');
    assert.throws(() => parsePageIdentity(text, formDefinition));
    failed(await analyzePage(renderSyntheticPage({ qrText: text }), formDefinition), 'QR_MISMATCH');
  }
});

test('synthetic missing or hollow alignment square is not replaced with a predicted corner', async () => {
  for (const id of formDefinition.pages[0]!.alignmentMarks.map(marker => marker.id)) {
    failed(await analyzePage(renderSyntheticPage({ missingMarkers: [id] }), formDefinition), 'ALIGNMENT_MISSING');
  }
  failed(await analyzePage(renderSyntheticPage({ hollowMarkers: ['bottom-left'] }), formDefinition), 'ALIGNMENT_MISSING');
});

test('synthetic cropped page fails even when all four printed markers remain', async () => {
  const image = cropSynthetic(renderSyntheticPage(), SYNTHETIC_MARGIN + 20, 0, 0, 0);
  failed(await analyzePage(image, formDefinition), 'PAGE_CROPPED');
});

test('synthetic insufficient illumination and severe shadow fail without answer results', async () => {
  const image = renderSyntheticPage({ marks: [{ itemNumber: 1, choiceId: 'D', kind: 'strong' }] });
  for (const degraded of [illuminateSynthetic(image, () => .45), illuminateSynthetic(image, x => .4 + .6 * x)]) {
    const result = await analyzePage(degraded, formDefinition);
    failed(result, 'POOR_QUALITY');
    if (!result.ok) assert.ok(result.quality && result.quality.reasons.length > 0);
  }
});

test('synthetic global blur and response-only blur cannot yield confident answers', async () => {
  const image = renderSyntheticPage(), blurred = blurSynthetic(image, 3);
  failed(await analyzePage(blurred, formDefinition));
  // Restore the QR/header and markers so the second case exercises quality, not merely QR failure.
  const data = new Uint8ClampedArray(image.data);
  for (let y = SYNTHETIC_MARGIN + 60 * 6; y < SYNTHETIC_MARGIN + 275 * 6; y++) {
    const offset = y * image.width * 4;
    data.set(blurred.data.subarray(offset, offset + image.width * 4), offset);
  }
  const result = await analyzePage({ ...image, data }, formDefinition);
  failed(result, 'POOR_QUALITY');
  if (!result.ok) assert.ok(result.quality && (result.quality.metrics.laplacianVariance < 100 || result.quality.metrics.borderContrast < .4));
});

test('synthetic rotated captures retain identity and choices at 90, 180 and 270 degrees', async () => {
  const image = renderSyntheticPage({ pageNumber: 4, marks: [{ itemNumber: 566, choiceId: 'D', kind: 'strong' }] });
  for (const turns of [1, 2, 3]) {
    const result = success(await analyzePage(rotateSynthetic(image, turns), formDefinition));
    assert.equal(result.pageNumber, 4);
    assert.equal(result.items.at(-1)!.status, 'reliable');
    assert.equal(result.items.at(-1)!.choiceId, 'D');
    assert.ok(result.items.slice(0, -1).every(item => item.status === 'blank'));
  }
});

test('synthetic moderate projective skew is rectified using real marker centres', async () => {
  const image = renderSyntheticPage({ marks: [{ itemNumber: 1, choiceId: 'D', kind: 'strong' }, { itemNumber: 144, choiceId: 'Y', kind: 'strong' }] });
  const scene = projectSynthetic(image, 1530, 2030, [{ x: 120, y: 55 }, { x: 1440, y: 140 }, { x: 1350, y: 1965 }, { x: 50, y: 1840 }]);
  const result = success(await analyzePage(scene.image, formDefinition));
  // Two raster resamplings soften the circles: keep correct choices reviewable, not "reliable".
  assert.equal(result.items[0]!.status, 'single');
  assert.equal(result.items[0]!.choiceId, 'D');
  assert.equal(result.items.at(-1)!.status, 'single');
  assert.equal(result.items.at(-1)!.choiceId, 'Y');
  assert.ok(result.quality.score < .8);
  assert.ok(result.items.slice(1, -1).every(item => item.status === 'blank'));
  const physical = [{ x: 0, y: 0 }, { x: 210, y: 0 }, { x: 210, y: 297 }, { x: 0, y: 297 }];
  physical.forEach((point, index) => {
    const expected = mapPoint(scene.transform, { x: SYNTHETIC_MARGIN + point.x * 6, y: SYNTHETIC_MARGIN + point.y * 6 });
    assert.ok(Math.hypot(result.sourceCorners[index]!.x + .5 - expected.x, result.sourceCorners[index]!.y + .5 - expected.y) < 2);
  });
});

test('synthetic non-right-angle rotation still detects all four actual squares', async () => {
  const image = renderSyntheticPage({ marks: [{ itemNumber: 96, choiceId: 'D', kind: 'strong' }] });
  const angle = 17 * Math.PI / 180, cosine = Math.cos(angle), sine = Math.sin(angle);
  const corners = [{ x: 0, y: 0 }, { x: image.width, y: 0 }, { x: image.width, y: image.height }, { x: 0, y: image.height }]
    .map(p => ({ x: 620 + p.x * cosine - p.y * sine, y: 35 + p.x * sine + p.y * cosine }));
  const scene = projectSynthetic(image, 1950, 2240, corners);
  const result = success(await analyzePage(scene.image, formDefinition));
  assert.equal(result.items[95]!.choiceId, 'D');
  assert.ok(['single', 'reliable'].includes(result.items[95]!.status));
  assert.ok(result.items.filter(item => item.itemNumber !== 96).every(item => item.status === 'blank'));
});

test('synthetic high-resolution input uses bounded QR decode and preserves original-source corners', async () => {
  const result = success(await analyzePage(renderSyntheticPage({ pixelsPerMm: 10,
    marks: [{ itemNumber: 144, choiceId: 'Y', kind: 'strong' }] }), formDefinition));
  assert.equal(result.items.at(-1)!.status, 'reliable');
  assert.ok(Math.abs(result.quality.metrics.pixelsPerMm - 10) < .02);
  assert.ok(Math.abs(result.sourceCorners[2]!.x - (SYNTHETIC_MARGIN + 2100 - .5)) < 1);
  assert.ok(Math.abs(result.sourceCorners[2]!.y - (SYNTHETIC_MARGIN + 2970 - .5)) < 1);
  assert.equal(result.normalized.data.length, 1680 * 2376);
});

test('synthetic input and allocation guards reject tiny, malformed and over-12MP inputs', async () => {
  failed(await analyzePage({ width: 10, height: 10, data: new Uint8ClampedArray(400) }, formDefinition), 'LOW_RESOLUTION');
  failed(await analyzePage({ width: 1000, height: 1000, data: new Uint8ClampedArray(4) }, formDefinition), 'INVALID_IMAGE');
  const width = 4000, height = Math.ceil(MAX_INPUT_PIXELS / width) + 1;
  failed(await analyzePage({ width, height, data: new Uint8ClampedArray(width * height * 4) }, formDefinition), 'IMAGE_TOO_LARGE');
  failed(await analyzePage(renderSyntheticPage({ pixelsPerMm: 3 }), formDefinition));
});
