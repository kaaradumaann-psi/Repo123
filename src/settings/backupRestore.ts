/**
 * Yedeği toplama ve geri yükleme (veritabanı hattı).
 *
 * Toplama: RLS'in bu hesaba gösterdiği kayıtlar (psikolog: kendi kayıtları,
 * yönetici: tüm kayıtlar) tam veri yükü + uzman notu ile, raporlar metinleriyle
 * birlikte JSON'a yazılır.
 *
 * Geri yükleme: aynı `idempotency_key` ile bulutta kayıt varsa DOKUNULMAZ
 * (klinik veri değişmez). Eksik kayıtlar eklenir, uzman notu geri yazılır ve
 * rapor metinleri kayda bağlanır. Kayıt oluşturma yalnızca aktif psikolog
 * hesabında mümkündür (RLS: `is_psychologist()`); yönetici hesabı yalnızca
 * antet ayarını geri yükleyebilir.
 */
import type { AuthenticatedUser } from '../auth/authTypes';
import { requireSupabase } from '../auth/supabaseClient';
import {
  createDataRecord,
  getRecordDetail,
  listOwnRecordsPaged,
  updateExpertNotes,
  type RecordInput,
} from '../records/supabaseRecords';
import { createReport, getReport, getSettings, listReports, saveSettings } from '../reports/reportsApi';
import {
  BACKUP_TARGET_BYTES,
  MAX_BACKUP_RECORDS,
  MAX_BACKUP_REPORTS,
  buildBackupFile,
  payloadBytes,
  planRestore,
  sanitizeLetterhead,
  type BackupCounts,
  type BackupFile,
  type BackupRecord,
  type BackupReport,
} from './backup';

export type BackupProgress = (message: string, done: number, total: number) => void;

/* ------------------------------------------------------------------ */
/*  Yedek indir                                                        */
/* ------------------------------------------------------------------ */

export async function collectBackup(actor: AuthenticatedUser, onProgress?: BackupProgress): Promise<BackupFile> {
  onProgress?.('Antet ayarları okunuyor…', 0, 1);
  const letterhead = await getSettings(actor.id);

  const records: BackupRecord[] = [];
  const reports: BackupReport[] = [];
  /** Yedekteki kayıt ↔ bulut satır kimliği eşleşmesi (rapor listesini okumak için). */
  const recordIdByKey = new Map<string, string>();
  const counts: BackupCounts = {
    records: 0,
    reports: 0,
    recordsTruncated: false,
    reportsTruncated: false,
    reportsSkipped: 0,
  };

  let page = 0;
  let estimatedBytes = 0;
  let total = 0;
  const pageSize = 50;
  let more = true;
  while (more) {
    const result = await listOwnRecordsPaged({ page, pageSize });
    total = result.count ?? records.length;
    for (const summary of result.records) {
      if (records.length >= MAX_BACKUP_RECORDS) {
        counts.recordsTruncated = true;
        break;
      }
      onProgress?.('Kayıtlar okunuyor…', records.length + 1, total);
      const detail = await getRecordDetail(summary.id);
      const record: BackupRecord = {
        idempotencyKey: detail.idempotencyKey ?? summary.id,
        createdAt: detail.createdAt,
        client: {
          firstName: detail.firstName,
          lastName: detail.lastName,
          gender: (detail.gender ?? 'Belirtmek istemiyor') as BackupRecord['client']['gender'],
          age: detail.age ?? 0,
          occupation: detail.occupation ?? '',
          education: detail.education ?? '',
          applicationDate: detail.applicationDate,
          requestedBy: detail.requestedBy ?? '',
        },
        rawOmrAnswers: detail.rawOmrAnswers,
        expertNotes: detail.expertNotes ?? '',
        notesUpdatedAt: detail.notesUpdatedAt ?? null,
      };
      records.push(record);
      recordIdByKey.set(record.idempotencyKey, summary.id);
      estimatedBytes += payloadBytes(record);
      if (estimatedBytes >= BACKUP_TARGET_BYTES) counts.recordsTruncated = true;
      if (estimatedBytes >= BACKUP_TARGET_BYTES) break;
    }
    if (counts.recordsTruncated) break;
    more = result.hasMore;
    page += 1;
  }

  // Raporlar: metinler kayıttan yeniden üretilemez, bu yüzden yedeğe girer.
  for (const record of records) {
    if (reports.length >= MAX_BACKUP_REPORTS) {
      counts.reportsTruncated = true;
      break;
    }
    const recordId = recordIdByKey.get(record.idempotencyKey);
    if (!recordId) continue;
    onProgress?.('Raporlar okunuyor…', reports.length, MAX_BACKUP_REPORTS);
    let list: { id: string }[] = [];
    try {
      list = await listReports(recordId);
    } catch {
      counts.reportsSkipped += 1;
      continue;
    }
    for (const item of list) {
      if (reports.length >= MAX_BACKUP_REPORTS) {
        counts.reportsTruncated = true;
        break;
      }
      try {
        const full = await getReport(item.id, recordId);
        if (JSON.stringify(full.content).length > 1_500_000) {
          counts.reportsSkipped += 1;
          continue;
        }
        reports.push({
          recordId,
          recordKey: record.idempotencyKey,
          title: full.title,
          templateName: full.template_name,
          status: full.status === 'completed' ? 'completed' : 'draft',
          createdAt: full.created_at,
          updatedAt: full.updated_at,
          content: full.content,
          sourceDataSnapshot: full.source_data_snapshot ?? null,
        });
      } catch {
        counts.reportsSkipped += 1;
      }
    }
  }

  counts.records = records.length;
  counts.reports = reports.length;
  onProgress?.('Yedek hazırlanıyor…', 1, 1);
  return buildBackupFile({ userId: actor.id, letterhead, records, reports, counts });
}

/* ------------------------------------------------------------------ */
/*  Yedekten yükle                                                     */
/* ------------------------------------------------------------------ */

export type RestoreFailure = { label: string; message: string };

export type RestoreOutcome = {
  inserted: number;
  skipped: number;
  failed: RestoreFailure[];
  notesRestored: number;
  reportsInserted: number;
  reportsSkipped: number;
  letterheadRestored: boolean;
  truncated: boolean;
  recordsAllowed: boolean;
};

/** Bulutta mevcut idempotency anahtarlarını parça parça okur (RLS'e tabidir). */
async function loadExistingKeys(keys: readonly string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  const chunks: string[][] = [];
  for (let index = 0; index < keys.length; index += 50) chunks.push(keys.slice(index, index + 50));
  for (const chunk of chunks) {
    const { data, error } = await requireSupabase()
      .from('mmpi_records')
      .select('id,idempotency_key')
      .in('idempotency_key', chunk);
    if (error) {
      throw new Error(
        'Mevcut kayıtlar okunamadı; geri yükleme güvenli biçimde durduruldu. Bağlantıyı kontrol edip tekrar deneyin.',
      );
    }
    for (const row of data ?? []) {
      const value = row as { id?: unknown; idempotency_key?: unknown };
      if (typeof value.id === 'string' && typeof value.idempotency_key === 'string') {
        found.set(value.idempotency_key, value.id);
      }
    }
  }
  return found;
}

function toRecordInput(record: BackupRecord): RecordInput {
  return {
    client: {
      firstName: record.client.firstName,
      lastName: record.client.lastName,
      gender: record.client.gender,
      age: record.client.age,
      occupation: record.client.occupation,
      education: record.client.education,
      applicationDate: record.client.applicationDate,
      requestedBy: record.client.requestedBy,
    },
  };
}

function label(record: BackupRecord): string {
  return `${record.client.firstName} ${record.client.lastName}`.trim() || 'İsimsiz kayıt';
}

export async function restoreBackup(
  file: BackupFile,
  actor: AuthenticatedUser,
  onProgress?: BackupProgress,
): Promise<RestoreOutcome> {
  const outcome: RestoreOutcome = {
    inserted: 0,
    skipped: 0,
    failed: [],
    notesRestored: 0,
    reportsInserted: 0,
    reportsSkipped: 0,
    letterheadRestored: false,
    truncated: file.counts.recordsTruncated,
    recordsAllowed: actor.role === 'PSYCHOLOG' && actor.active === true,
  };

  onProgress?.('Mevcut kayıtlar karşılaştırılıyor…', 0, file.records.length);
  const existing = await loadExistingKeys(file.records.map(record => record.idempotencyKey));
  const plan = planRestore(file, new Set(existing.keys()));
  outcome.skipped = plan.skippedRecords.length;

  const targetIdByKey = new Map<string, string>(existing);

  if (outcome.recordsAllowed) {
    for (const record of plan.toInsert) {
      onProgress?.(`${label(record)} ekleniyor…`, outcome.inserted + outcome.skipped, file.records.length);
      try {
        const created = await createDataRecord(toRecordInput(record), actor, record.idempotencyKey, record.rawOmrAnswers);
        outcome.inserted += 1;
        targetIdByKey.set(record.idempotencyKey, created.id);
        if (record.expertNotes.trim()) {
          try {
            await updateExpertNotes(created.id, record.expertNotes);
            outcome.notesRestored += 1;
          } catch {
            /* not geri yazılamadı: kayıt yine de geri yüklendi, hata listesi şişirilmez */
          }
        }
      } catch (cause) {
        outcome.failed.push({
          label: label(record),
          message: cause instanceof Error ? cause.message : 'Kayıt eklenemedi.',
        });
      }
    }
  } else {
    outcome.failed.push({
      label: 'Kayıt geri yükleme',
      message:
        'Test kaydı geri yükleme yalnızca aktif psikolog hesabıyla yapılabilir; yönetici hesabı klinik kayıt oluşturamaz (RLS).',
    });
  }

  // Rapor metinleri: aynı başlıkta bir rapor o kayıtta varsa yeniden eklenmez.
  if (outcome.recordsAllowed && file.reports.length > 0) {
    const reportsByKey = new Map<string, BackupReport[]>();
    for (const report of file.reports) {
      if (!report.recordKey) continue;
      const list = reportsByKey.get(report.recordKey) ?? [];
      list.push(report);
      reportsByKey.set(report.recordKey, list);
    }
    for (const [key, list] of reportsByKey) {
      const recordId = targetIdByKey.get(key);
      if (!recordId) {
        outcome.reportsSkipped += list.length;
        continue;
      }
      let existingTitles = new Set<string>();
      try {
        existingTitles = new Set((await listReports(recordId)).map(item => item.title));
      } catch {
        outcome.reportsSkipped += list.length;
        continue;
      }
      for (const report of list) {
        if (existingTitles.has(report.title) || !report.sourceDataSnapshot) {
          outcome.reportsSkipped += 1;
          continue;
        }
        onProgress?.('Raporlar geri yükleniyor…', outcome.reportsInserted, file.reports.length);
        try {
          await createReport({
            mmpi_record_id: recordId,
            created_by: actor.id,
            template_id: null,
            template_name: report.templateName,
            title: report.title,
            content: report.content,
            source_data_snapshot: report.sourceDataSnapshot,
          });
          existingTitles.add(report.title);
          outcome.reportsInserted += 1;
        } catch {
          outcome.reportsSkipped += 1;
        }
      }
    }
  }

  const letterhead = sanitizeLetterhead(file.letterhead);
  if (Object.values(letterhead).some(value => value !== '')) {
    try {
      await saveSettings(actor.id, letterhead);
      outcome.letterheadRestored = true;
    } catch (cause) {
      outcome.failed.push({
        label: 'Antet ayarları',
        message: cause instanceof Error ? cause.message : 'Antet geri yüklenemedi.',
      });
    }
  }

  onProgress?.('Geri yükleme tamamlandı.', 1, 1);
  return outcome;
}

export function restoreSummary(outcome: RestoreOutcome): string {
  const parts: string[] = [];
  parts.push(`${outcome.inserted} kayıt eklendi`);
  if (outcome.skipped > 0) parts.push(`${outcome.skipped} kayıt zaten vardı (dokunulmadı)`);
  if (outcome.notesRestored > 0) parts.push(`${outcome.notesRestored} uzman notu geri yazıldı`);
  if (outcome.reportsInserted > 0) parts.push(`${outcome.reportsInserted} rapor geri yüklendi`);
  if (outcome.reportsSkipped > 0) parts.push(`${outcome.reportsSkipped} rapor atlandı`);
  if (outcome.letterheadRestored) parts.push('antet ayarları geri yüklendi');
  if (outcome.truncated) parts.push('yedek kısmiydi (liste kırpılmış)');
  if (outcome.failed.length > 0) parts.push(`${outcome.failed.length} işlem başarısız`);
  return `${parts.join(' · ')}.`;
}
