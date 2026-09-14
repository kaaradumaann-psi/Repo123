import { useEffect, useId, useRef, useState } from 'react';
import type { FormDefinition } from '../omr/omrTypes';
import { analyzePage } from '../omr/analyzePage';
import { summarizeResults } from '../results/resultNormalizer';
import { acceptPage, createScanSet, missingPageNumbers, removePage, setManualReview, sortedPages } from '../scanner/pageSequence';
import type { ScanSet } from '../scanner/pageSequence';
import { checkAborted, identifyFile, normalizedThumbnail, readImageFile, SCAN_LIMITS, yieldToScreen } from '../scanner/imageIO';
import { readPdfPages } from '../scanner/pdfIO';
import type { SourcePage } from '../scanner/pdfIO';
import { CameraCapture } from './CameraCapture';
import { ScanResultPreview } from './ScanResultPreview';
import '../styles/scanner.css';

export function ScannerWorkspace({ definition }: { definition: FormDefinition }) {
  // A different form definition must never inherit the previous form's scan set.
  return <ScannerSession key={definition.fingerprint} definition={definition} />;
}

function ScannerSession({ definition }: { definition: FormDefinition }) {
  const [scan, setScan] = useState(createScanSet);
  const current = useRef(scan);
  const alive = useRef(true);
  const job = useRef<AbortController | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('İlk kabul edilen sayfa, bu oturumun form setini belirler.');
  const [alerts, setAlerts] = useState<{ id: number; message: string }[]>([]);
  const alertId = useRef(0);
  const [source, setSource] = useState<'files' | 'camera'>('files');
  const [cameraKey, setCameraKey] = useState(0);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const id = useId();
  const pages = sortedPages(scan);
  const missingPages = missingPageNumbers(scan, definition);
  const summary = summarizeResults(definition, pages);
  const selected = pages.find(page => page.pageNumber === selectedNumber) ?? pages[0];

  function commit(next: ScanSet) { current.current = next; if (alive.current) setScan(next); }
  function notify(message: string) {
    if (alive.current) setAlerts(previous => [...previous, { id: ++alertId.current, message }]);
  }
  function releaseImages(state: ScanSet) { sortedPages(state).forEach(page => URL.revokeObjectURL(page.previewUrl)); }

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
    if (job.current) { notify('Bir okuma işlemi sürüyor. Tamamlanmasını bekleyin veya iptal edin.'); return; }
    if (!capture && !files.length) return;
    if (files.length > SCAN_LIMITS.files || files.reduce((total, file) => total + file.size, 0) > SCAN_LIMITS.batchBytes) {
      notify('Bir seçimde en çok 12 dosya ve toplam 96 MB desteklenir. Hiçbir dosya işlenmedi; daha küçük bir grup seçin.'); return;
    }
    const controller = new AbortController();
    job.current = controller;
    const { signal } = controller;
    setBusy(true);
    let processed = 0, accepted = 0, rejected = 0;
    const process = async ({ image, sourceName }: SourcePage) => {
      checkAborted(signal);
      processed++;
      setStatus(`${sourceName}: köşeler, kimlik, kalite ve işaretler okunuyor…`);
      await yieldToScreen(signal);
      let previewUrl: string | undefined;
      try {
        const result = await analyzePage(image, definition);
        checkAborted(signal);
        const candidate = acceptPage(current.current, result, definition, { sourceName, previewUrl: '' });
        if (!candidate.ok) { rejected++; notify(`${sourceName}: ${candidate.message}`); return; }
        if (!result.ok) return;
        previewUrl = await normalizedThumbnail(result.normalized, signal);
        checkAborted(signal);
        const decision = acceptPage(current.current, result, definition, { sourceName, previewUrl });
        if (!decision.ok) { rejected++; notify(`${sourceName}: ${decision.message}`); return; }
        commit(decision.state);
        previewUrl = undefined;
        accepted++;
        setSelectedNumber(result.pageNumber);
        setStatus(`${sourceName}: ${result.pageNumber}. sayfa kabul edildi.`);
      } catch (error) {
        checkAborted(signal);
        rejected++;
        notify(`${sourceName}: Okuma tamamlanamadı. ${error instanceof Error ? error.message : 'Görüntüyü yeniden deneyin.'}`);
      } finally { if (previewUrl) URL.revokeObjectURL(previewUrl); }
      await yieldToScreen(signal);
    };
    try {
      if (capture) await process(capture);
      for (const file of files) {
        checkAborted(signal);
        if (processed >= SCAN_LIMITS.batchPages) {
          notify('Bir işlemde 24 sayfa sınırına ulaşıldı. Kalan dosyalar işlenmedi. Kalanları ayrı seçin.'); return;
        }
        setStatus(`${file.name}: dosya açılıyor…`);
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
          notify(`${file.name}: ${error instanceof Error ? error.message : 'Dosya açılamadı.'} Bu dosyanın kalan sayfaları işlenmedi.`);
        }
      }
    } catch (error) {
      if (!signal.aborted) notify(`İşlem durdu: ${error instanceof Error ? error.message : 'Beklenmeyen hata.'}`);
    } finally {
      if (job.current === controller) {
        job.current = null;
        if (alive.current) {
          setBusy(false);
          if (!signal.aborted) setStatus(`İşlem tamamlandı. ${accepted} sayfa kabul edildi; ${rejected} görüntü veya dosya reddedildi.`);
          else if (signal.reason !== 'reset') setStatus('İşlem iptal edildi. Önceden kabul edilen sayfalar korundu; kalanlar işlenmedi.');
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
    setStatus('Tüm görüntüler ve manuel incelemeler silindi. Yeni setin ilk sayfasını ekleyin.');
  }

  return <section className="scanner-workspace" aria-labelledby={`${id}-title`} data-clinical-transfer-allowed="false">
    <header className="scan-section-heading">
      <div><p className="scan-eyebrow">YEREL OPTİK OKUMA · TEKNİK DOĞRULAMA</p><h2 id={`${id}-title`}>Tara ve gözden geçir</h2>
        <p>Görüntüler yalnızca bu sekmenin belleğinde işlenir. Sunucuya gönderilmez ve kalıcı kaydedilmez.</p></div>
      <button type="button" className="scan-danger" onClick={() => setConfirmReset(true)}>Yeni set / sıfırla</button>
    </header>
    <div className="scan-notice"><strong>Klinik kullanıma açık değildir.</strong> Bu bir teknik doğrulama sürümüdür; gerçek basılı kağıtlarla testler henüz tamamlanmamıştır.
      {' '}Sezgisel güven değerleri doğruluk olasılığı değildir. Puanlama, klinik rapor, dışa aktarma ve veri tabanı bağlantısı yoktur.</div>
    {confirmReset && <section className="scan-reset-confirm" aria-label="Yeni set onayı">
      <p>Tüm sayfalar, görüntüler ve manuel incelemeler silinecek; kamera ve devam eden okuma durdurulacak.</p>
      <div className="scan-actions"><button type="button" className="scan-danger" onClick={reset}>Hepsini sil ve yeni set başlat</button>
        <button type="button" onClick={() => setConfirmReset(false)}>Vazgeç</button></div>
    </section>}
    <div className="scan-input-panel">
      <div className="scan-source-switch" role="group" aria-label="Sayfa ekleme yöntemi">
        <button type="button" aria-pressed={source === 'files'} onClick={() => setSource('files')}>Dosya yükle</button>
        <button type="button" aria-pressed={source === 'camera'} onClick={() => setSource('camera')}>Kamera</button>
      </div>
      {source === 'files' ? <div className="scan-file-picker">
        <label htmlFor={`${id}-files`}><strong>JPG, PNG veya PDF seçin</strong><span>Birden fazla dosya seçilebilir. PDF sayfaları sırayla okunur.</span></label>
        <input id={`${id}-files`} type="file" accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf" multiple disabled={busy}
          aria-describedby={`${id}-limits`} onChange={event => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = '';
            void run(files);
          }} />
        <p id={`${id}-limits`} className="scan-muted">Dosya başına 24 MB; seçimde 12 dosya / 96 MB; PDF başına 12, işlem başına 24 sayfa.
          {' '}Görseller en çok 40 MP; uzun kenar en çok 2800 px olarak işlenir. PDF genişliği yaklaşık 1680 px.</p>
      </div> : <CameraCapture key={cameraKey} disabled={busy} onCapture={(image, sourceName) => run([], { image, sourceName })} />}
      <div className="scan-progress"><p role="status" aria-live="polite">{status}</p>
        {busy && <button type="button" onClick={() => { job.current?.abort('cancel'); setStatus('İptal ediliyor; devam eden hesaplama bitince yeni işlem açılacak…'); }}>Okumayı iptal et</button>}
      </div>
    </div>
    {alerts.length > 0 && <section className="scan-alerts" aria-label="Reddedilen dosya ve sayfalar">
      {alerts.map(alert => <div className="scan-alert" role="alert" key={alert.id}><p>{alert.message}</p>
        <button type="button" aria-label="Bu uyarıyı kapat" onClick={() => setAlerts(previous => previous.filter(item => item.id !== alert.id))}>Kapat</button></div>)}
    </section>}
    <dl className="scan-stats" aria-label="Özgün optik okuma özeti">
      {[
        ['Sayfa', `${summary.acceptedPages} / ${summary.expectedPages}`], ['Ölçülen madde', `${summary.readItems} / ${summary.expectedItems}`],
        ['Güvenilir yanıt', summary.reliableAnswers], ['Belirsiz / tek işaret', summary.ambiguous], ['Çoklu işaret', summary.multiple],
        ['Boş', summary.blank], ['Eksik / okunamayan', summary.missingItems], ['Elle incelenen', summary.manuallyReviewed],
      ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <p className="scan-muted">Sayılar özgün ölçümlere aittir; manuel düzeltmeler bunları değiştirmez. Eksikler, henüz eklenmemiş sayfaları ve başarılı ölçümü olmayan maddeleri içerir.</p>
    <div className="scan-set-info"><p><strong>Set:</strong> <span>{scan.batchId ?? 'Henüz kilitlenmedi'}</span></p>
      <p><strong>Eksik sayfalar:</strong> {missingPages.length ? missingPages.join(', ') : 'Yok; tüm sayfalar eklendi.'}</p>
      <p className="scan-muted">Sayfalar QR kimliğine göre sıralanır. Dosya sırası sayfa numarası değildir. Son sayfayı silmek set kilidini kaldırmaz.</p>
    </div>
    <nav className="scan-page-list" aria-label="Kabul edilen ve eksik sayfalar">
      {[...definition.pages].sort((a, b) => a.pageNumber - b.pageNumber).map(expected => {
        const page = scan.pages[expected.pageNumber];
        return <button type="button" key={expected.pageNumber} disabled={!page} aria-pressed={selected?.pageNumber === expected.pageNumber}
          onClick={() => setSelectedNumber(expected.pageNumber)} aria-label={`${expected.pageNumber}. sayfa, ${page ? 'kabul edildi, incele' : 'eksik'}`}>
          {page ? <img src={page.previewUrl} alt="" /> : <span className="scan-missing-thumb" aria-hidden="true">?</span>}
          <span><strong>{expected.pageNumber}. sayfa</strong><small>{page ? `${Object.keys(page.reviews).length} manuel inceleme` : 'Eksik · ekleyin'}</small></span>
        </button>;
      })}
    </nav>
    {selected ? <ScanResultPreview key={selected.pageNumber} page={selected} definition={definition}
      onReview={(itemId, review) => {
        try { commit(setManualReview(current.current, definition, selected.pageNumber, itemId, review)); }
        catch (error) { notify(error instanceof Error ? error.message : 'İnceleme kaydedilemedi.'); }
      }} onRemove={() => {
        const page = current.current.pages[selected.pageNumber];
        if (page) URL.revokeObjectURL(page.previewUrl);
        commit(removePage(current.current, selected.pageNumber));
        setStatus(`${selected.pageNumber}. sayfa ve incelemeleri silindi. Aynı setten yeniden çekin veya yükleyin.`);
      }} /> : <div className="scan-empty">Henüz kabul edilen sayfa yok. Başlamak için basılı formun görüntüsünü veya PDF dosyasını ekleyin.</div>}
    <p className="scan-local-footer">Sekmeyi kapatmak veya başka ekrana geçmek bu çalışma alanını silebilir. Hiçbir yanıt klinik aktarım için onaylanmaz.</p>
  </section>;
}
