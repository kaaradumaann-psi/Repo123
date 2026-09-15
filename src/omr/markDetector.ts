import type { GrayImage, ItemDefinition, ResponseArea } from './omrTypes';
import type { ItemReadResult, QualityReport, ResponseMeasurement } from '../results/scanResultTypes';
import { percentile, QUALITY_THRESHOLDS, sampleRing } from './imageQuality';
import { CANONICAL_PIXELS_PER_MM } from './perspectiveCorrection';

/** Provisional technical evidence thresholds. Confidence is a heuristic strength, never a probability. */
export const MARK_THRESHOLDS = Object.freeze({
  blankDarkness: .045, blankCoverage: .035, pixelDarkness: .3,
  markDarkness: .25, markCoverage: .38, strongDarkness: .62, strongCoverage: .75,
  /**
   * Separates a faint *trace* from the smear that a phone lens, mild motion blur and JPEG
   * quantization leave imprinted just inside the printed bubble border on a hand-held photo.
   * A real pencil fill — however faint or half-erased — darkens the circle *core*, which the
   * blank-darkness clause already reports. Border smear, by contrast, brightens only the thin
   * annulus hugging the ring while leaving the core clean, so it must never flood every empty
   * bubble with "silik/silinmiş iz" evidence. A periphery this dark still counts without core
   * ink, so a genuinely dark ring, scribble or stray mark is never silently downgraded to blank
   * paper. Measured on synthetic raster scenes: border smear stayed below 0.15 even when heavy;
   * real strays (ring outlines vs. an inserted dark disc) reach ≈0.9.
   */
  strayPeripheralDarkness: .2,
});

function inspectResponse(image: GrayImage, area: ResponseArea) {
  const ppm = CANONICAL_PIXELS_PER_MM, radiusMm = Math.min(area.width, area.height) / 2;
  const cx = (area.x + area.width / 2) * ppm, cy = (area.y + area.height / 2) * ppm;
  const centralRadius = Math.min(.9, radiusMm * .55);
  const disk = sampleRing(image, cx, cy, 0, centralRadius * ppm);
  const background = percentile(sampleRing(image, cx, cy, (radiusMm + .35) * ppm, (radiusMm + .95) * ppm), .8);
  const paper = percentile(sampleRing(image, cx, cy, (radiusMm + 1.25) * ppm, (radiusMm + 1.85) * ppm), .8);
  const reference = Math.max(background, paper);
  const invalid = !disk.length || background < QUALITY_THRESHOLDS.fatalTileBrightness ||
    paper < QUALITY_THRESHOLDS.fatalTileBrightness || background < paper * .75;
  let darkness = 0, covered = 0;
  for (const value of disk) {
    const normalized = Math.max(0, Math.min(1, (reference - value) / Math.max(1, reference)));
    darkness += normalized;
    if (normalized >= MARK_THRESHOLDS.pixelDarkness) covered++;
  }
  // Leave 0.6 mm for the inward CSS border and interpolation. Peripheral ink can veto, never select.
  const peripheral = sampleRing(image, cx, cy, centralRadius * ppm, Math.max(centralRadius, radiusMm - .6) * ppm);
  let peripheralDarkness = 0, peripheralCovered = 0;
  for (const value of peripheral) {
    const normalized = Math.max(0, Math.min(1, (reference - value) / Math.max(1, reference)));
    peripheralDarkness += normalized;
    if (normalized >= MARK_THRESHOLDS.pixelDarkness) peripheralCovered++;
  }
  const peripheralEvidence = peripheral.length > 0 && (peripheralDarkness / peripheral.length > MARK_THRESHOLDS.strayPeripheralDarkness ||
    peripheralCovered / peripheral.length > MARK_THRESHOLDS.blankCoverage);
  const measurement: ResponseMeasurement = { responseId: area.responseId, choiceId: area.choiceId,
    darkness: disk.length ? darkness / disk.length : 0, coverage: disk.length ? covered / disk.length : 0 };
  return { measurement, invalid, peripheralEvidence };
}

export function measureResponse(image: GrayImage, area: ResponseArea): ResponseMeasurement {
  return inspectResponse(image, area).measurement;
}

export function detectItemMarks(image: GrayImage, item: ItemDefinition, quality: QualityReport): ItemReadResult {
  const inspected = item.responseAreas.map(area => inspectResponse(image, area)), limits = MARK_THRESHOLDS;
  const measurements = inspected.map(response => response.measurement);
  const base = { itemId: item.itemId, itemNumber: item.itemNumber, measurements };
  const result = (status: ItemReadResult['status'], choiceId: string | null, confidence: number, reason: string): ItemReadResult =>
    ({ ...base, status, choiceId, confidence: Math.max(0, Math.min(1, confidence)), reason });
  if (!measurements.length) return result('invalid', null, 0, 'Görüntü kalitesi uygun değil.');
  if (inspected.some(response => response.invalid)) return result('invalid', null, 0,
    'Yanıt alanının zemini kirli; yanıt kabul edilmedi.');
  const marked = measurements.filter(m => m.darkness >= limits.markDarkness && m.coverage >= limits.markCoverage);
  const evidence = inspected.filter(({ measurement: m, peripheralEvidence }) =>
    peripheralEvidence || m.darkness > limits.blankDarkness || m.coverage > limits.blankCoverage);
  if (marked.length > 1) return result('multiple', null, Math.min(...marked.map(m => Math.min(m.darkness, m.coverage))),
    'Birden fazla seçenek işaretli.');
  if (marked.length === 1) {
    const selected = marked[0]!;
    if (evidence.length > 1) return result('ambiguous', null, .25, 'Di\u011fer se\u00e7enekte de silik veya silinmi\u015f iz var; elle inceleyin.');
    const strength = Math.min(selected.darkness, selected.coverage);
    if (quality.ok && selected.darkness >= limits.strongDarkness && selected.coverage >= limits.strongCoverage
      && quality.score >= QUALITY_THRESHOLDS.cleanScore) {
      return result('reliable', selected.choiceId, Math.min(.98, strength * quality.score),
        'Tek ve belirgin işaret.');
    }
    return result('single', selected.choiceId, Math.min(.69, strength * quality.score),
      'Tek işaret; elle doğrulayın.');
  }
  if (evidence.length) return result('ambiguous', null, .2, 'Silik veya silinmiş iz var; elle inceleyin.');
  return result('blank', null, Math.min(.95, quality.score * (1 - Math.max(...measurements.map(m => m.darkness)))),
    'Belirgin işaret yok.');
}
