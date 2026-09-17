import type { ItemAnswer } from '../workspace/caseTypes';
import { RAW_SCORE_FIELDS, type ParsedRecordPayload, type RawScores } from '../workspace/caseTypes';
import { buildProfileFromAnswers, buildProfileFromRawScoresObject, type MMPIProfile } from '../scoring/mmpiScoring';
import type { FullRecordDetail } from '../records/supabaseRecords';

export type ScoringGender = 'Erkek' | 'Kadın';

type PageLike = {
  pageNumber: number;
  items: { itemId: string; itemNumber: number; choiceId: string | null }[];
  manualReviews?: Record<string, { choiceId: string | null }>;
  reviews?: Record<string, { choiceId: string | null }>;
};

/**
 * OMR sayfalarından (ham okuma + manuel düzeltmeler) 566 maddelik cevap dizisi.
 * Hem kaydedilen `SavedAnswerPage` hem de canlı `StoredScanPage` bu biçime uyar.
 */
export function answersFromOmrPages(pages: readonly PageLike[], itemCount = 566): ItemAnswer[] {
  const sorted = [...pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const out: ItemAnswer[] = new Array(itemCount).fill(undefined);
  for (const page of sorted) {
    const reviews = page.manualReviews ?? page.reviews ?? {};
    for (const item of page.items) {
      if (item.itemNumber < 1 || item.itemNumber > itemCount) continue;
      const review = reviews[item.itemId];
      const choice = review ? review.choiceId : item.choiceId;
      out[item.itemNumber - 1] = choice === 'D' ? 'D' : choice === 'Y' ? 'Y' : null;
    }
  }
  return out;
}

/** Kayıttaki her hangi veri kaynağından (hızlı giriş / OMR / ham puan) cevap dizisi. */
export function answersFromRecordPayload(parsed: ParsedRecordPayload): ItemAnswer[] | null {
  if (parsed.quickAnswers && parsed.quickAnswers.length === 566) {
    return parsed.quickAnswers as ItemAnswer[];
  }
  if (parsed.omrPages.length > 0) {
    return answersFromOmrPages(parsed.omrPages);
  }
  return null;
}

/**
 * Kayıtlı bir test kaydından MMPI profilini hesaplar.
 * Veri yetersizse (ör. cinsiyet skorlamaya uygun değil) null döner —
 * arayüz bunu kullanıcılara anlaşılır bir notla gösterir.
 */
export function profileFromRecord(
  record: Pick<FullRecordDetail, 'gender'>,
  parsed: ParsedRecordPayload,
): MMPIProfile | null {
  const gender: ScoringGender | undefined =
    parsed.client?.gender ?? (record.gender === 'Erkek' || record.gender === 'Kadın' ? record.gender : undefined);
  if (!gender) return null;

  const answers = answersFromRecordPayload(parsed);
  if (answers) return buildProfileFromAnswers(answers, gender);

  if (parsed.rawScales) {
    const scores = {} as RawScores;
    for (const field of RAW_SCORE_FIELDS) {
      const value = parsed.rawScales[field.key];
      if (typeof value !== 'number' || !Number.isFinite(value)) return null;
      scores[field.key] = value;
    }
    return buildProfileFromRawScoresObject(scores, gender);
  }

  return null;
}
