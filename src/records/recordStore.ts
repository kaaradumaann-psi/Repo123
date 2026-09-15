import type { FormDefinition, Point } from '../omr/omrTypes';
import type { ItemReadResult, ManualReview, QualityReport, StoredScanPage } from '../results/scanResultTypes';
import type { AuthenticatedUser } from '../auth/authStore';

export const RECORD_STORAGE_KEY = 'mmpi566.records.v1';

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

export type MMPIRecord = {
  id: string;
  client: {
    firstName: string;
    lastName: string;
    gender: 'Kadın' | 'Erkek' | 'Belirtmek istemiyor' | 'Diğer';
    age: number;
    occupation: string;
    education: string;
    applicationDate: string;
    requestedBy: string;
  };
  answers: SavedAnswerPage[];
  createdBy: { id: string; name: string; identifier: string };
  createdAt: string;
};

export type RecordInput = Omit<MMPIRecord, 'id' | 'answers' | 'createdBy' | 'createdAt'>;

function store(): Storage | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}

function readRecords(): MMPIRecord[] {
  const source = store();
  if (!source) return [];
  try {
    const parsed: unknown = JSON.parse(source.getItem(RECORD_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed as MMPIRecord[] : [];
  } catch { return []; }
}

function persist(records: MMPIRecord[]): void {
  const source = store();
  if (!source) throw new Error('Yerel kayıt alanı kullanılamıyor.');
  try { source.setItem(RECORD_STORAGE_KEY, JSON.stringify(records)); }
  catch { throw new Error('Kayıt tarayıcı depolama sınırını aşıyor. Verileri dışa aktarma özelliği bu sürümde yoktur.'); }
}

function randomId(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return `MMPI-${Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

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
    return !!page && page.fingerprint === definition.fingerprint && page.batchId.length === 24 && page.items.length > 0;
  });
}

function toSavedPage(page: StoredScanPage): SavedAnswerPage {
  return { pageId: page.pageId, pageNumber: page.pageNumber, batchId: page.batchId, fingerprint: page.fingerprint,
    items: page.items.map(item => ({ ...item, measurements: item.measurements.map(measurement => ({ ...measurement })) })),
    quality: { ...page.quality, metrics: { ...page.quality.metrics }, reasons: [...page.quality.reasons] },
    sourceCorners: page.sourceCorners.map(point => ({ ...point })), warnings: [...page.warnings], sourceName: page.sourceName,
    manualReviews: Object.fromEntries(Object.entries(page.reviews).map(([key, review]) => [key, { ...review }])), };
}

export function createRecord(input: RecordInput, pages: readonly StoredScanPage[], definition: FormDefinition, actor: AuthenticatedUser): MMPIRecord {
  if (!canCreateRecord(pages, definition)) throw new Error('Dört sayfanın tamamı ve taranmış cevaplar kabul edilmeden kayıt yapılamaz.');
  if (actor.role !== 'PSYCHOLOG') throw new Error('Kayıt yalnızca Psikolog rolüyle oluşturulabilir.');
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.applicationDate) ||
    Number.isNaN(Date.parse(`${client.applicationDate}T00:00:00Z`))) throw new Error('Uygulanma tarihi geçersiz.');
  const record: MMPIRecord = { id: randomId(), client, answers: pages.slice().sort((a, b) => a.pageNumber - b.pageNumber).map(toSavedPage),
    createdBy: { id: actor.id, name: `${actor.firstName} ${actor.lastName}`.trim(), identifier: actor.identifier }, createdAt: new Date().toISOString() };
  persist([...readRecords(), record]);
  return record;
}

export function listRecords(): MMPIRecord[] { return readRecords(); }
