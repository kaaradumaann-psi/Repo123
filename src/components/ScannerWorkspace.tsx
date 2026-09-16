import { useEffect, useId, useRef, useState } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import { analyzePage } from '../omr/analyzePage';
import { summarizeResults } from '../results/resultNormalizer';
import { acceptPage, createScanSet, missingPageNumbers, removePage, setManualReview, sortedPages } from '../scanner/pageSequence';
import type { ScanSet } from '../scanner/pageSequence';
import { checkAborted, identifyFile, normalizedThumbnail, readImageFile, SCAN_LIMITS, yieldToScreen } from '../scanner/imageIO';
import { readPdfPages } from '../scanner/pdfIO';
import type { SourcePage } from '../scanner/pdfIO';
import { CameraCapture } from './CameraCapture';
import { ScanResultPreview } from './ScanResultPreview';
import { RecordCapture } from './RecordCapture';
import { MyRecordsPanel } from './MyRecordsPanel';
import { Icon } from './Icon';
import '../styles/scanner.css';

export function ScannerWorkspace({ definition, actor }: { definition: FormDefinition; actor: AuthenticatedUser }) {
  return <ScannerSession key={definition.fingerprint} definition={definition} actor={actor} />;
}

function ScannerSession({ definition, actor }: { definition: FormDefinition; actor: AuthenticatedUser }) {
  const [scan, setScan] = useState(createScanSet);
  const current = useRef(scan);
  const alive = useRef(true);
  const job = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('İlk yüklenen sayfa, bu oturumun form set kodunu belirler.');
  const [alerts, setAlerts] = useState<{ id: number; message: string }[]>([]);
  const alertId = useRef(0);
  const [source, setSource] = useState<'files' | 'camera'>('files');
  const [cameraKey, setCameraKey] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [recordsRefresh, setRecordsRefresh] = useState(0);
  const id = useId();
  const pages = sortedPages(scan);
  const missingPages = missingPageNumbers(scan, definition);
  const summary = summarizeResults(definition, pages);
  const selected = pages.find(page => page.pageNumber === selectedNumber) ?? pages[0];

  function commit(next: ScanSet) {
    current.current = next;
    if (alive.current) setScan(next);
  }

  function notify(message: string) {
    if (alive.current) setAlerts(previous => [...previous, { id: ++alertId.current, message }]);
  }

  function releaseImages(state: ScanSet) {
    sortedPages(state).forEach(page => URL.revokeObjectURL(page.previewUrl));
  }

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      job.current?.abort('unmount');
      releaseImages(current.current);
      current.current = createScanSet();
    };
  }, []);

  async function run(files: File[], capture?: SourcePage) {
    if (job.current) {
      notify('Bir okuma işlemi devam ediyor. Lütfen tamamlanmasını bekleyin.');
      return;
    }
    if (!capture && !files.length) return;
    if (files.length > SCAN_LIMITS.files || files.reduce((total, file) => total + file.size, 0) > SCAN_LIMITS.batchBytes) {
      notify('Bir seçimde en çok 12 dosya ve toplam 96 MB desteklenir. Lütfen daha küçük bir grup seçin.');
      return;
    }
    const controller = new AbortController();
    job.current = controller;
    const { signal } = controller;
    setBusy(true);
    let processed = 0,
      accepted = 0,
      rejected = 0;
    const process = async ({ image, sourceName }: SourcePage) => {
      checkAborted(signal);
      processed++;
      setStatus(`${sourceName}: köşe işaretleri, QR kimliği ve optik cevaplar taranıyor…`);
      await yieldToScreen(signal);
      let previewUrl: string | undefined;
      try {
        const result = await analyzePage(image, definition);
        checkAborted(signal);
        const candidate = acceptPage(current.current, result, definition, { sourceName, previewUrl: '' });
        if (!candidate.ok) {
          rejected++;
          notify(`${sourceName}: ${candidate.message}`);
          return;
        }
        if (!result.ok) return;
        previewUrl = await normalizedThumbnail(result.normalized, signal);
        checkAborted(signal);
        const decision = acceptPage(current.current, result, definition, { sourceName, previewUrl });
        if (!decision.ok) {
          rejected++;
          notify(`${sourceName}: ${decision.message}`);
          return;
        }
        commit(decision.state);
        previewUrl = undefined;
        accepted++;
        setSelectedNumber(result.pageNumber);
        setStatus(result.warnings.length
          ? `${sourceName}: ${result.pageNumber}. sayfa kabul edildi; otomatik güvenilir cevap yok. ${result.warnings[0]}`
          : `${sourceName}: ${result.pageNumber}. sayfa başarıyla okundu ve kabul edildi.`);
      } catch (error) {
        checkAborted(signal);
        rejected++;
        notify(`${sourceName}: Okuma tamamlanamadı. ${error instanceof Error ? error.message : 'Lütfen görseli tekrar deneyin.'}`);
      } finally {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
      await yieldToScreen(signal);
    };
    try {
      if (capture) await process(capture);
      for (const file of files) {
        checkAborted(signal);
        if (processed >= SCAN_LIMITS.batchPages) {
          notify('Bir işlemde 24 sayfa sınırına ulaşıldı. Kalan dosyalar işlenmedi.');
          return;
        }
        setStatus(`${file.name}: dosya hazırlanıyor…`);
        try {
          const kind = await identifyFile(file);
          checkAborted(signal);
          if (kind === 'pdf') {
            for await (const page of readPdfPages(file, signal, SCAN_LIMITS.batchPages - processed)) {
              await process(page);
            }
          } else {
            await process({ image: await readImageFile(file, signal), sourceName: file.name });
          }
        } catch (error) {
          checkAborted(signal);
          rejected++;
          notify(`${file.name}: ${error instanceof Error ? error.message : 'Dosya açılamadı.'}`);
        }
      }
    } catch (error) {
      if (!signal.aborted) notify(`İşlem duraklatıldı: ${error instanceof Error ? error.message : 'Beklenmeyen hata.'}`);
    } finally {
      if (job.current === controller) {
        job.current = null;
        if (alive.current) {
          setBusy(false);
          if (!signal.aborted) {
            setStatus(`Tarama tamamlandı: ${accepted} sayfa onaylandı${rejected > 0 ? `, ${rejected} sayfa reddedildi` : ''}.`);
          } else if (signal.reason !== 'reset') {
            setStatus('İşlem iptal edildi.');
          }
        }
      }
    }
  }

  function reset() {
    job.current?.abort('reset');
    releaseImages(current.current);
    commit(createScanSet());
    setSelectedNumber(null);
    setAlerts([]);
    setCameraKey(previous => previous + 1);
    setConfirmReset(false);
    setStatus('Tarama oturumu sıfırlandı. Yeni form setinin ilk sayfasını yükleyebilirsiniz.');
  }

  return (
    <div className="scanner-layout-container" aria-labelledby={`${id}-title`} data-clinical-transfer-allowed="false">
      {/* Başlık ve Sıfırlama */}
      <div className="scanner-hero-header">
        <div>
          <span className="section-badge badge-primary">Kamera tarama</span>
          <h2 id={`${id}-title`}>Kağıt formları saniyeler içinde tarayın</h2>
          <p className="scanner-hero-sub">
            Kamerayla çekin veya dosya yükleyin. Dört sayfa tamamlandığında danışan kaydını oluşturabilirsiniz.
          </p>
        </div>
        <div className="hero-actions">
          {pages.length > 0 && (
            <button type="button" className="btn-secondary btn-danger-soft" onClick={() => setConfirmReset(true)}>
              <Icon name="refresh" size={15} />
              <span>Yeni Set / Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {confirmReset && (
        <div className="reset-confirm-box" role="dialog" aria-label="Sıfırlama Onayı">
          <Icon name="alert" size={20} className="text-danger" />
          <div className="confirm-text">
            <strong>Mevcut tarama oturumu sıfırlansın mı?</strong>
            <p>Okunmuş tüm sayfalar ve manuel düzeltmeler temizlenecektir.</p>
          </div>
          <div className="confirm-btn-group">
            <button type="button" className="btn-danger btn-sm" onClick={reset}>
              Evet, Sıfırla
            </button>
            <button type="button" className="btn-secondary btn-sm" onClick={() => setConfirmReset(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* Tarama Paneli: Yükleme & Kamera */}
      <div className="scanner-input-card card-elevated">
        <div className="scan-mode-tabs" role="tablist">
          <button
            type="button"
            className={`mode-tab ${source === 'files' ? 'active' : ''}`}
            onClick={() => setSource('files')}
          >
            <Icon name="file" size={16} />
            <span>Dosya Yükle (PDF / görüntü)</span>
          </button>
          <button
            type="button"
            className={`mode-tab ${source === 'camera' ? 'active' : ''}`}
            onClick={() => setSource('camera')}
          >
            <Icon name="camera" size={16} />
            <span>Kamera ile Canlı Çekim</span>
          </button>
        </div>

        {source === 'files' ? (
          <div className="dropzone-area">
            <label htmlFor={`${id}-files`} className="dropzone-label">
              <div className="dropzone-icon">
                <Icon name="download" size={28} />
              </div>
              <strong className="dropzone-title">Formları buraya bırakın</strong>
              <span className="dropzone-desc">Fotoğraf veya PDF yükleyin. Dört köşesi görünen, düz duran sayfalar en net sonucu verir.</span>
              <span className="btn-primary dropzone-btn">Dosya Seç</span>
            </label>
            <input
              id={`${id}-files`}
              type="file"
              accept="image/*,application/pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.pdf"
              multiple
              disabled={busy}
              className="file-input-hidden"
              onChange={event => {
                const files = Array.from(event.currentTarget.files ?? []);
                event.currentTarget.value = '';
                void run(files);
              }}
            />
            <p className="dropzone-hint">
              Sayfayı düz tutun; köşe işaretleri ve üstteki kare kod net görünsün.
            </p>
          </div>
        ) : (
          <CameraCapture key={cameraKey} disabled={busy} onCapture={(image, sourceName) => run([], { image, sourceName })} />
        )}

        {/* Canlı Durum ve İptal */}
        <div className="scanner-status-strip">
          <div className="status-live-indicator">
            {busy ? <div className="spinner-sm" /> : <div className="live-dot" />}
            <span role="status" aria-live="polite">
              {status}
            </span>
          </div>
          {busy && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                job.current?.abort('cancel');
                setStatus('İşlem durduruluyor...');
              }}
            >
              Okumayı Durdur
            </button>
          )}
        </div>
      </div>

      {/* Uyarılar */}
      {alerts.length > 0 && (
        <div className="scanner-alerts-list">
          {alerts.map(alert => (
            <div className="status-banner warning-banner" key={alert.id} role="alert">
              <Icon name="alert" size={18} />
              <span style={{ flex: 1 }}>{alert.message}</span>
              <button
                type="button"
                className="close-banner-btn"
                onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
              >
                <Icon name="close" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* İlerleme ve Sayfa Durumu */}
      <div className="scanner-progress-card card-elevated">
        <div className="progress-top-row">
          <div>
            <h3 className="section-heading-sm">Set Tamamlanma Durumu</h3>
            <p className="section-subtext">
              {pages.length === 4 ? (
                <span className="text-success font-semibold">Tüm 4 sayfa başarıyla okundu. Danışan bilgilerini kaydedebilirsiniz.</span>
              ) : (
                <span>Eksik sayfalar: {missingPages.length ? missingPages.map(p => `${p}. sayfa`).join(', ') : 'Yok'}.</span>
              )}
            </p>
          </div>
          <div className="batch-badge">
            <span className="batch-label">Set Kodu</span>
            <code className="batch-code">{scan.batchId ?? '—'}</code>
          </div>
        </div>

        {/* 4 Sayfa Önizleme Kartları */}
        <div className="scan-pages-grid">
          {[...definition.pages]
            .sort((a, b) => a.pageNumber - b.pageNumber)
            .map(expected => {
              const page = scan.pages[expected.pageNumber];
              const isSelected = selected?.pageNumber === expected.pageNumber;

              return (
                <button
                  type="button"
                  key={expected.pageNumber}
                  disabled={!page}
                  className={`page-card-box ${page ? 'is-ready' : 'is-missing'} ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedNumber(expected.pageNumber)}
                >
                  <div className="page-card-thumb">
                    {page ? (
                      <img src={page.previewUrl} alt={`${expected.pageNumber}. sayfa önizleme`} />
                    ) : (
                      <div className="missing-page-placeholder">
                        <Icon name="file" size={24} />
                        <span>Eksik</span>
                      </div>
                    )}
                  </div>
                  <div className="page-card-meta">
                    <strong>{expected.pageNumber}. Sayfa</strong>
                    <small>
                      {page
                        ? Object.keys(page.reviews).length
                          ? `${Object.keys(page.reviews).length} manuel düzeltme`
                          : page.quality.ok ? 'Sorunsuz okundu' : 'İnceleme gerekli'
                        : 'Görsel bekleniyor'}
                    </small>
                  </div>
                  {page && <div className="card-check-pill"><Icon name="check" size={12} /></div>}
                </button>
              );
            })}
        </div>
      </div>

      {/* İstatistikler */}
      {pages.length > 0 && (
        <div className="scanner-metrics-strip">
          <div className="stat-item">
            <span className="stat-label">Okunan Madde</span>
            <strong className="stat-val">{summary.readItems} / {summary.expectedItems}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Güvenilir Cevap</span>
            <strong className="stat-val text-success">{summary.reliableAnswers}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">İnceleme Bekleyen</span>
            <strong className="stat-val text-warning">{summary.ambiguous + summary.multiple}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Boş Bırakılan</span>
            <strong className="stat-val">{summary.blank}</strong>
          </div>
          <div className="stat-item">
            <span className="stat-label">Manuel Düzeltilen</span>
            <strong className="stat-val text-primary">{summary.manuallyReviewed}</strong>
          </div>
        </div>
      )}

      {/* Sayfa İnceleme ve Düzeltme Alanı */}
      {selected ? (
        <ScanResultPreview
          key={selected.pageNumber}
          page={selected}
          definition={definition}
          onReview={(itemId, review) => {
            try {
              commit(setManualReview(current.current, definition, selected.pageNumber, itemId, review));
            } catch (error) {
              notify(error instanceof Error ? error.message : 'İnceleme kaydedilemedi.');
            }
          }}
          onRemove={() => {
            const page = current.current.pages[selected.pageNumber];
            if (page) URL.revokeObjectURL(page.previewUrl);
            commit(removePage(current.current, selected.pageNumber));
            setStatus(`${selected.pageNumber}. sayfa kaldırıldı. Yeniden tarayabilirsiniz.`);
          }}
        />
      ) : null}

      {/* Danışan Bilgileri Kaydetme */}
      <RecordCapture
        key={`${scan.batchId ?? 'empty'}:${Object.keys(scan.pages).sort((a, b) => Number(a) - Number(b)).join('-')}`}
        definition={definition}
        scan={scan}
        actor={actor}
        onSaved={() => setRecordsRefresh(prev => prev + 1)}
      />

      {/* Psikolog Arşivi */}
      {actor.role === 'PSYCHOLOG' && <MyRecordsPanel key={recordsRefresh} />}
    </div>
  );
}
