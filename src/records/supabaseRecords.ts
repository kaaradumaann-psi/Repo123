import type { FormDefinition, Point } from '../omr/omrTypes';
import type { ItemReadResult, ManualReview, QualityReport, StoredScanPage } from '../results/scanResultTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import { requireSupabase } from '../auth/supabaseClient';

type SavedAnswerPage = {
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
};

export type MMPIRecord = { id: string; createdAt: string };
export type RecordSummary = {
  id: string;
  firstName: string;
  lastName: string;
  applicationDate: string;
  createdAt: string;
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
  if (!normalized || normalized.length > max || /[\u0000-\u001f]/.test(normalized)) throw new Error(`${label} zorunludur ve geçerli olmalıdır.`);
  return normalized;
}

export function canCreateRecord(pages: readonly StoredScanPage[], definition: FormDefinition): boolean {
  if (pages.length !== definition.totalPages) return false;
  const batches = new Set(pages.map(page => page.batchId));
  return batches.size === 1 && definition.pages.every(expected => {
    const page = pages.find(candidate => candidate.pageNumber === expected.pageNumber);
    return !!page && page.fingerprint === definition.fingerprint && /^[A-F0-9]{24}$/.test(page.batchId) && page.items.length > 0;
  });
}

function toSavedPage(page: StoredScanPage): SavedAnswerPage {
  return { pageId: page.pageId, pageNumber: page.pageNumber, batchId: page.batchId, fingerprint: page.fingerprint,
    items: page.items.map(item => ({ ...item, measurements: item.measurements.map(measurement => ({ ...measurement })) })),
    quality: { ...page.quality, metrics: { ...page.quality.metrics }, reasons: [...page.quality.reasons] },
    sourceCorners: page.sourceCorners.map(point => ({ ...point })), warnings: [...page.warnings], sourceName: page.sourceName,
    manualReviews: Object.fromEntries(Object.entries(page.reviews).map(([key, review]) => [key, { ...review }])), };
}

export async function createRecord(input: RecordInput, pages: readonly StoredScanPage[], definition: FormDefinition,
  actor: AuthenticatedUser, idempotencyKey: string): Promise<MMPIRecord> {
  if (actor.role !== 'PSYCHOLOG' || !actor.active) throw new Error('Kayıt yalnızca aktif Psikolog hesabıyla oluşturulabilir.');
  if (!canCreateRecord(pages, definition)) throw new Error('Dört sayfanın tamamı ve taranmış cevaplar kabul edilmeden kayıt yapılamaz.');
  const client = {
    firstName: text(input.client.firstName, 'Ad', 80),
    lastName: text(input.client.lastName, 'Soyad', 80),
    gender: input.client.gender,
    age: input.client.age,
    occupation: text(input.client.occupation, 'Meslek', 120),
    education: text(input.client.education, 'Eğitim durumu', 120),
    applicationDate: text(input.client.applicationDate, 'Uygulanma tarihi', 10),
    requestedBy: text(input.client.requestedBy, 'İstekte bulunan', 120),
  };
  if (!['Kadın', 'Erkek', 'Belirtmek istemiyor', 'Diğer'].includes(client.gender)) throw new Error('Cinsiyet seçimi geçersiz.');
  if (!Number.isInteger(client.age) || client.age < 0 || client.age > 120) throw new Error('Yaş 0–120 arasında olmalıdır.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.applicationDate) || Number.isNaN(Date.parse(`${client.applicationDate}T00:00:00Z`))) {
    throw new Error('Uygulanma tarihi geçersiz.');
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotencyKey)) {
    throw new Error('Kayıt anahtarı geçersiz. Sayfayı yenileyip yeniden deneyin.');
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
    raw_omr_answers: pages.slice().sort((a, b) => a.pageNumber - b.pageNumber).map(toSavedPage),
    created_by: actor.id,
  };
  const { data, error } = await requireSupabase().from('mmpi_records').upsert(payload, { onConflict: 'idempotency_key' }).select('id,created_at').single();
  if (error || !data) throw new Error('Kayıt Supabase veritabanına yazılamadı. Bilgileriniz korunuyor; tekrar deneyin.');
  const row = data as { id?: unknown; created_at?: unknown };
  if (typeof row.id !== 'string' || typeof row.created_at !== 'string') throw new Error('Supabase kayıt yanıtı geçersiz.');
  return { id: row.id, createdAt: row.created_at };
}

export async function listOwnRecords(): Promise<RecordSummary[]> {
  const { data, error } = await requireSupabase().from('mmpi_records')
    .select('id,client_first_name,client_last_name,application_date,created_at')
    .order('created_at', { ascending: false }).limit(100);
  if (error) throw new Error('Kayıtlarınız alınamadı.');
  return (data ?? []).map(row => {
    const value = row as { id?: unknown; client_first_name?: unknown; client_last_name?: unknown; application_date?: unknown; created_at?: unknown };
    if (typeof value.id !== 'string' || typeof value.client_first_name !== 'string' || typeof value.client_last_name !== 'string' ||
      typeof value.application_date !== 'string' || typeof value.created_at !== 'string') throw new Error('Kayıt listesi geçersiz.');
    return { id: value.id, firstName: value.client_first_name, lastName: value.client_last_name,
      applicationDate: value.application_date, createdAt: value.created_at };
  });
}
