import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Icon } from '../components/Icon';
import { clearDraft, loadOutbox, removeOutboxEntry } from '../workspace/draftStorage';
import { recordDeviceAudit } from './auditTrail';
import {
  MAX_BACKUP_BYTES,
  backupFileName,
  parseBackupFile,
  type BackupFile,
} from './backup';
import { collectBackup, restoreBackup, restoreSummary } from './backupRestore';

/**
 * Yedekle / geri yükle penceresi.
 *
 * "Yedek indir": bu hesabın görebildiği kayıtlar (RLS), uzman notları, rapor
 * metinleri ve antet ayarları tek JSON dosyasında indirilir.
 * "Yedekten yükle": aynı `idempotency_key` ile bulutta bulunan kayıtlar
 * dokunulmadan atlanır; eksikler eklenir.
 * "Yerel kaydı sil": yalnızca bu tarayıcıdaki taslak ve çevrimdışı kuyruk
 * temizlenir; bulut kayıtlarına dokunulmaz.
 */
export function BackupDialog({ user, onClose }: { user: AuthenticatedUser; onClose: () => void }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState('');
  const [downloadSummary, setDownloadSummary] = useState('');
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [pendingName, setPendingName] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState('');
  const [error, setError] = useState('');
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [wipeDone, setWipeDone] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  /**
   * Pencere davranışı (repo standardı: ConfirmDialog / MobileNav):
   * odak içeri alınır ve Tab pencere içinde döner, Esc ve arka plan kapatır,
   * arka plan kaydırması kilitlenir. İşlem sürerken (indirme/geri yükleme)
   * kapanma engellenir ki yarım kalan bir yazma sessizce kesilmesin.
   */
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const focusables = (): HTMLElement[] => {
      const container = dialogRef.current;
      if (!container) return [];
      const selector = 'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return [...container.querySelectorAll<HTMLElement>(selector)].filter(element => element.offsetParent !== null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!downloading && !restoring) onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !items.includes(active as HTMLElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !items.includes(active as HTMLElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      body.style.overflow = previousOverflow;
      // Odak, pencereyi açan düğmeye döner (klavye kullanıcısı kaybolmaz).
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [onClose, downloading, restoring]);

  async function handleDownload() {
    setError('');
    setDownloadSummary('');
    setDownloading(true);
    setProgress('Yedek hazırlanıyor…');
    try {
      const file = await collectBackup(user, message => setProgress(message));
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = backupFileName();
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      const partial = file.counts.recordsTruncated || file.counts.reportsTruncated;
      setDownloadSummary(
        `Yedek indirildi: ${file.counts.records} kayıt, ${file.counts.reports} rapor${partial ? ' (kısmi yedek)' : ''}. ` +
          'Dosya danışan kimliği ve klinik metin içerir; bu cihazın dışında da saklayın, kimseyle paylaşmayın.',
      );
      recordDeviceAudit(user.id, {
        action: 'export',
        entity: 'backup',
        entityId: 'backup',
        summary: `Yedek indirildi (${file.counts.records} kayıt, ${file.counts.reports} rapor)`,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Yedek oluşturulamadı. Bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setDownloading(false);
      setProgress('');
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setRestoreResult('');
    setPending(null);
    setPendingName('');
    if (file.size > MAX_BACKUP_BYTES) {
      setError(`Yedek dosyası ${Math.round(MAX_BACKUP_BYTES / (1024 * 1024))} MB sınırını aşıyor.`);
      return;
    }
    try {
      const parsed = parseBackupFile(await file.text());
      if (!parsed.ok) {
        setError(parsed.error);
        return;
      }
      setPending(parsed.file);
      setPendingName(file.name);
    } catch {
      setError('Dosya okunamadı.');
    }
  }

  async function handleRestore() {
    const file = pending;
    if (!file) return;
    setConfirmRestore(false);
    setError('');
    setRestoring(true);
    setProgress('Geri yükleme başlıyor…');
    try {
      const outcome = await restoreBackup(file, user, message => setProgress(message));
      const summary = restoreSummary(outcome);
      setRestoreResult(outcome.failed.length === 0 ? summary : `${summary} Sorunlar: ${outcome.failed.map(item => `${item.label} — ${item.message}`).join(' ')}`);
      recordDeviceAudit(user.id, {
        action: 'import',
        entity: 'backup',
        entityId: 'backup',
        summary: `Yedekten geri yükleme: ${summary}`,
      });
      setPending(null);
      setPendingName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Geri yükleme tamamlanamadı.');
    } finally {
      setRestoring(false);
      setProgress('');
    }
  }

  function handleWipeLocal() {
    setConfirmWipe(false);
    let removed = 0;
    for (const entry of loadOutbox(user.id)) {
      removeOutboxEntry(user.id, entry.idempotencyKey);
      removed += 1;
    }
    clearDraft(user.id);
    recordDeviceAudit(user.id, {
      action: 'delete',
      entity: 'draft',
      entityId: 'local',
      summary: `Bu cihazdaki taslak ve kuyruk silindi (${removed} kuyruk kaydı)`,
    });
    setWipeDone(true);
  }

  return (
    <>
      <div
        className="modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-dialog-title"
        onClick={event => {
          if (event.target === event.currentTarget && !downloading && !restoring) onClose();
        }}
      >
        <div className="modal-container backup-dialog" role="document" ref={dialogRef}>
          <header className="modal-header">
            <div>
              <h2 id="backup-dialog-title">Yedek ve silme</h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              className="icon-close-btn"
              onClick={onClose}
              disabled={downloading || restoring}
              aria-label="Pencereyi kapat"
            >
              <Icon name="close" size={18} />
            </button>
          </header>

          <div className="modal-body backup-body">
            <p className="backup-note">
              Kayıtlar bulutta tutulur; yedek dosyası bu cihaza iner. Dosya danışan kimliği ve klinik metin içerir;
              kimseyle paylaşmayın ve bu cihazın dışında da saklayın. Geri yükleme, aynı anahtarla bulunan kayıtları
              değiştirmez; yalnızca eksik olanları ekler.
            </p>

            <div className="modern-table-card backup-block">
              <div className="backup-block-text">
                <strong>Yedek indir</strong>
                <span>Bu hesabın erişebildiği kayıtlar, uzman notları, rapor metinleri ve antet ayarları.</span>
              </div>
              <button type="button" className="btn-primary btn-sm" onClick={() => void handleDownload()} disabled={downloading}>
                {downloading ? 'Hazırlanıyor…' : 'İndir'}
              </button>
            </div>

            <div className="modern-table-card backup-block">
              <div className="backup-block-text">
                <strong>Yedekten yükle</strong>
                <span>
                  Mevcut kayıtlar korunur; aynı anahtarla bulunan kayıtlar atlanır. En fazla{' '}
                  {Math.round(MAX_BACKUP_BYTES / (1024 * 1024))} MB JSON.
                </span>
                {pendingName !== '' && (
                  <span className="backup-file">
                    {pendingName} · {pending?.counts.records ?? 0} kayıt · {pending?.counts.reports ?? 0} rapor ·{' '}
                    {pending ? new Date(pending.exportedAt).toLocaleDateString('tr-TR') : ''}
                  </span>
                )}
              </div>
              <div className="backup-block-actions">
                <label className="btn-secondary btn-sm backup-file-label">
                  Dosya seç
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={event => void handleFile(event)}
                    disabled={restoring}
                  />
                </label>
                <button
                  type="button"
                  className="btn-primary btn-sm"
                  disabled={!pending || restoring}
                  onClick={() => setConfirmRestore(true)}
                >
                  {restoring ? 'Yükleniyor…' : 'Geri yükle'}
                </button>
              </div>
            </div>

            <div className="modern-table-card backup-block">
              <div className="backup-block-text">
                <strong>Bu cihazdaki taslağı sil</strong>
                <span>Yarım kalan çalışma ve çevrimdışı kuyruk temizlenir. Bulut kayıtları silinmez.</span>
              </div>
              <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmWipe(true)}>
                Sil
              </button>
            </div>

            {progress !== '' && (
              <p className="backup-progress" role="status">
                <span className="spinner-sm" aria-hidden="true" />
                {progress}
              </p>
            )}
            {downloadSummary !== '' && <p className="formulation-saved" role="status">{downloadSummary}</p>}
            {restoreResult !== '' && <p className="formulation-saved" role="status">{restoreResult}</p>}
            {wipeDone && <p className="formulation-saved" role="status">Bu cihazdaki taslak ve kuyruk silindi.</p>}
            {error !== '' && <p className="safety-callout" role="alert">{error}</p>}
          </div>

          <footer className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={downloading || restoring}>
              Kapat
            </button>
          </footer>
        </div>
      </div>

      {confirmRestore && pending && (
        <ConfirmDialog
          title="Yedekten geri yüklensin mi?"
          description={`${pending.counts.records} kayıt ve ${pending.counts.reports} rapor incelendi. Bulutta aynı anahtarla duran kayıtlar değiştirilmez; yalnızca eksik olanlar eklenir ve antet ayarları bu hesaba yazılır.`}
          confirmLabel="Geri yükle"
          tone="neutral"
          busy={restoring}
          onConfirm={() => void handleRestore()}
          onCancel={() => setConfirmRestore(false)}
        />
      )}

      {confirmWipe && (
        <ConfirmDialog
          title="Bu cihazdaki taslak silinsin mi?"
          description="Yarım kalan çalışma ve çevrimdışı kuyruk bu tarayıcıdan silinir. Buluttaki kayıtlar etkilenmez."
          confirmLabel="Taslağı sil"
          onConfirm={handleWipeLocal}
          onCancel={() => setConfirmWipe(false)}
        />
      )}
    </>
  );
}
