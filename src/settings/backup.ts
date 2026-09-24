/**
 * Yedek dosyası (JSON) — şema, doğrulama ve geri yükleme planı.
 *
 * Psikolog reposundaki "Yedek indir / Yedekten yükle" akışının bulut
 * karşılığı: danışan test kayıtları (tam veri yükü + uzman notu), psikolog
 * rapor metinleri ve antet ayarları tek bir JSON dosyasında taşınır. Kayıtlar
 * bulutta RLS ile korunur; yedek dosyası kimlik ve klinik metin içerdiği için
 * kimseyle paylaşılmamalıdır.
 *
 * Bu modül yalnızca SAF işlevler içerir (dosya adı, doğrulama, plan); veritabanı
 * yazımı `backupRestore.ts` içindedir. Böylece doğrulama mantığı testlerle
 * kilitlenebilir.
 */
import type { ReportSourceData } from '../reports/reportDataAdapter';
import type { Letterhead, ReportDocument } from '../reports/templateEngine';
import { isValidRecordPayload } from '../workspace/caseTypes';

export const BACKUP_FORMAT = 'mmpi-566-backup' as const;
export const BACKUP_VERSION = 1 as const;

/** İçe aktarılacak en büyük dosya (bellek ve tarayıcı sınırı). */
export const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
/** Tek çalıştırmada taşınacak en fazla kayıt; üzeri "kısmi yedek" olarak işaretlenir. */
export const MAX_BACKUP_RECORDS = 300;
/** Yedeğe giren en fazla rapor metni. */
export const MAX_BACKUP_REPORTS = 400;
/** Fazla büyüyeni kırpmak için hedef dosya boyutu. */
export const BACKUP_TARGET_BYTES = 24 * 1024 * 1024;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATA_IMAGE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const MAX_BRAND_IMAGE_CHARS = 1_000_000;

export type BackupClient = {
  firstName: string;
  lastName: string;
  gender: 'Kadın' | 'Erkek' | 'Belirtmek istemiyor' | 'Diğer';
  age: number;
  occupation: string;
  education: string;
  applicationDate: string;
  requestedBy: string;
};

export type BackupRecord = {
  idempotencyKey: string;
  createdAt: string;
  client: BackupClient;
  rawOmrAnswers: unknown[];
  expertNotes: string;
  notesUpdatedAt: string | null;
};

export type BackupReport = {
  /** Yedek alındığı andaki kaynak kayıt kimliği (eşleştirme için). */
  recordId: string;
  recordKey: string;
  title: string;
  templateName: string;
  status: 'draft' | 'completed';
  createdAt: string;
  updatedAt: string;
  content: ReportDocument;
  sourceDataSnapshot: ReportSourceData | null;
};

export type BackupCounts = {
  records: number;
  reports: number;
  recordsTruncated: boolean;
  reportsTruncated: boolean;
  reportsSkipped: number;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  userId: string;
  counts: BackupCounts;
  letterhead: Letterhead;
  records: BackupRecord[];
  reports: BackupReport[];
};

export type BackupParseResult =
  | { ok: true; file: BackupFile }
  | { ok: false; error: string };

/** `MMPI566_yedek_2026-09-24.json` — cihazda tarihle ayırt edilebilir bir ad. */
export function backupFileName(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return `MMPI566_yedek_${parts}.json`;
}

export function emptyCounts(): BackupCounts {
  return { records: 0, reports: 0, recordsTruncated: false, reportsTruncated: false, reportsSkipped: 0 };
}

/** Kaydın veri yükü byte cinsinden (yedek boyutunu kırpmak için ölçüm). */
export function payloadBytes(record: BackupRecord): number {
  try {
    return new TextEncoder().encode(JSON.stringify(record)).byteLength;
  } catch {
    return 0;
  }
}

export function buildBackupFile(input: {
  userId: string;
  exportedAt?: string;
  letterhead: Letterhead;
  records: BackupRecord[];
  reports: BackupReport[];
  counts?: Partial<BackupCounts>;
}): BackupFile {
  const counts: BackupCounts = {
    ...emptyCounts(),
    records: input.records.length,
    reports: input.reports.length,
    ...input.counts,
  };
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: input.exportedAt ?? new Date().toISOString(),
    userId: input.userId,
    counts,
    letterhead: input.letterhead,
    records: input.records,
    reports: input.reports,
  };
}

function asText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

function asIso(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  return Number.isNaN(Date.parse(value)) ? null : value;
}

function asSafeImage(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  return DATA_IMAGE.test(text) && text.length <= MAX_BRAND_IMAGE_CHARS ? text : '';
}

export function sanitizeLetterhead(value: unknown): Letterhead {
  const raw = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
  return {
    name: asText(raw.name, 120),
    title: asText(raw.title, 120),
    institution: asText(raw.institution, 180),
    phone: asText(raw.phone, 40),
    email: asText(raw.email, 120),
    address: asText(raw.address, 240),
    // Görseller yalnızca gömülü veri URI'si olarak taşınır: yedeğe uzak bir
    // bağlantı ya da başka bir şema sokulamaz.
    logo: asSafeImage(raw.logo),
    signature: asSafeImage(raw.signature),
  };
}

function parseClient(value: unknown): BackupClient | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const gender = raw.gender;
  if (gender !== 'Kadın' && gender !== 'Erkek' && gender !== 'Belirtmek istemiyor' && gender !== 'Diğer') return null;
  const age = typeof raw.age === 'number' ? raw.age : Number.NaN;
  if (!Number.isInteger(age) || age < 16 || age > 120) return null;
  const firstName = asText(raw.firstName, 80);
  const lastName = asText(raw.lastName, 80);
  if (!firstName || !lastName) return null;
  const applicationDate = asText(raw.applicationDate, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(applicationDate)) return null;
  return {
    firstName,
    lastName,
    gender,
    age,
    occupation: asText(raw.occupation, 120),
    education: asText(raw.education, 120),
    applicationDate,
    requestedBy: asText(raw.requestedBy, 500),
  };
}

function parseRecord(value: unknown): BackupRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const client = parseClient(raw.client);
  if (!client) return null;
  if (!isValidRecordPayload(raw.rawOmrAnswers)) return null;
  const createdAt = asIso(raw.createdAt) ?? new Date().toISOString();
  const key = typeof raw.idempotencyKey === 'string' && UUID_V4.test(raw.idempotencyKey) ? raw.idempotencyKey : '';
  return {
    // Anahtar geçersizse yeni ve benzersiz bir anahtar üretilir; kayıt yine de
    // geri yüklenebilir, yalnızca "zaten var" eşleştirmesi bu satır için çalışmaz.
    idempotencyKey: key || crypto.randomUUID(),
    createdAt,
    client,
    rawOmrAnswers: raw.rawOmrAnswers,
    expertNotes: asText(raw.expertNotes, 4000),
    notesUpdatedAt: asIso(raw.notesUpdatedAt),
  };
}

function parseReport(value: unknown): BackupReport | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const content = raw.content;
  if (typeof content !== 'object' || content === null) return null;
  const doc = content as Partial<ReportDocument>;
  if (doc.schemaVersion !== 1 || !Array.isArray(doc.blocks)) return null;
  const snapshot = raw.sourceDataSnapshot;
  const parsedSnapshot =
    typeof snapshot === 'object' && snapshot !== null && typeof (snapshot as Partial<ReportSourceData>).source_data_version === 'string'
      ? (snapshot as ReportSourceData)
      : null;
  const status = raw.status === 'completed' ? 'completed' : 'draft';
  return {
    recordId: asText(raw.recordId, 60),
    recordKey: typeof raw.recordKey === 'string' && UUID_V4.test(raw.recordKey) ? raw.recordKey : '',
    title: asText(raw.title, 200) || 'Rapor',
    templateName: asText(raw.templateName, 200) || 'Standart',
    status,
    createdAt: asIso(raw.createdAt) ?? new Date().toISOString(),
    updatedAt: asIso(raw.updatedAt) ?? new Date().toISOString(),
    content: doc as ReportDocument,
    sourceDataSnapshot: parsedSnapshot,
  };
}

/**
 * Yedek dosyasını doğrular. Katı davranır: format/version tutmuyorsa veya hiç
 * geçerli kayıt yoksa dosya reddedilir; tek bozuk satır ise listeye alınmaz ve
 * kullanıcıya kaç satırın okunamadığı söylenir (bkz. `counts`).
 */
export function parseBackupFile(text: string): BackupParseResult {
  if (typeof text !== 'string' || text.trim() === '') return { ok: false, error: 'Dosya boş.' };
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    return { ok: false, error: `Yedek dosyası ${Math.round(MAX_BACKUP_BYTES / (1024 * 1024))} MB sınırını aşıyor.` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Dosya geçerli bir JSON değil.' };
  }
  if (typeof parsed !== 'object' || parsed === null) return { ok: false, error: 'Yedek biçimi tanınmadı.' };
  const raw = parsed as Record<string, unknown>;
  if (raw.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'Bu dosya MMPI-566 yedeği değil.' };
  }
  if (raw.version !== BACKUP_VERSION) {
    return { ok: false, error: 'Yedek sürümü bu uygulamayla uyumlu değil.' };
  }
  const recordsRaw = Array.isArray(raw.records) ? raw.records : [];
  const reportsRaw = Array.isArray(raw.reports) ? raw.reports : [];
  const records = recordsRaw
    .slice(0, MAX_BACKUP_RECORDS)
    .map(parseRecord)
    .filter((record): record is BackupRecord => record !== null);
  const reports = reportsRaw
    .slice(0, MAX_BACKUP_REPORTS)
    .map(parseReport)
    .filter((report): report is BackupReport => report !== null);
  const declared = (typeof raw.counts === 'object' && raw.counts !== null ? raw.counts : {}) as Partial<BackupCounts>;
  const counts: BackupCounts = {
    records: records.length,
    reports: reports.length,
    recordsTruncated: Boolean(declared.recordsTruncated) || recordsRaw.length > MAX_BACKUP_RECORDS,
    reportsTruncated: Boolean(declared.reportsTruncated) || reportsRaw.length > MAX_BACKUP_REPORTS,
    reportsSkipped: reportsRaw.length - reports.length,
  };
  if (records.length === 0 && reports.length === 0) {
    return { ok: false, error: 'Yedekte geri yüklenebilir kayıt veya rapor bulunamadı.' };
  }
  return {
    ok: true,
    file: {
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: asIso(raw.exportedAt) ?? new Date().toISOString(),
      userId: asText(raw.userId, 60),
      counts,
      letterhead: sanitizeLetterhead(raw.letterhead),
      records,
      reports,
    },
  };
}

export type RestorePlan = {
  /** Bulutta bulunmayan, eklenecek kayıtlar (yedekteki sırayla). */
  toInsert: BackupRecord[];
  /** Aynı idempotency anahtarı bulutta olduğu için dokunulmayan kayıtlar. */
  skippedRecords: BackupRecord[];
  /** Geri yükleme sırasında yok sayılacak kayıt sayısı (kırpılmış liste). */
  truncated: boolean;
};

/**
 * "Zaten var olan kayıt korunur" kuralı: aynı `idempotency_key` ile bulutta bir
 * kayıt varsa yeniden yazılmaz (klinik veri değişmez). Kalan kayıtlar eklenir.
 */
export function planRestore(file: BackupFile, existingKeys: ReadonlySet<string>): RestorePlan {
  const toInsert: BackupRecord[] = [];
  const skippedRecords: BackupRecord[] = [];
  const seen = new Set<string>();
  for (const record of file.records) {
    if (existingKeys.has(record.idempotencyKey) || seen.has(record.idempotencyKey)) {
      skippedRecords.push(record);
      continue;
    }
    seen.add(record.idempotencyKey);
    toInsert.push(record);
  }
  return { toInsert, skippedRecords, truncated: file.counts.recordsTruncated };
}

/** Yedekteki raporları kaynak kayda göre gruplar (yalnızca eklenecek kayıtlar). */
export function reportsForRecordKey(file: BackupFile, recordKey: string): BackupReport[] {
  return file.reports.filter(report => report.recordKey === recordKey && report.sourceDataSnapshot !== null);
}

export function backupTotals(file: BackupFile): { records: number; reports: number } {
  return { records: file.counts.records, reports: file.counts.reports };
}
