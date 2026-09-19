import type { FormDefinition, Point } from '../omr/omrTypes';
import type { ItemReadResult, ManualReview, ManualReviewEvent, QualityReport, StoredScanPage } from '../results/scanResultTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import { requireSupabase } from '../auth/supabaseClient';

export type SavedAnswerPage = {
  pageId: string;
  pageNumber: number;
  batchId: string;
  fingerprint: string;
  items: ItemReadResult[];
  quality: QualityReport;
  sourceCorners: Point[];
  warnings: string[];
  sourceName: string;
  manualReviews: Record<string, ManualReview>;
  /**
   * Manuel düzeltme denetim izi (kim, ne zaman, önceki/sonraki değer).
   * Eski kayıtlarda bulunmaz; okuma tarafı alanı opsiyonel saymalıdır.
   */
  reviewHistory?: ManualReviewEvent[];
};

export type MMPIRecord = { id: string; createdAt: string };

export type RecordSummary = {
  id: string;
  firstName: string;
  lastName: string;
  applicationDate: string;
  createdAt: string;
  gender?: Gender;
  age?: number;
  occupation?: string;
  education?: string;
  requestedBy?: string;
  createdBy?: string;
  psychologistName?: string;
  psychologistEmail?: string;
};

export type FullRecordDetail = RecordSummary & {
  rawOmrAnswers: unknown[];
  /** Kayıt sonrası uzman değerlendirme notu (migration öncesi kayıtlarda boş). */
  expertNotes: string;
  /** Not son güncelleme zamanı (hiç not girilmediyse undefined). */
  notesUpdatedAt?: string;
};

export type Gender = 'Kadın' | 'Erkek' | 'Belirtmek istemiyor' | 'Diğer';

export type RecordInput = {
  client: {
    firstName: string;
    lastName: string;
    gender: Gender;
    age: number;
    occupation: string;
    education: string;
    applicationDate: string;
    requestedBy: string;
  };
};

function text(value: string, label: string, max = 120): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || normalized.length > max || /[\u0000-\u001f]/.test(normalized)) {
    throw new Error(`${label} zorunludur ve geçerli olmalıdır.`);
  }
  return normalized;
}

function optionalText(value: string, label: string, max = 500): string {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';
  if (normalized.length > max || /[\u0000-\u001f]/.test(normalized)) {
    throw new Error(`${label} geçerli olmalıdır.`);
  }
  return normalized;
}

export function canCreateRecord(pages: readonly StoredScanPage[], definition: FormDefinition): boolean {
  if (pages.length !== definition.totalPages) return false;
  const batches = new Set(pages.map(page => page.batchId));
  return (
    batches.size === 1 &&
    definition.pages.every(expected => {
      const page = pages.find(candidate => candidate.pageNumber === expected.pageNumber);
      return !!page && page.fingerprint === definition.fingerprint && /^[A-F0-9]{24}$/.test(page.batchId) && page.items.length > 0;
    })
  );
}

/** Kaydedilecek sayfa yükü: görüntü içermez; manuel düzeltmeler ve denetim izi korunur. */
export function toSavedPage(page: StoredScanPage): SavedAnswerPage {
  return {
    pageId: page.pageId,
    pageNumber: page.pageNumber,
    batchId: page.batchId,
    fingerprint: page.fingerprint,
    items: page.items.map(item => ({ ...item, measurements: item.measurements.map(measurement => ({ ...measurement })) })),
    quality: { ...page.quality, metrics: { ...page.quality.metrics }, reasons: [...page.quality.reasons] },
    sourceCorners: page.sourceCorners.map(point => ({ ...point })),
    warnings: [...page.warnings],
    sourceName: page.sourceName,
    manualReviews: Object.fromEntries(Object.entries(page.reviews).map(([key, review]) => [key, { ...review }])),
    // Denetim izi kayda taşınır: her manuel düzeltme/geri alma olayı
    // (itemId, işlem, reviewer, zaman, önce/sonra) kalıcı olarak saklanır.
    reviewHistory: page.reviewHistory.map(event => ({
      ...event,
      previous: event.previous ? { ...event.previous } : null,
      next: event.next ? { ...event.next } : null,
    })),
  };
}

function normalizeClient(input: RecordInput['client']) {
  const client = {
    firstName: text(input.firstName, 'Ad', 80),
    lastName: text(input.lastName, 'Soyad', 80),
    gender: input.gender,
    age: input.age,
    occupation: optionalText(input.occupation, 'Meslek', 120),
    education: optionalText(input.education, 'Eğitim durumu', 120),
    applicationDate: text(input.applicationDate, 'Uygulama tarihi', 10),
    requestedBy: optionalText(input.requestedBy, 'Başvuru nedeni', 500),
  };
  if (!['Kadın', 'Erkek', 'Belirtmek istemiyor', 'Diğer'].includes(client.gender)) throw new Error('Cinsiyet seçimi geçersiz.');
  if (!Number.isInteger(client.age) || client.age < 0 || client.age > 120) throw new Error('Yaş 0–120 arasında olmalıdır.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.applicationDate) || Number.isNaN(Date.parse(`${client.applicationDate}T00:00:00Z`))) {
    throw new Error('Uygulama tarihi geçersiz.');
  }
  return client;
}

async function upsertRecord(
  client: ReturnType<typeof normalizeClient>,
  actor: AuthenticatedUser,
  idempotencyKey: string,
  answers: unknown[],
): Promise<MMPIRecord> {
  if (actor.role !== 'PSYCHOLOG' || !actor.active) {
    throw new Error('Kayıt yalnızca aktif Psikolog hesabı ile oluşturulabilir.');
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new Error('Kayıt anahtarı geçersiz. Sayfayı yenileyip tekrar deneyin.');
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new Error('Kayıt için veri yükü boş olamaz.');
  }
  const payload = {
    idempotency_key: idempotencyKey,
    client_first_name: client.firstName,
    client_last_name: client.lastName,
    gender: client.gender,
    age: client.age,
    occupation: client.occupation,
    education: client.education,
    application_date: client.applicationDate,
    requested_by: client.requestedBy,
    raw_omr_answers: answers,
    created_by: actor.id,
  };
  let data: { id?: unknown; created_at?: unknown } | null = null;
  try {
    const response = await requireSupabase()
      .from('mmpi_records')
      .upsert(payload, { onConflict: 'idempotency_key' })
      .select('id,created_at')
      .single();
    if (response.error) {
      // Ağ hatası ile sunucu hatasını ayırt edebilmek için orijinal mesaj `cause` ile taşınır;
      // `isNetworkError` kuyruğa alma kararını bu zincirden verir.
      throw new Error('Kayıt oluşturulamadı. Bilgileriniz korundu, lütfen tekrar deneyin.', { cause: response.error });
    }
    data = response.data as { id?: unknown; created_at?: unknown } | null;
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith('Kayıt oluşturulamadı.')) throw cause;
    throw new Error('Kayıt oluşturulamadı. Bilgileriniz korundu, lütfen tekrar deneyin.', { cause });
  }
  if (!data) throw new Error('Kayıt oluşturulamadı. Bilgileriniz korundu, lütfen tekrar deneyin.');
  const row = data as { id?: unknown; created_at?: unknown };
  if (typeof row.id !== 'string' || typeof row.created_at !== 'string') throw new Error('Kayıt yanıtı geçersiz.');
  return { id: row.id, createdAt: row.created_at };
}

export async function createRecord(
  input: RecordInput,
  pages: readonly StoredScanPage[],
  definition: FormDefinition,
  actor: AuthenticatedUser,
  idempotencyKey: string,
  extras: unknown[] = [],
): Promise<MMPIRecord> {
  if (!canCreateRecord(pages, definition)) {
    throw new Error('4 sayfanın tamamı ve taranmış cevaplar onaylanmadan kayıt tamamlanamaz.');
  }
  const omrPages = pages
    .slice()
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(toSavedPage);
  return upsertRecord(normalizeClient(input.client), actor, idempotencyKey, [...extras, ...omrPages]);
}

export async function createDataRecord(
  input: RecordInput,
  actor: AuthenticatedUser,
  idempotencyKey: string,
  payload: unknown[],
): Promise<MMPIRecord> {
  return upsertRecord(normalizeClient(input.client), actor, idempotencyKey, payload);
}

export async function listOwnRecords(): Promise<RecordSummary[]> {
  const { data, error } = await requireSupabase()
    .from('mmpi_records')
    .select('id,client_first_name,client_last_name,application_date,created_at,gender,age,occupation,education,requested_by')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error('Test kayıtlarınız alınamadı.');
  return (data ?? []).map(row => {
    const value = row as {
      id?: unknown;
      client_first_name?: unknown;
      client_last_name?: unknown;
      application_date?: unknown;
      created_at?: unknown;
      gender?: unknown;
      age?: unknown;
      occupation?: unknown;
      education?: unknown;
      requested_by?: unknown;
    };
    if (
      typeof value.id !== 'string' ||
      typeof value.client_first_name !== 'string' ||
      typeof value.client_last_name !== 'string' ||
      typeof value.application_date !== 'string' ||
      typeof value.created_at !== 'string'
    ) {
      throw new Error('Kayıt listesi geçersiz.');
    }
    return {
      id: value.id,
      firstName: value.client_first_name,
      lastName: value.client_last_name,
      applicationDate: value.application_date,
      createdAt: value.created_at,
      gender: value.gender as Gender,
      age: typeof value.age === 'number' ? value.age : undefined,
      occupation: typeof value.occupation === 'string' ? value.occupation : undefined,
      education: typeof value.education === 'string' ? value.education : undefined,
      requestedBy: typeof value.requested_by === 'string' ? value.requested_by : undefined,
    };
  });
}

export async function listAllRecords(): Promise<RecordSummary[]> {
  const { data, error } = await requireSupabase()
    .from('mmpi_records')
    .select(`
      id,
      client_first_name,
      client_last_name,
      application_date,
      created_at,
      gender,
      age,
      occupation,
      education,
      requested_by,
      created_by,
      profiles:created_by (
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    // If join fails due to relationship naming, fallback to basic select
    const fallback = await requireSupabase()
      .from('mmpi_records')
      .select('id,client_first_name,client_last_name,application_date,created_at,gender,age,occupation,education,requested_by,created_by')
      .order('created_at', { ascending: false })
      .limit(200);
    if (fallback.error) throw new Error('Tüm test kayıtları alınamadı.');
    return (fallback.data ?? []).map(row => {
      const v = row as Record<string, unknown>;
      return {
        id: String(v.id),
        firstName: String(v.client_first_name),
        lastName: String(v.client_last_name),
        applicationDate: String(v.application_date),
        createdAt: String(v.created_at),
        gender: v.gender as Gender,
        age: typeof v.age === 'number' ? v.age : undefined,
        occupation: typeof v.occupation === 'string' ? v.occupation : undefined,
        education: typeof v.education === 'string' ? v.education : undefined,
        requestedBy: typeof v.requested_by === 'string' ? v.requested_by : undefined,
        createdBy: typeof v.created_by === 'string' ? v.created_by : undefined,
      };
    });
  }

  return (data ?? []).map(row => {
    const v = row as Record<string, unknown>;
    const profile = v.profiles as { first_name?: string; last_name?: string; email?: string } | null;
    const psychologistName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined;
    return {
      id: String(v.id),
      firstName: String(v.client_first_name),
      lastName: String(v.client_last_name),
      applicationDate: String(v.application_date),
      createdAt: String(v.created_at),
      gender: v.gender as Gender,
      age: typeof v.age === 'number' ? v.age : undefined,
      occupation: typeof v.occupation === 'string' ? v.occupation : undefined,
      education: typeof v.education === 'string' ? v.education : undefined,
      requestedBy: typeof v.requested_by === 'string' ? v.requested_by : undefined,
      createdBy: typeof v.created_by === 'string' ? v.created_by : undefined,
      psychologistName: psychologistName || undefined,
      psychologistEmail: profile?.email || undefined,
    };
  });
}

export async function getRecordDetail(recordId: string): Promise<FullRecordDetail> {
  // Admin'in kayıt detayına erişimi bilinçli ürün kararıdır (denetim/silme görevi);
  // tüm yazma işlemleri sunucu tarafında audit_logs tablosuna kaydedilir (B8).
  // '*' seçimi bilinçlidir: expert_notes/notes_updated_at kolonları migration
  // uygulanmamış ortamlarda bulunmayabilir; okuma toleranslıdır.
  const { data, error } = await requireSupabase()
    .from('mmpi_records')
    .select('*')
    .eq('id', recordId)
    .single();

  if (error || !data) throw new Error('Test detayları alınamadı.');

  const v = data as Record<string, unknown>;
  return {
    id: String(v.id),
    firstName: String(v.client_first_name),
    lastName: String(v.client_last_name),
    applicationDate: String(v.application_date),
    createdAt: String(v.created_at),
    gender: v.gender as Gender,
    age: typeof v.age === 'number' ? v.age : undefined,
    occupation: typeof v.occupation === 'string' ? v.occupation : undefined,
    education: typeof v.education === 'string' ? v.education : undefined,
    requestedBy: typeof v.requested_by === 'string' ? v.requested_by : undefined,
    createdBy: typeof v.created_by === 'string' ? v.created_by : undefined,
    rawOmrAnswers: Array.isArray(v.raw_omr_answers) ? (v.raw_omr_answers as unknown[]) : [],
    expertNotes: typeof v.expert_notes === 'string' ? v.expert_notes : '',
    notesUpdatedAt: typeof v.notes_updated_at === 'string' ? v.notes_updated_at : undefined,
  };
}

export const EXPERT_NOTES_MAX = 4000;

/**
 * Kayıt sonrası uzman notunu günceller. RLS gereği yalnızca kaydı oluşturan
 * aktif psikolog yazabilir; not, yazdırma raporuna "Uzman Değerlendirme Notu"
 * bölümü olarak aktarılır. Sunucu tarafı 4000 karakter sınırını da zorlar.
 */
export async function updateExpertNotes(recordId: string, notes: string): Promise<string> {
  const normalized = notes.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim();
  if (normalized.length > EXPERT_NOTES_MAX) {
    throw new Error(`Uzman notu en fazla ${EXPERT_NOTES_MAX} karakter olabilir.`);
  }
  const updatedAt = new Date().toISOString();
  const { error } = await requireSupabase()
    .from('mmpi_records')
    .update({ expert_notes: normalized, notes_updated_at: updatedAt })
    .eq('id', recordId);
  if (error) throw new Error('Uzman notu kaydedilemedi. Lütfen tekrar deneyin.');
  return updatedAt;
}

export async function deleteRecord(recordId: string): Promise<void> {
  const { error } = await requireSupabase().from('mmpi_records').delete().eq('id', recordId);
  if (error) throw new Error('Test kaydı silinemedi: ' + error.message);
}
