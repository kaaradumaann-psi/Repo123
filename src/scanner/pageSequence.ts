import type { FormDefinition } from '../omr/omrTypes';
import type { ManualReview, ManualReviewEvent, StoredScanPage } from '../results/scanResultTypes';
import { validatePageResult } from '../results/resultValidator';

export type ScanSet = {
  batchId: string | null;
  reviewerId: string;
  pages: Record<number, StoredScanPage>;
  clinicalTransferAllowed: false;
};
export type PageAcceptance = { ok: true; state: ScanSet } | { ok: false; message: string };

export function createScanSet(): ScanSet {
  const reviewerId = `session-${Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')}`;
  return { batchId: null, reviewerId, pages: {}, clinicalTransferAllowed: false };
}

export function sortedPages(state: ScanSet): StoredScanPage[] {
  return Object.values(state.pages).sort((a, b) => a.pageNumber - b.pageNumber);
}

export function missingPageNumbers(state: ScanSet, definition: FormDefinition): number[] {
  return definition.pages.filter(page => !state.pages[page.pageNumber]).map(page => page.pageNumber).sort((a, b) => a - b);
}

export function acceptPage(state: ScanSet, result: unknown, definition: FormDefinition,
  source: { sourceName: string; previewUrl: string }): PageAcceptance {
  const valid = validatePageResult(result, definition);
  if (!valid.ok) return valid;
  const page = valid.result;
  if (state.batchId !== null && state.batchId !== page.batchId) {
    return { ok: false, message: 'Bu sayfa başka bir form setine ait. Mevcut set değişmedi. ' +
      'Aynı 4 sayfayı birlikte yükleyin; yeni bir set taranacaksa “Yeni Set / Sıfırla” düğmesini kullanın.' };
  }
  if (state.pages[page.pageNumber]) {
    return { ok: false, message: `${page.pageNumber}. sayfa zaten eklendi; üzerine yazılmadı. Yeniden taramak için önce bu sayfayı silin.` };
  }
  return { ok: true, state: { ...state, batchId: state.batchId ?? page.batchId, clinicalTransferAllowed: false,
    pages: { ...state.pages, [page.pageNumber]: { ...page, ...source, reviews: {}, reviewHistory: [] } } } };
}

/** Removing even the last page does not unlock the batch; only an explicit reset does. */
export function removePage(state: ScanSet, pageNumber: number): ScanSet {
  const pages = { ...state.pages };
  delete pages[pageNumber];
  return { ...state, pages, clinicalTransferAllowed: false };
}

export function setManualReview(state: ScanSet, definition: FormDefinition, pageNumber: number,
  itemId: string, review: ManualReview | undefined): ScanSet {
  const page = state.pages[pageNumber];
  const item = definition.pages.find(p => p.pageNumber === pageNumber)?.items.find(i => i.itemId === itemId);
  if (!page || !item) throw new Error('İncelenecek madde veya sayfa bulunamadı.');
  if (review && (review.choiceId !== null && !item.responseAreas.some(a => a.choiceId === review.choiceId) ||
    typeof review.reviewedAt !== 'string' || !Number.isFinite(Date.parse(review.reviewedAt)))) throw new Error('İnceleme seçeneği veya zamanı geçersiz.');
  const previous = Object.hasOwn(page.reviews, itemId) ? page.reviews[itemId] : undefined;
  if (review === undefined && !previous) return state;
  const reviews = { ...page.reviews };
  if (review === undefined) delete reviews[itemId];
  else reviews[itemId] = { ...review };
  // Snapshot both sides; undo removes only the active override, never its history.
  const event: ManualReviewEvent = { itemId, action: review === undefined ? 'undo' : 'review',
    reviewerId: state.reviewerId, recordedAt: new Date().toISOString(),
    previous: previous ? { ...previous } : null, next: review ? { ...review } : null };
  return { ...state, clinicalTransferAllowed: false, pages: { ...state.pages,
    [pageNumber]: { ...page, reviews, reviewHistory: [...page.reviewHistory, event] } } };
}
