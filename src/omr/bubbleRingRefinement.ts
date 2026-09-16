/**
 * Bubble ring centre refinement — TypeScript port of the geometric idea discussed
 * in “Madde 21” and of OMRChecker’s `auto_align` / `CropOnMarkers` philosophy.
 *
 * OMRChecker (Python/OpenCV) does three things that this file mirrors in
 * TypeScript without OpenCV:
 *
 * 1. **CropPage / page isolation** — find the sheet contour (Canny → convexHull
 *    → approxPolyDP → four_point_transform).  Here: `pageIsolation.ts`.
 * 2. **CropOnMarkers / feature alignment** — locate the four 5 mm squares by
 *    multi-scale template matching (TM_CCOEFF_NORMED over eroded image) then
 *    `four_point_transform`; fallback is ORB + RANSAC homography
 *    (`FeatureBasedAlignment.py`).  Here: `alignmentDetector.ts` (multi-threshold
 *    connected components, squareFill ≥ 0.84) + QR homography
 *    (`perspectiveCorrection.ts` → `fitHomography` / `fitSimilarity`).
 * 3. **Per-block “auto_align”** — after global warp, OMRChecker runs a
 *    morphology → vertical Open(2×10) → threshold → iterative horizontal shift
 *    search per `FieldBlock` (`core.py:read_omr_response` → `shift` loop).
 *    That corrects a small systematic translation of a whole field block
 *    caused by perspective / scanner skew.
 *
 * The problem described in Madde 21 is the bubble-level analogue: the **same
 * bubble’s own printed ring** appears ~0.5 mm inside the bubble after
 * `fitHomography` from the four corner squares, so its dark arc falls into
 * the peripheral evidence band (inner ≈ 0.59 vs sentinel ≈ 0.48 vs border ≈
 * 0.08) and a blank Y is counted as `peripheralEvidence`.
 * The previous fix (“mask neighbour bubbles”, `omrPeripheralIsolation.test.ts`)
 * removes cross-bubble bleed but cannot fix a self-ring translation.
 *
 * This module therefore adds a **per-bubble geometric refinement** that
 * estimates a tiny translation (dx, dy) from the *printed ring itself*,
 * not from the darkest pixel (which would follow a real “D” mark).
 * It follows the `r(θ)=R+dx·cosθ+dy·sinθ` model described in the discussion,
 * with the same safety interlocks (max offset, residual, completeness,
 * radius plausibility) and a Huber robust fit so a real pencil mark never
 * pulls the centre toward the ink.
 *
 * References:
 * - `OMRChecker-master/src/core.py` — ImageInstanceOps.auto_align block shift
 * - `OMRChecker-master/src/processors/CropOnMarkers.py` — iterative scale
 *   search + four_point_transform
 * - `OMRChecker-master/src/processors/FeatureBasedAlignment.py` — ORB + homography
 * - `OMRChecker-master/src/utils/image.py` — ImageUtils.four_point_transform,
 *   normalize_util, CLAHE, morphology helpers
 */

import type { GrayImage, ResponseArea } from './omrTypes';
import { percentile } from './imageQuality';
import { CANONICAL_PIXELS_PER_MM } from './perspectiveCorrection';

// ---------------------------------------------------------------------------
// Tunables — match the discussion’s numbers; provisional and test-visible.
// ---------------------------------------------------------------------------

export const RING_REFINE = Object.freeze({
  /** Annulus that straddles the printed border (bubble radius 1.75 mm, mean 1.60). */
  innerMm: 1.05,
  outerMm: 2.05,
  /** Pixels darker than this (normalised against local paper) count as ring. */
  darknessThreshold: 0.28,
  /** Never chase a neighbouring bubble — 0.55 mm is < half the 4.25 mm pitch. */
  maxOffsetMm: 0.55,
  /** RMS residual of the fitted circle — tight to reject thick annulus ink (residual ≈0.21). */
  maxResidualMm: 0.18,
  /** Minimum angular coverage (16 sectors → 9.6 sectors). */
  minCompleteness: 0.60,
  /** Minimum number of dark ring pixels to attempt a fit. */
  minDarkPixels: 24,
  /** Plausible bubble radius band — mean printed ring ≈1.60 mm ± this. */
  maxRadiusDeviationMm: 0.32,
  /** Huber knee for robust reweighting. */
  huberKmm: 0.18,
  /** Number of IRLS iterations. */
  iterations: 3,
  /** Minimum translation that justifies a correction; smaller jitter is kept nominal. */
  minOffsetMm: 0.09,
});

export type RingFit = {
  ok: boolean;
  dx: number;
  dy: number;
  radius: number;
  residual: number;
  completeness: number;
  darkPixelCount: number;
  reason?: string;
};

const NOMINAL_RADIUS_MM = 1.60; // mean printed ring (1.45–1.75), not outer 1.75

function centreMm(area: ResponseArea) {
  return { x: area.x + area.width / 2, y: area.y + area.height / 2 };
}
function radiusMm(area: ResponseArea) {
  return Math.min(area.width, area.height) / 2;
}
function insideBubble(area: ResponseArea, xMm: number, yMm: number, insetMm = 0) {
  const rx = Math.max(0.05, area.width / 2 - insetMm);
  const ry = Math.max(0.05, area.height / 2 - insetMm);
  const c = centreMm(area);
  return ((xMm - c.x) / rx) ** 2 + ((yMm - c.y) / ry) ** 2 <= 1;
}
function nearbyResponseAreas(area: ResponseArea, allAreas: readonly ResponseArea[]) {
  // Same heuristic as markDetector.ts — only neighbours that can contribute pixels.
  const c = centreMm(area);
  const samplingRadius = radiusMm(area) + 0.45;
  const referenceRadius = radiusMm(area) + 1.85;
  return allAreas.filter(candidate => {
    if (candidate.responseId === area.responseId) return false;
    const o = centreMm(candidate);
    return Math.hypot(o.x - c.x, o.y - c.y) <= samplingRadius + referenceRadius + radiusMm(candidate);
  });
}
function isCoveredByNeighbour(xMm: number, yMm: number, neighbours: readonly ResponseArea[]) {
  return neighbours.some(nb => insideBubble(nb, xMm, yMm));
}
function normalizedDarkness(value: number, reference: number) {
  return Math.max(0, Math.min(1, (reference - value) / Math.max(1, reference)));
}

// Collect reference (paper) levels exactly like markDetector for consistency.
function collectReferenceLevels(
  image: GrayImage,
  area: ResponseArea,
  allAreas: readonly ResponseArea[],
): { reference: number; backgroundLevel: number; paperLevel: number } {
  const ppm = CANONICAL_PIXELS_PER_MM;
  const c = centreMm(area);
  const r = radiusMm(area);
  const cx = c.x * ppm;
  const cy = c.y * ppm;
  const neighbours = nearbyResponseAreas(area, allAreas);
  const collectRing = (inner: number, outer: number): number[] => {
    const vals: number[] = [];
    for (let y = Math.max(0, Math.floor(cy - outer * ppm)); y <= Math.min(image.height - 1, Math.ceil(cy + outer * ppm)); y++) {
      for (let x = Math.max(0, Math.floor(cx - outer * ppm)); x <= Math.min(image.width - 1, Math.ceil(cx + outer * ppm)); x++) {
        const xMm = (x + 0.5) / ppm;
        const yMm = (y + 0.5) / ppm;
        const d = Math.hypot(xMm - c.x, yMm - c.y);
        if (d < inner || d > outer) continue;
        if (isCoveredByNeighbour(xMm, yMm, neighbours)) continue;
        vals.push(image.data[y * image.width + x]!);
      }
    }
    return vals;
  };
  const background = collectRing(r + 0.35, r + 0.95);
  const paper = collectRing(r + 1.25, r + 1.85);
  const backgroundLevel = percentile(background, 0.8);
  const paperLevel = percentile(paper, 0.8);
  const reference = Math.max(backgroundLevel, paperLevel, 120);
  return { reference, backgroundLevel, paperLevel };
}

// Solve 3×3 linear system via Gaussian elimination with partial pivot.
function solve3x3(A: number[][], b: number[]): number[] | null {
  const n = 3;
  const M = A.map(row => [...row]);
  const v = [...b];
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) if (Math.abs(M[row]![col]!) > Math.abs(M[pivot]![col]!)) pivot = row;
    if (Math.abs(M[pivot]![col]!) < 1e-9) return null;
    if (pivot !== col) {
      [M[col], M[pivot]] = [M[pivot]!, M[col]!];
      [v[col], v[pivot]] = [v[pivot]!, v[col]!];
    }
    const div = M[col]![col]!;
    for (let j = col; j < n; j++) M[col]![j]! /= div;
    v[col]! /= div;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = M[row]![col]!;
      for (let j = col; j < n; j++) M[row]![j]! -= factor * M[col]![j]!;
      v[row]! -= factor * v[col]!;
    }
  }
  return v;
}

type Sample = { theta: number; rObs: number; cos: number; sin: number };

/**
 * Fit a translated circle r(θ)=R+dx·cosθ+dy·sinθ to dark ring pixels.
 * Returns a validated offset; `ok:false` means “keep the nominal centre”.
 * The fit never follows the darkest pixel — it fits the *ring geometry*.
 */
export function fitRingCenter(
  image: GrayImage,
  area: ResponseArea,
  allAreas: readonly ResponseArea[] = [area],
): RingFit {
  const ppm = CANONICAL_PIXELS_PER_MM;
  const c = centreMm(area);
  const cx = c.x * ppm;
  const cy = c.y * ppm;
  const cfg = RING_REFINE;
  const { reference } = collectReferenceLevels(image, area, allAreas);
  const neighbours = nearbyResponseAreas(area, allAreas);

  // Gather dark ring candidates in the 1.05–2.05 mm annulus.
  const samples: Sample[] = [];
  const inner = cfg.innerMm * ppm;
  const outer = cfg.outerMm * ppm;
  const y0 = Math.max(0, Math.floor(cy - outer));
  const y1 = Math.min(image.height - 1, Math.ceil(cy + outer));
  const x0 = Math.max(0, Math.floor(cx - outer));
  const x1 = Math.min(image.width - 1, Math.ceil(cx + outer));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const xMm = (x + 0.5) / ppm;
      const yMm = (y + 0.5) / ppm;
      if (isCoveredByNeighbour(xMm, yMm, neighbours)) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const distPx = Math.hypot(dx, dy);
      if (distPx < inner || distPx > outer) continue;
      const value = image.data[y * image.width + x]!;
      const darkness = normalizedDarkness(value, reference);
      if (darkness < cfg.darknessThreshold) continue;
      const theta = Math.atan2(dy, dx);
      samples.push({
        theta,
        rObs: distPx / ppm,
        cos: Math.cos(theta),
        sin: Math.sin(theta),
      });
    }
  }

  if (samples.length < cfg.minDarkPixels) {
    return {
      ok: false,
      dx: 0,
      dy: 0,
      radius: NOMINAL_RADIUS_MM,
      residual: Infinity,
      completeness: 0,
      darkPixelCount: samples.length,
      reason: `yetersiz koyu halka pikseli (${samples.length} < ${cfg.minDarkPixels})`,
    };
  }

  // IRLS with Huber weights.
  let weights = samples.map(() => 1);
  let R = NOMINAL_RADIUS_MM;
  let dx = 0;
  let dy = 0;

  for (let iter = 0; iter <= cfg.iterations; iter++) {
    // Build weighted normal equations
    let S1 = 0, Sx = 0, Sy = 0, Sxx = 0, Syy = 0, Sxy = 0, Sr = 0, Srx = 0, Sry = 0;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const w = weights[i]!;
      S1 += w;
      Sx += w * s.cos;
      Sy += w * s.sin;
      Sxx += w * s.cos * s.cos;
      Syy += w * s.sin * s.sin;
      Sxy += w * s.cos * s.sin;
      Sr += w * s.rObs;
      Srx += w * s.rObs * s.cos;
      Sry += w * s.rObs * s.sin;
    }
    const A = [
      [S1, Sx, Sy],
      [Sx, Sxx, Sxy],
      [Sy, Sxy, Syy],
    ];
    const b = [Sr, Srx, Sry];
    const sol = solve3x3(A, b);
    if (!sol) {
      return {
        ok: false,
        dx: 0,
        dy: 0,
        radius: R,
        residual: Infinity,
        completeness: 0,
        darkPixelCount: samples.length,
        reason: 'tekil matris (yetersiz açısal dağılım)',
      };
    }
    R = sol[0]!;
    dx = sol[1]!;
    dy = sol[2]!;
    // Update Huber weights for next iter (skip last)
    if (iter === cfg.iterations) break;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]!;
      const pred = R + dx * s.cos + dy * s.sin;
      const resid = Math.abs(s.rObs - pred);
      weights[i] = resid <= cfg.huberKmm ? 1 : cfg.huberKmm / Math.max(1e-9, resid);
    }
  }

  const offset = Math.hypot(dx, dy);
  if (offset < cfg.minOffsetMm - 1e-9) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: Infinity,
      completeness: 0,
      darkPixelCount: samples.length,
      reason: `kayma çok küçük (${offset.toFixed(3)} mm < ${cfg.minOffsetMm} mm) — nominal yeterli`,
    };
  }
  if (offset > cfg.maxOffsetMm + 1e-9) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: Infinity,
      completeness: 0,
      darkPixelCount: samples.length,
      reason: `kayma çok büyük (${offset.toFixed(2)} mm > ${cfg.maxOffsetMm} mm)`,
    };
  }
  if (Math.abs(R - NOMINAL_RADIUS_MM) > cfg.maxRadiusDeviationMm + 1e-9) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: Infinity,
      completeness: 0,
      darkPixelCount: samples.length,
      reason: `yarıçap mantıksız (R=${R.toFixed(2)} mm, beklenen ~${NOMINAL_RADIUS_MM} mm)`,
    };
  }

  // Residual and completeness
  let sumSq = 0;
  const sectorHasInlier = new Array(16).fill(false);
  const inlierThr = cfg.huberKmm * 1.5; // ~0.27 mm
  for (const s of samples) {
    const pred = R + dx * s.cos + dy * s.sin;
    const resid = s.rObs - pred;
    sumSq += resid * resid;
    const absResid = Math.abs(resid);
    const sector = Math.floor(((s.theta + Math.PI) / (2 * Math.PI)) * 16);
    if (absResid <= inlierThr) sectorHasInlier[Math.max(0, Math.min(15, sector))] = true;
  }
  const rms = Math.sqrt(sumSq / samples.length);
  const completeness = sectorHasInlier.filter(Boolean).length / 16;

  if (rms > cfg.maxResidualMm + 1e-9) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: rms,
      completeness,
      darkPixelCount: samples.length,
      reason: `halka uyumu zayıf (RMS ${rms.toFixed(3)} mm > ${cfg.maxResidualMm} mm)`,
    };
  }
  if (completeness < cfg.minCompleteness - 1e-9) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: rms,
      completeness,
      darkPixelCount: samples.length,
      reason: `halka çok eksik (${(completeness * 100).toFixed(0)}% < ${(cfg.minCompleteness * 100).toFixed(0)}%)`,
    };
  }

  // Additional guard: require that fit actually improves over nominal.
  // Compute nominal completeness/residual for comparison.
  let nominalSumSq = 0;
  const nominalSector = new Array(16).fill(false);
  for (const s of samples) {
    const resid = s.rObs - NOMINAL_RADIUS_MM;
    nominalSumSq += resid * resid;
    const sector = Math.floor(((s.theta + Math.PI) / (2 * Math.PI)) * 16);
    if (Math.abs(resid) <= inlierThr) nominalSector[Math.max(0, Math.min(15, sector))] = true;
  }
  const nominalCompleteness = nominalSector.filter(Boolean).length / 16;
  const nominalRms = Math.sqrt(nominalSumSq / samples.length);
  // If nominal already explains the ring almost as well and offset is tiny,
  // prefer nominal to avoid unnecessary jitter.  Offset must be >0.08 mm or improve completeness by ≥1 sector.
  const completenessGain = completeness - nominalCompleteness;
  if (offset < 0.08 && completenessGain < 0.07 && rms >= nominalRms - 0.02) {
    return {
      ok: false,
      dx,
      dy,
      radius: R,
      residual: rms,
      completeness,
      darkPixelCount: samples.length,
      reason: 'nominal dairesel uyum yeterli — düzeltme gereksiz',
    };
  }

  return { ok: true, dx, dy, radius: R, residual: rms, completeness, darkPixelCount: samples.length };
}

/**
 * Convenience: try to refine a whole page’s bubbles.  Returns a map from
 * responseId to offset for every bubble where the fit is confident.
 * The caller may then call `inspectResponse` / `detectItemMarks` with the
 * shifted centre.
 */
export function refinePageCentres(
  image: GrayImage,
  areas: readonly ResponseArea[],
): Map<string, { dx: number; dy: number }> {
  const out = new Map<string, { dx: number; dy: number }>();
  for (const area of areas) {
    const fit = fitRingCenter(image, area, areas);
    if (fit.ok) out.set(area.responseId, { dx: fit.dx, dy: fit.dy });
  }
  return out;
}
