import { createPageQr, parsePageIdentity } from '../form/pageIdentity';
import type { FormDefinition, PixelImage } from './omrTypes';
import type { PageReadFailure, PageReadResult } from '../results/scanResultTypes';
import { detectAlignmentMarks } from './alignmentDetector';
import { assessImageQuality, QUALITY_THRESHOLDS, toGrayscale } from './imageQuality';
import { detectItemMarks } from './markDetector';
import { CANONICAL_PIXELS_PER_MM, fitHomography, inspectPageGeometry, mapPoint, MAX_WARP_PIXELS, warpPerspective } from './perspectiveCorrection';
import { decodePageQr } from './qrDecoder';

export const MAX_INPUT_PIXELS = 12_000_000;

const failure = (code: string, message: string): PageReadFailure => ({ ok: false, code, message });

/** Technical OMR only. All four observed markers and acceptable quality are required before reading answers.
 * Pure arrays, no canvas/DOM. Thresholds are provisional and confidence values are not probabilities.
 * The Promise API permits a caller to run this CPU-bound pipeline in a worker; it does not spawn one.
 */
export async function analyzePage(image: PixelImage, definition: FormDefinition): Promise<PageReadResult> {
  if (!image || !Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width < 1 || image.height < 1 ||
    !(image.data instanceof Uint8ClampedArray) || image.data.length !== image.width * image.height * 4) {
    return failure('INVALID_IMAGE', 'RGBA g\u00f6r\u00fcnt\u00fc verisi ge\u00e7ersiz.');
  }
  if (image.width * image.height > MAX_INPUT_PIXELS || image.width > 8_000 || image.height > 8_000) {
    return failure('IMAGE_TOO_LARGE', 'G\u00f6r\u00fcnt\u00fc 12 megapiksel s\u0131n\u0131r\u0131n\u0131 a\u015f\u0131yor; boyutunu k\u00fc\u00e7\u00fclt\u00fcn.');
  }
  if (Math.min(image.width, image.height) < 600 || image.width * image.height < 500_000) {
    return failure('LOW_RESOLUTION', 'G\u00f6r\u00fcnt\u00fc \u00e7ok k\u00fc\u00e7\u00fck; daha y\u00fcksek \u00e7\u00f6z\u00fcn\u00fcrl\u00fck kullan\u0131n.');
  }
  if (!definition || !Number.isFinite(definition.pageWidthMm) || !Number.isFinite(definition.pageHeightMm) ||
    definition.pageWidthMm < 50 || definition.pageHeightMm < 50 ||
    definition.pageWidthMm * definition.pageHeightMm * CANONICAL_PIXELS_PER_MM ** 2 > MAX_WARP_PIXELS ||
    !Array.isArray(definition.pages) || definition.pages.length < 1 || definition.pages.length > 100) {
    return failure('INVALID_DEFINITION', 'Form geometrisi ge\u00e7ersiz veya desteklenen boyutu a\u015f\u0131yor.');
  }
  try {
    const source = toGrayscale(image), decoded = decodePageQr(source);
    if (!decoded) return failure('QR_UNREADABLE', 'QR okunamad\u0131; do\u011fru formun tamam\u0131n\u0131 net olarak \u00e7ekin.');
    let identity;
    try { identity = parsePageIdentity(decoded.text, definition); }
    catch { return failure('QR_MISMATCH', 'QR kimli\u011fi, form s\u00fcr\u00fcm\u00fc, yerle\u015fim veya sayfa bilgisi e\u015fle\u015fmiyor.'); }
    const page = definition.pages.find(candidate => candidate.pageNumber === identity.pageNumber)!;
    const rects = [...page.alignmentMarks, page.qrArea, ...page.items.flatMap(item => item.responseAreas)];
    if (page.alignmentMarks.length !== 4 || page.items.length < 1 || page.items.length > 1_000 ||
      page.items.some(item => item.responseAreas.length < 2 || item.responseAreas.length > 10) ||
      rects.some(rect => ![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) || rect.x < 0 || rect.y < 0 ||
        rect.width <= 0 || rect.height <= 0 || rect.x + rect.width > definition.pageWidthMm || rect.y + rect.height > definition.pageHeightMm)) {
      return failure('INVALID_DEFINITION', 'Hizalama veya yan\u0131t alanlar\u0131 ge\u00e7ersiz.');
    }
    const qr = createPageQr(definition, identity.batchId, identity.pageNumber);
    let initial;
    try { initial = fitHomography(qr.innerCorners, decoded.corners); }
    catch { return failure('INVALID_GEOMETRY', 'QR perspektifi hesaplanamad\u0131.'); }
    const qrCenter = { x: qr.area.x + qr.area.width / 2, y: qr.area.y + qr.area.height / 2 };
    let markers;
    try { markers = detectAlignmentMarks(source, page.alignmentMarks, initial, qrCenter); }
    catch { return failure('INVALID_GEOMETRY', 'QR konum tahmini ge\u00e7ersiz; sayfay\u0131 daha dik a\u00e7\u0131dan \u00e7ekin.'); }
    if (!markers) return failure('ALIGNMENT_MISSING', 'D\u00f6rt siyah hizalama karesi ayr\u0131 ayr\u0131 bulunamad\u0131; sayfan\u0131n tamam\u0131 g\u00f6r\u00fcnmeli.');
    const physicalCenters = page.alignmentMarks.map(mark => ({ x: mark.x + mark.width / 2, y: mark.y + mark.height / 2 }));
    let transform, geometry;
    try {
      transform = fitHomography(physicalCenters, markers.map(mark => mark.center));
      geometry = inspectPageGeometry(transform, definition.pageWidthMm, definition.pageHeightMm, source);
    } catch { return failure('INVALID_GEOMETRY', 'Sayfa perspektifi a\u015f\u0131r\u0131 veya hizalama geometrisi tutars\u0131z.'); }
    if (geometry.cropped) return failure('PAGE_CROPPED', 'Sayfan\u0131n kenarlar\u0131 kesilmi\u015f; k\u00e2\u011f\u0131d\u0131n tamam\u0131n\u0131 kadraja al\u0131n.');
    if (geometry.pixelsPerMm < QUALITY_THRESHOLDS.minPixelsPerMm) {
      return failure('LOW_RESOLUTION', 'Sayfan\u0131n bir b\u00f6l\u00fcm\u00fcnde piksel yo\u011funlu\u011fu yetersiz; daha yak\u0131ndan ve dik \u00e7ekin.');
    }
    const qrError = Math.max(...qr.innerCorners.map((corner, i) => {
      const mapped = mapPoint(transform, corner), observed = decoded.corners[i]!;
      return Math.hypot(mapped.x - observed.x, mapped.y - observed.y);
    }));
    if (qrError > Math.max(4, geometry.pixelsPerMm * 1.5)) {
      return failure('INVALID_GEOMETRY', 'QR ve ger\u00e7ek hizalama karelerinin konumlar\u0131 tutars\u0131z.');
    }
    const normalized = warpPerspective(source, transform, definition.pageWidthMm, definition.pageHeightMm);
    const quality = assessImageQuality(normalized, page, geometry.pixelsPerMm);
    if (!quality.ok) return { ...failure('POOR_QUALITY', 'G\u00f6r\u00fcnt\u00fc kalitesi yetersiz; yan\u0131tlar okunmad\u0131.'), quality };
    const items = page.items.map(item => detectItemMarks(normalized, item, quality));
    return {
      ok: true, pageId: page.pageId, pageNumber: page.pageNumber, batchId: identity.batchId,
      fingerprint: identity.fingerprint, items, quality, normalized, sourceCorners: geometry.sourceCorners,
      warnings: [
        'Yaln\u0131zca teknik i\u015faret okuma; klinik puanlama veya yorum yap\u0131lmaz.',
        'E\u015fikler ge\u00e7icidir ve yaln\u0131zca sentetik \u00f6rneklerle s\u0131nanm\u0131\u015ft\u0131r; g\u00fcven de\u011ferleri olas\u0131l\u0131k de\u011fildir.',
        ...(quality.score < QUALITY_THRESHOLDS.cleanScore ? ['Kalite s\u0131n\u0131rda; tek i\u015faretler de elle do\u011frulanmal\u0131.'] : []),
      ],
    };
  } catch {
    return failure('ANALYSIS_FAILED', 'G\u00f6r\u00fcnt\u00fc g\u00fcvenli bi\u00e7imde \u00e7\u00f6z\u00fcmlenemedi; yeniden \u00e7ekin.');
  }
}
