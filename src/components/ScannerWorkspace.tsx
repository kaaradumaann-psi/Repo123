import { useEffect, useId, useRef, useState } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import type { AuthenticatedUser } from '../auth/authTypes';
import { analyzePage } from '../omr/analyzePage';
import { resolveItem, summarizeResults } from '../results/resultNormalizer';
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
  const batchMb = Math.round(SCAN_LIMITS.batchBytes / (1024 * 1024));

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

  const expectedPages = [...definition.pages].sort((a, b) => a.pageNumber - b.pageNumber);
  const reviewTodo = summary.ambiguous + summary.multiple;

  return (
    <div className="ws" aria-labelledby={`${id}-title`} data-clinical-transfer-allowed="false">
      {/* Çalışma alanı başlığı */}
      <div className="ws-head">
        <div className="ws-head-copy">
          <p className="ws-eyebrow">Optik analiz çalışma alanı</p>
          <h2 id={`${id}-title`}>Form Tarama ve Değerlendirme</h2>
          <p className="ws-sub">
            4 sayfalık form setini dosya olarak yükleyin veya kamerayla çekin; hizalama, sayfa kimliği ve işaret
            analizi cihazınızda çalışır.
          </p>
        </div>
        <div className="ws-head-side">
          <div className="ws-session" aria-label="Oturum durumu">
            <span className="ws-session-pages">
              <strong>{pages.length} / {definition.totalPages}</strong> sayfa
            </span>
            <span className="ws-session-sep" aria-hidden="true" />
            <span className="ws-session-batch">
              Set <code>{scan.batchId ?? '—'}</code>
            </span>
          </div>
          {pages.length > 0 && (
            <button type="button" className="btn-secondary btn-danger-soft btn-sm" onClick={() => setConfirmReset(true)}>
              <Icon name="refresh" size={15} />
              <span>Yeni Set / Sıfırla</span>
            </button>
          )}
        </div>
      </div>

      {confirmReset && (
        <div className="ws-confirm-scrim">
          <div className="ws-confirm-card" role="dialog" aria-modal="true" aria-labelledby={`${id}-reset-title`}>
            <span className="ws-confirm-icon" aria-hidden="true">
              <Icon name="alert" size={22} />
            </span>
            <div className="ws-confirm-text">
              <strong id={`${id}-reset-title`}>Tarama oturumu sıfırlansın mı?</strong>
              <p>Okunmuş tüm sayfalar ve manuel düzeltmeler temizlenecektir. Bu işlem geri alınamaz.</p>
            </div>
            <div className="ws-confirm-actions">
              <button type="button" className="btn-secondary" onClick={() => setConfirmReset(false)}>
                Vazgeç
              </button>
              <button type="button" className="btn-danger" onClick={reset}>
                Evet, Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ws-top">
        {/* Kaynak: yükleme & kamera */}
        <section className="ws-card ws-input" aria-label="Sayfa kaynağı">
          <div className="ws-card-head">
            <div>
              <h3>Sayfa Ekle</h3>
              <p>Her sayfa ayrı ayrı analiz edilir ve sete kabul edilir.</p>
            </div>
            <div className="scan-mode-tabs" role="tablist" aria-label="Sayfa kaynağı seçimi">
              <button
                type="button"
                role="tab"
                aria-selected={source === 'files'}
                className={`mode-tab ${source === 'files' ? 'active' : ''}`}
                onClick={() => setSource('files')}
              >
                <Icon name="file" size={16} />
                <span>Dosya</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={source === 'camera'}
                className={`mode-tab ${source === 'camera' ? 'active' : ''}`}
                onClick={() => setSource('camera')}
              >
                <Icon name="camera" size={16} />
                <span>Kamera</span>
              </button>
            </div>
          </div>

          {source === 'files' ? (
            <div className="dropzone-area">
              <label htmlFor={`${id}-files`} className="dropzone-label">
                <span className="dropzone-icon" aria-hidden="true">
                  <Icon name="download" size={26} />
                </span>
                <strong className="dropzone-title">Form sayfalarını seçin</strong>
                <span className="dropzone-desc">Tekil veya çoklu seçim yapabilirsiniz.</span>
                <span className="dropzone-formats" aria-label="Desteklenen formatlar">
                  {['JPG', 'PNG', 'WEBP', 'HEIC', 'PDF'].map(format => (
                    <code key={format}>{format}</code>
                  ))}
                </span>
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
                En çok {SCAN_LIMITS.files} dosya · toplam {batchMb} MB · Dört köşe karesi ve QR kodu net görünen
                A4 sayfaları kullanın.
              </p>
            </div>
          ) : (
            <CameraCapture key={cameraKey} disabled={busy} onCapture={(image, sourceName) => run([], { image, sourceName })} />
          )}

          {/* Canlı durum konsolu: yalnızca gerçek backend durum metni */}
          <div className="ws-console">
            <div className="ws-console-row">
              <span className={`ws-pulse${busy ? ' is-busy' : ''}`} aria-hidden="true" />
              <span className="ws-console-text" role="status" aria-live="polite">
                {status}
              </span>
              {busy && (
                <button
                  type="button"
                  className="btn-secondary btn-sm"
                  onClick={() => {
                    job.current?.abort('cancel');
                    setStatus('İşlem durduruluyor...');
                  }}
                >
                  Durdur
                </button>
              )}
            </div>
            {busy && (
              <div className="ws-activity" aria-hidden="true">
                <span />
              </div>
            )}
          </div>
        </section>

        {/* Set durumu: 4 sayfa */}
        <section className="ws-card ws-set" aria-label="Set tamamlanma durumu">
          <div className="ws-card-head">
            <div>
              <h3>Set Durumu</h3>
              {pages.length === definition.totalPages ? (
                <p className="ws-set-ok">Tüm {definition.totalPages} sayfa okundu. İnceleyip kaydedebilirsiniz.</p>
              ) : (
                <p>
                  {missingPages.length
                    ? <>Eksik: {missingPages.map(n => `${n}. sayfa`).join(', ')}</>
                    : 'Sayfa bekleniyor.'}
                </p>
              )}
            </div>
            <span className={`ws-set-pill${pages.length === definition.totalPages ? ' is-complete' : ''}`}>
              {pages.length} / {definition.totalPages}
            </span>
          </div>

          <div className="scan-pages-grid">
            {expectedPages.map(expected => {
              const page = scan.pages[expected.pageNumber];
              const isSelected = selected?.pageNumber === expected.pageNumber;
              const reviewCount = page ? Object.keys(page.reviews).length : 0;
              const todoCount = page
                ? expected.items.filter(item => resolveItem(item, page).unresolved).length
                : 0;
              const tone = !page ? 'ghost' : reviewCount > 0 ? 'info' : page.quality.ok ? 'ok' : 'warn';

              return (
                <button
                  type="button"
                  key={expected.pageNumber}
                  disabled={!page}
                  aria-pressed={isSelected}
                  className={`page-card-box ${page ? 'is-ready' : 'is-missing'} ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedNumber(expected.pageNumber)}
                >
                  <span className="page-card-thumb" aria-hidden="true">
                    {page ? (
                      <img src={page.previewUrl} alt="" />
                    ) : (
                      <span className="missing-page-placeholder">
                        <strong>{expected.pageNumber}</strong>
                        <span>Bekliyor</span>
                      </span>
                    )}
                  </span>
                  <span className="page-card-meta">
                    <strong>{expected.pageNumber}. Sayfa</strong>
                    <span className="page-card-range">
                      Madde {expected.firstItem}–{expected.lastItem}
                    </span>
                    <span className={`ws-mini-pill tone-${tone}`}>
                      {!page
                        ? 'Yüklenmedi'
                        : reviewCount > 0
                          ? `${reviewCount} düzeltme`
                          : page.quality.ok
                            ? 'Sorunsuz'
                            : 'İnceleme'}
                    </span>
                    {page && todoCount > 0 && (
                      <span className="page-card-todo">{todoCount} kontrol bekliyor</span>
                    )}
                  </span>
                  {page && (
                    <span className="card-check-pill" aria-hidden="true">
                      <Icon name="check" size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="ws-trust-note">
            <Icon name="shield" size={15} />
            <span>
              Yalnızca güvenilir işaretler algoritma cevabı sayılır; tek işaret ve belirsiz sonuçlar her zaman insan
              incelemesi ister.
            </span>
          </p>
        </section>
      </div>

      {/* Bildirimler: yalnızca gerçek reddetme/hata mesajları */}
      {alerts.length > 0 && (
        <section className="ws-alerts" aria-label="Bildirimler">
          <div className="ws-alerts-head">
            <h3>Bildirimler ({alerts.length})</h3>
            <button type="button" className="btn-text" onClick={() => setAlerts([])}>
              Tümünü kapat
            </button>
          </div>
          <div className="scanner-alerts-list">
            {alerts.map(alert => (
              <div className="status-banner warning-banner" key={alert.id} role="alert">
                <Icon name="alert" size={18} />
                <span className="ws-alert-text">{alert.message}</span>
                <button
                  type="button"
                  className="close-banner-btn"
                  aria-label="Bildirimi kapat"
                  onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Özet: yalnızca gerçek sayımlar */}
      {pages.length > 0 && (
        <section className="ws-summary" aria-label="Oturum özeti">
          <article className="ws-stat">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="scan" size={18} /></span>
            <span className="ws-stat-val">{summary.readItems} <small>/ {summary.expectedItems}</small></span>
            <span className="ws-stat-label">Okunan Madde</span>
          </article>
          <article className="ws-stat tone-ok">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="checkCircle" size={18} /></span>
            <span className="ws-stat-val">{summary.reliableAnswers}</span>
            <span className="ws-stat-label">Güvenilir Cevap</span>
          </article>
          <article className="ws-stat tone-warn">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="eye" size={18} /></span>
            <span className="ws-stat-val">{reviewTodo}</span>
            <span className="ws-stat-label">İnceleme Bekleyen</span>
          </article>
          <article className="ws-stat">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="sheet" size={18} /></span>
            <span className="ws-stat-val">{summary.blank}</span>
            <span className="ws-stat-label">Boş Bırakılan</span>
          </article>
          <article className="ws-stat tone-info">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="user" size={18} /></span>
            <span className="ws-stat-val">{summary.manuallyReviewed}</span>
            <span className="ws-stat-label">Manuel İncelenen</span>
          </article>
          <article className="ws-stat">
            <span className="ws-stat-icon" aria-hidden="true"><Icon name="file" size={18} /></span>
            <span className="ws-stat-val">{summary.acceptedPages} <small>/ {summary.expectedPages}</small></span>
            <span className="ws-stat-label">Kabul Edilen Sayfa</span>
          </article>
        </section>
      )}

      {/* Sayfa inceleme ve düzeltme */}
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

      {/* Danışan bilgileri kaydetme */}
      <RecordCapture
        key={`${scan.batchId ?? 'empty'}:${Object.keys(scan.pages).sort((a, b) => Number(a) - Number(b)).join('-')}`}
        definition={definition}
        scan={scan}
        actor={actor}
        onSaved={() => setRecordsRefresh(prev => prev + 1)}
      />

      {/* Psikolog arşivi */}
      {actor.role === 'PSYCHOLOG' && <MyRecordsPanel key={recordsRefresh} />}
    </div>
  );
}
