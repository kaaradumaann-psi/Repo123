import { createPageQr, parsePageIdentity } from '../form/pageIdentity';
import type { FormDefinition, PixelImage } from './omrTypes';
import type { PageReadFailure, PageReadResult } from '../results/scanResultTypes';
import { describeAlignmentFailures, detectAlignmentMarks } from './alignmentDetector';
import type { AlignmentFailure } from './alignmentDetector';
import { assessImageQuality, QUALITY_THRESHOLDS, toGrayscale } from './imageQuality';
import { detectItemMarks } from './markDetector';
import { CANONICAL_PIXELS_PER_MM, CROP_TOLERANCE_MM, fitHomography, fitSimilarity, inspectFeatureContainment, inspectPageGeometry, MAX_CROP_TOLERANCE_MM, MAX_WARP_PIXELS, warpPerspective } from './perspectiveCorrection';
import type { Homography } from './perspectiveCorrection';
import { describeQrDisagreement, evaluateQrConsistency } from './alignmentVerification';
import { decodePageQr } from './qrDecoder';
import { isolatePaper } from './pageIsolation';

export const MAX_INPUT_PIXELS = 12_000_000;
/** Beyond this much implied blank margin the page frame itself is not trustworthy any more. */
export const PAGE_MARGIN_OVERSHOOT_LIMIT_MM = 20;

const failure = (code: string, message: string): PageReadFailure => ({ ok: false, code, message });

/** Technical OMR only. All four observed markers are required before reading answers.
 * Pure arrays, no canvas/DOM. Thresholds are provisional and confidence values are not probabilities.
 * The Promise API permits a caller to run this CPU-bound pipeline in a worker; it does not spawn one.
 */
export async function analyzePage(image: PixelImage, definition: FormDefinition): Promise<PageReadResult> {
  if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 ||
    !(image.data instanceof Uint8ClampedArray) || image.data.length !== image.width * image.height * 4) {
    return failure('INVALID_IMAGE', 'RGBA görüntü verisi geçersiz.');
  }
  if (image.width * image.height > MAX_INPUT_PIXELS || image.width > 8_000 || image.height > 8_000) {
    return failure('IMAGE_TOO_LARGE', 'Görüntü 12 megapiksel sınırını aşıyor; boyutunu küçültün.');
  }
  if (Math.min(image.width, image.height) < 600 || image.width * image.height < 500_000) {
    return failure('LOW_RESOLUTION', 'Görüntü çok küçük; daha yüksek çözünürlük kullanın.');
  }
  if (!definition || !Number.isFinite(definition.pageWidthMm) || !Number.isFinite(definition.pageHeightMm) ||
    definition.pageWidthMm < 50 || definition.pageHeightMm < 50 ||
    definition.pageWidthMm * definition.pageHeightMm * CANONICAL_PIXELS_PER_MM ** 2 > MAX_WARP_PIXELS ||
    !Array.isArray(definition.pages) || definition.pages.length < 1 || definition.pages.length > 100) {
    return failure('INVALID_DEFINITION', 'Form geometrisi geçersiz veya desteklenen boyutu aşıyor.');
  }
  try {
    const isolated = isolatePaper(toGrayscale(image)), source = isolated.image, decoded = decodePageQr(source);
    if (!decoded) return failure('QR_UNREADABLE', 'QR okunamadı; doğru formun tamamını net olarak çekin.');
    let identity;
    try { identity = parsePageIdentity(decoded.text, definition); }
    catch { return failure('QR_MISMATCH', 'QR kimliği, form sürümü, yerleşim veya sayfa bilgisi eşleşmiyor.'); }
    const page = definition.pages.find(candidate => candidate.pageNumber === identity.pageNumber)!;
    const rects = [...page.alignmentMarks, page.qrArea, ...page.items.flatMap(item => item.responseAreas)];
    const printedFeatures = [...page.alignmentMarks,
      { ...page.qrArea, id: 'qr-area' },
      ...page.items.flatMap(item => item.responseAreas.map(area => ({ ...area, id: area.responseId })))];
    if (page.alignmentMarks.length !== 4 || page.items.length < 1 || page.items.length > 1_000 ||
      page.items.some(item => item.responseAreas.length < 2 || item.responseAreas.length > 10) ||
      rects.some(rect => ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.x < 0 || rect.y < 0 ||
        rect.width <= 0 || rect.height <= 0 || rect.x + rect.width > definition.pageWidthMm || rect.y + rect.height > definition.pageHeightMm)) {
      return failure('INVALID_DEFINITION', 'Hizalama veya yanıt alanları geçersiz.');
    }
    const qr = createPageQr(definition, identity.batchId, identity.pageNumber);
    let predictions: Homography[];
    try { predictions = [fitHomography(qr.innerCorners, decoded.corners), fitSimilarity(qr.innerCorners, decoded.corners)]; }
    catch { return failure('INVALID_GEOMETRY', 'QR perspektifi hesaplanamadı.'); }
    const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
    const alignmentFailures: AlignmentFailure[] = [];
    let markers;
    try {
      markers = detectAlignmentMarks(source, page.alignmentMarks, predictions, qrCenter,
        entry => alignmentFailures.push(entry));
    }
    catch { return failure('INVALID_GEOMETRY', 'QR konum tahmini geçersiz; sayfayı daha dik açıdan çekin.'); }
    if (!markers) return { ...failure('ALIGNMENT_MISSING', describeAlignmentFailures(alignmentFailures)),
      diagnostics: alignmentFailures };
    const physicalCenters = page.alignmentMarks.map(mark => ({ x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 }));
    const contentInsetMm = Math.min(...rects.flatMap(rect => [rect.x, rect.y,
      definition.pageWidthMm - (rect.x + rect.width), definition.pageHeightMm - (rect.y + rect.height)]));
    const cropToleranceMm = Math.max(CROP_TOLERANCE_MM, Math.min(MAX_CROP_TOLERANCE_MM, contentInsetMm / 2));
    let transform, geometry;
    try {
      transform = fitHomography(physicalCenters, markers.map(mark => mark.center));
      geometry = inspectPageGeometry(transform, definition.pageWidthMm, definition.pageHeightMm, source, cropToleranceMm);
    } catch { return failure('INVALID_GEOMETRY', 'Sayfa perspektifi aşırı veya hizalama geometrisi tutarsız.'); }
    // Blank margin may be missing without harming anything: the frame is fitted from the printed
    // squares, so every item, bubble and the QR code keep their place. Only a printed feature
    // reaching outside the capture, or a frame that is wildly larger than the image, is fatal.
    const containment = inspectFeatureContainment(transform, printedFeatures, source, geometry.pixelsPerMm);
    if (containment.minMarginMm < 0) {
      return failure('PAGE_CROPPED',
        `Yazdırılmış bir öğe görüntünün dışında kalıyor: en yakın öğe ${containment.side} kenarından ` +
        `${Math.abs(containment.minMarginMm).toFixed(1)} mm dışarıda. ` +
        'Fotoğraflarda kâğıdın tamamını kadraja alın. PDF veya yazdırma çıktısında sayfa boyutunu A4, ' +
        'ölçeği %100, kenar boşluklarını "yok" yapın ve "sayfaya sığdır" seçeneğini kapatın.');
    }
    if (geometry.cropOvershootMm > PAGE_MARGIN_OVERSHOOT_LIMIT_MM) {
      return failure('PAGE_CROPPED',
        `Sayfa çerçevesi görüntüye göre tutarsız; yaklaşık ${geometry.cropOvershootMm.toFixed(1)} mm taşıyor. ` +
        'Kâğıdın dört köşesi de kadrajda olacak şekilde yeniden çekin veya PDF\'i A4 ölçeğinde yeniden üretin.');
    }
    if (geometry.pixelsPerMm < QUALITY_THRESHOLDS.minPixelsPerMm) {
      return failure('LOW_RESOLUTION', 'Sayfanın bir bölümünde piksel yoğunluğu yetersiz; daha yakından ve dik çekin.');
    }
    // The page transform is fitted from the four observed squares, so asking the QR symbol to agree
    // with it is not circular: a mismatched square changes the prediction. The budget is physical
    // (millimetres), because a 26 mm symbol decoded from a 4 MP photo carries sub-pixel corner noise
    // that a fixed 4 px limit rejected outright.
    const agreement = evaluateQrConsistency(transform, qr.innerCorners, decoded.corners, geometry.pixelsPerMm);
    if (!agreement.ok) return failure('INVALID_GEOMETRY', describeQrDisagreement(agreement.agreement));
    const normalized = warpPerspective(source, transform, definition.pageWidthMm, definition.pageHeightMm);
    const quality = assessImageQuality(normalized, page, geometry.pixelsPerMm);
    if (quality.fatal) {
      return { ...failure('POOR_QUALITY', quality.reasons.join(' ') || 'Görüntü kalitesi yetersiz; yanıtlar okunmadı.'), quality };
    }
    const items = page.items.map(item => detectItemMarks(normalized, item, quality));
    return {
      ok: true, pageId: page.pageId, pageNumber: page.pageNumber, batchId: identity.batchId,
      fingerprint: identity.fingerprint, items, quality, normalized,
      sourceCorners: geometry.sourceCorners.map(point => ({ x: point.x + isolated.originX, y: point.y + isolated.originY })),
      warnings: quality.ok ? [] : [...quality.reasons],
    };
  } catch {
    return failure('ANALYSIS_FAILED', 'Görüntü güvenli biçimde çözümlenemedi; yeniden çekin.');
  }
}
