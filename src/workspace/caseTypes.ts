import { FORM } from '../form/layout';
import type { Gender, RecordInput, SavedAnswerPage } from '../records/supabaseRecords';

export const ITEM_COUNT = FORM.totalItems;

export type IntakeGender = Extract<Gender, 'Erkek' | 'Kadın'>;
export type EducationLevel = 'İlkokul' | 'Ortaokul' | 'Lise' | 'Lisans' | 'Lisansüstü';
export type MaritalStatus = 'Bekar' | 'Evli' | 'Boşanmış' | 'Dul';
export type FollowUpStatus = 'Ayaktan' | 'Yatış';
export type EntryMethod = 'quick' | 'raw' | 'omr';
export type CaseStep = 'home' | 'intake' | 'method' | 'entry' | 'review';

/** `undefined` = henüz girilmedi, `null` = bilinçli boş, D/Y = cevap. */
export type ItemAnswer = 'D' | 'Y' | null | undefined;

export type ClientIntake = {
  firstName: string;
  lastName: string;
  gender: IntakeGender | '';
  age: number;
  testDate: string;
  testDuration: string;
  occupation: string;
  followUp: FollowUpStatus | '';
  education: EducationLevel | '';
  maritalStatus: MaritalStatus | '';
  applicationReason: string;
  clinicalContext: string;
};

export type RawScoreKey =
  | 'blank' | 'L' | 'F' | 'K'
  | 'Hs' | 'D' | 'Hy' | 'Pd' | 'Mf' | 'Pa' | 'Pt' | 'Sc' | 'Ma' | 'Si';

export type RawScores = Record<RawScoreKey, number | ''>;

export const EDUCATION_OPTIONS: EducationLevel[] = ['İlkokul', 'Ortaokul', 'Lise', 'Lisans', 'Lisansüstü'];
export const MARITAL_OPTIONS: MaritalStatus[] = ['Bekar', 'Evli', 'Boşanmış', 'Dul'];
export const FOLLOW_UP_OPTIONS: FollowUpStatus[] = ['Ayaktan', 'Yatış'];

export const RAW_SCORE_FIELDS: {
  key: RawScoreKey;
  label: string;
  max: number;
  group: 'validity' | 'clinical';
  kRaw?: boolean;
}[] = [
  { key: 'blank', label: 'Boş', max: ITEM_COUNT, group: 'validity' },
  { key: 'L', label: 'L', max: 15, group: 'validity' },
  { key: 'F', label: 'F', max: 64, group: 'validity' },
  { key: 'K', label: 'K', max: 30, group: 'validity' },
  { key: 'Hs', label: 'Hs', max: 33, group: 'clinical', kRaw: true },
  { key: 'D', label: 'D', max: 60, group: 'clinical' },
  { key: 'Hy', label: 'Hy', max: 60, group: 'clinical' },
  { key: 'Pd', label: 'Pd', max: 50, group: 'clinical', kRaw: true },
  { key: 'Mf', label: 'Mf', max: 60, group: 'clinical' },
  { key: 'Pa', label: 'Pa', max: 40, group: 'clinical' },
  { key: 'Pt', label: 'Pt', max: 48, group: 'clinical', kRaw: true },
  { key: 'Sc', label: 'Sc', max: 78, group: 'clinical', kRaw: true },
  { key: 'Ma', label: 'Ma', max: 46, group: 'clinical', kRaw: true },
  { key: 'Si', label: 'Si', max: 70, group: 'clinical' },
];

export const RAW_SCORE_MAX: Record<RawScoreKey, number> = Object.fromEntries(
  RAW_SCORE_FIELDS.map(field => [field.key, field.max]),
) as Record<RawScoreKey, number>;

export type CaseMeta = {
  kind: 'case-meta';
  version: 1;
  method: EntryMethod;
  client: {
    firstName: string;
    lastName: string;
    gender: IntakeGender;
    age: number;
    testDate: string;
    testDuration: string;
    occupation: string;
    followUp: FollowUpStatus | '';
    education: EducationLevel | '';
    maritalStatus: MaritalStatus | '';
    applicationReason: string;
    clinicalContext: string;
  };
};

export type QuickEntryPayload = {
  kind: 'quick-entry';
  version: 1;
  answers: Array<'D' | 'Y' | null>;
};

export type RawScoresPayload = {
  kind: 'raw-scores';
  version: 1;
  scales: Record<RawScoreKey, number>;
};

export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function emptyClientIntake(): ClientIntake {
  return {
    firstName: '',
    lastName: '',
    gender: '',
    age: 0,
    testDate: todayIsoDate(),
    testDuration: '',
    occupation: '',
    followUp: '',
    education: '',
    maritalStatus: '',
    applicationReason: '',
    clinicalContext: '',
  };
}

export function emptyRawScores(): RawScores {
  return {
    blank: '', L: '', F: '', K: '',
    Hs: '', D: '', Hy: '', Pd: '', Mf: '', Pa: '', Pt: '', Sc: '', Ma: '', Si: '',
  };
}

export function emptyAnswers(): ItemAnswer[] {
  return Array.from({ length: ITEM_COUNT }, () => undefined);
}

export function mapQuickKey(key: string): ItemAnswer | 'ignore' {
  if (key === '1') return 'D';
  if (key === '2') return 'Y';
  if (key === '0') return null;
  return 'ignore';
}

export function answerLabel(answer: ItemAnswer): string {
  if (answer === 'D') return 'D';
  if (answer === 'Y') return 'Y';
  if (answer === null) return 'Boş';
  return '—';
}

export function countAnswers(answers: readonly ItemAnswer[]) {
  let entered = 0, correct = 0, wrong = 0, blank = 0, pending = 0;
  for (const answer of answers) {
    if (answer === undefined) pending++;
    else {
      entered++;
      if (answer === 'D') correct++;
      else if (answer === 'Y') wrong++;
      else blank++;
    }
  }
  return { entered, correct, wrong, blank, pending, total: answers.length };
}

export function parseRawScore(value: string, max: number): number | null {
  if (value.trim() === '') return null;
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > max) return null;
  return number;
}

export function rawScoresComplete(scores: RawScores): boolean {
  return RAW_SCORE_FIELDS.every(field => {
    const value = scores[field.key];
    if (value === '') return false;
    return Number.isInteger(value) && value >= 0 && value <= field.max;
  });
}

export function validateIntake(client: ClientIntake): string | null {
  if (!client.firstName.trim() || !client.lastName.trim()) return 'Ad ve soyad zorunludur.';
  if (client.gender !== 'Erkek' && client.gender !== 'Kadın') return 'Cinsiyet seçiniz.';
  if (!Number.isInteger(client.age) || client.age < 1 || client.age > 120) return 'Yaş 1–120 arasında olmalıdır.';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(client.testDate) || Number.isNaN(Date.parse(`${client.testDate}T00:00:00Z`))) {
    return 'Test tarihi geçersiz.';
  }
  return null;
}

/** Sütunlar: ad/soyad/cinsiyet/yaş/tarih + isteğe bağlı meslek/eğitim/başvuru (boş string, sahte tire yok). */
function requireGender(client: ClientIntake): IntakeGender {
  if (client.gender !== 'Erkek' && client.gender !== 'Kadın') throw new Error('Cinsiyet seçiniz.');
  return client.gender;
}

export function recordInputFromIntake(client: ClientIntake): RecordInput {
  const error = validateIntake(client);
  if (error) throw new Error(error);
  return {
    client: {
      firstName: client.firstName.trim(),
      lastName: client.lastName.trim(),
      gender: requireGender(client),
      age: client.age,
      occupation: client.occupation.trim(),
      education: client.education.trim(),
      applicationDate: client.testDate,
      requestedBy: client.applicationReason.trim(),
    },
  };
}

export function buildCaseMeta(method: EntryMethod, client: ClientIntake): CaseMeta {
  const error = validateIntake(client);
  if (error) throw new Error(error);
  return {
    kind: 'case-meta',
    version: 1,
    method,
    client: {
      firstName: client.firstName.trim(),
      lastName: client.lastName.trim(),
      gender: requireGender(client),
      age: client.age,
      testDate: client.testDate,
      testDuration: client.testDuration.trim(),
      occupation: client.occupation.trim(),
      followUp: client.followUp,
      education: client.education,
      maritalStatus: client.maritalStatus,
      applicationReason: client.applicationReason.trim(),
      clinicalContext: client.clinicalContext.trim(),
    },
  };
}

export function buildQuickPayload(answers: readonly ItemAnswer[]): QuickEntryPayload {
  if (answers.length !== ITEM_COUNT) throw new Error('Madde sayısı 566 olmalıdır.');
  return {
    kind: 'quick-entry',
    version: 1,
    answers: answers.map(answer => (answer === undefined ? null : answer)),
  };
}

export function buildRawPayload(scores: RawScores): RawScoresPayload {
  if (!rawScoresComplete(scores)) throw new Error('Ham puan alanları eksik veya sınır dışında.');
  const scales = {} as Record<RawScoreKey, number>;
  for (const field of RAW_SCORE_FIELDS) scales[field.key] = scores[field.key] as number;
  return { kind: 'raw-scores', version: 1, scales };
}

function kindOf(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const kind = (value as { kind?: unknown }).kind;
  return typeof kind === 'string' ? kind : null;
}

export function isOmrPage(value: unknown): value is SavedAnswerPage {
  if (!value || typeof value !== 'object') return false;
  if (kindOf(value)) return false;
  const page = value as SavedAnswerPage;
  return typeof page.pageNumber === 'number' && Array.isArray(page.items);
}

export function parseRecordPayload(raw: unknown[]) {
  const items = Array.isArray(raw) ? raw : [];
  const meta = items.find(item => kindOf(item) === 'case-meta') as CaseMeta | undefined;
  const legacyContext = items.find(item => kindOf(item) === 'client-context') as
    | {
        kind: 'client-context';
        followUp?: string | null;
        maritalStatus?: string | null;
        testDuration?: string | null;
        applicationReason?: string | null;
        clinicalContext?: string | null;
      }
    | undefined;
  const legacyMethod = items.find(item => kindOf(item) === 'entry-method') as
    | { kind: 'entry-method'; method?: EntryMethod }
    | undefined;
  const quick = items.find(item => kindOf(item) === 'quick-entry') as
    | (QuickEntryPayload & { answers?: Array<'D' | 'Y' | null> })
    | undefined;
  const rawScores = items.find(item => kindOf(item) === 'raw-scores') as
    | (RawScoresPayload & { scales?: Record<string, number | ''> })
    | undefined;
  const omrPages = items.filter(isOmrPage);
  const method: EntryMethod | undefined =
    meta?.method ??
    legacyMethod?.method ??
    (quick ? 'quick' : rawScores ? 'raw' : omrPages.length ? 'omr' : undefined);
  const client = meta?.client;
  return {
    method,
    client,
    followUp: client?.followUp || legacyContext?.followUp || '',
    maritalStatus: client?.maritalStatus || legacyContext?.maritalStatus || '',
    testDuration: client?.testDuration || legacyContext?.testDuration || '',
    applicationReason: client?.applicationReason || legacyContext?.applicationReason || '',
    clinicalContext: client?.clinicalContext || legacyContext?.clinicalContext || '',
    quickAnswers: quick?.answers,
    rawScales: rawScores?.scales,
    omrPages,
  };
}

export function methodLabel(method: EntryMethod): string {
  return method === 'quick' ? 'Hızlı veri girişi' : method === 'raw' ? 'Ham puan' : 'OMR / Kamera';
}
