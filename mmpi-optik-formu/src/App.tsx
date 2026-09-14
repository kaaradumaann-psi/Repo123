import { useState } from 'react';
import { PageNavigation } from './components/PageNavigation';
import { FormPreview } from './components/FormPreview';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import { Icon } from './components/Icon';
import { FORM, PAGE_COUNT, formDefinition } from './form/layout';
import { createBatchId } from './form/pageIdentity';
import { downloadFormPdf, FORM_PDF_FILE_NAME } from './print/formPdf';

export default function App() {
  const [currentPage, setCurrentPage] = useState(0);
  const [workspace, setWorkspace] = useState<'form' | 'scan'>('form');
  const [batchId] = useState(createBatchId);
  return <>
    <header className="app-header">
      <a className="brand" href="#main" aria-label="MMPI-566 optik cevap formuna git">
        <span className="brand-mark"><svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
          <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2" />
          <circle cx="10" cy="10" r="1.8" fill="currentColor" /><circle cx="16" cy="10" r="1.8" stroke="currentColor" />
          <circle cx="10" cy="16" r="1.8" stroke="currentColor" /><circle cx="16" cy="16" r="1.8" fill="currentColor" />
        </svg></span>
        <span><strong>MMPI-566</strong><small>Akıllı Optik Okuyucu</small></span>
      </a>
      <span className="header-divider" /><span className="header-section">{workspace === 'form' ? 'Form hazırlığı' : 'Tara ve incele'}</span>
      <span className="template-badge">YERLEŞİM ŞABLONU <span>{formDefinition.version}</span></span>
    </header>

    <main className="app-main" id="main">
      <div className="workspace-tabs" role="tablist" aria-label="Çalışma alanı">
        <button type="button" role="tab" aria-selected={workspace === 'form'} onClick={() => setWorkspace('form')}>Optik form</button>
        <button type="button" role="tab" aria-selected={workspace === 'scan'} onClick={() => setWorkspace('scan')}>Tara ve gözden geçir</button>
      </div>

      <section className="page-intro" hidden={workspace !== 'form'}>
        <div><p className="eyebrow">BASILI FORM / {FORM.templateId}</p><h1 id="page-title">Optik cevap formu</h1>
          <p className="intro-description">Kimlik alanları yalnızca ilk sayfada. Her sayfada QR ve köşe işaretleri; D/Y daireleri tüm sayfalarda aynı milimetre ızgaradadır.</p></div>
        <div className="intro-actions">
          <button type="button" className="print-button" onClick={() => window.print()}><Icon name="print" />
            <span>Tüm sayfaları yazdır<small>{PAGE_COUNT} sayfa · A4 · aynı QR seti</small></span><Icon name="right" size={16} /></button>
          <button type="button" className="download-button" onClick={downloadFormPdf}><Icon name="download" />
            <span>Hazır PDF'i indir<small>{FORM_PDF_FILE_NAME} · okuyucuyla doğrulandı</small></span></button>
        </div>
      </section>

      <div className={`form-workspace${workspace === 'form' ? '' : ' is-screen-hidden'}`}>
        <aside className="form-sidebar" aria-label="Form bilgisi ve sayfa seçimi">
          <PageNavigation current={currentPage} onChange={setCurrentPage} />
          <section className="print-guide" aria-labelledby="print-guide-title">
            <h2 id="print-guide-title"><Icon name="print" size={17} />Yazdırma ayarları</h2>
            <dl><div><dt>Kağıt / yön</dt><dd>A4 / Dikey</dd></div>
              <div><dt>Ölçek</dt><dd>%100 · Gerçek boyut</dd></div>
              <div><dt>Kenar boşlukları</dt><dd>Yok</dd></div>
              <div><dt>Üst / alt bilgi</dt><dd>Kapalı</dd></div>
              <div><dt>Baskı</dt><dd>Tek yüz · Siyah-beyaz</dd></div></dl>
            <p>Beyaz, temiz kağıt kullanın. “Sayfaya sığdır” seçeneğini açmayın; köşe işaretleri ve QR kesilmemelidir. Dört sayfayı aynı oturumda yazdırın.</p>
          </section>
          <section className="scope-note" aria-labelledby="scope-title"><Icon name="info" size={17} />
            <div><h2 id="scope-title">Teknik şablon</h2><p>Madde metni veya cevap anahtarı içermez. D/Y düzeni yetkili form ve uygulama yönergesiyle doğrulanmalıdır. Klinik puanlama bu sürümde yoktur.</p></div>
          </section>
        </aside>
        <div className="preview-column">
          <FormPreview current={currentPage} onChange={setCurrentPage} definition={formDefinition} batchId={batchId} />
          <div className="document-meta"><span>{FORM.totalItems} madde alanı <b>·</b> {PAGE_COUNT} ayrı A4 sayfa <b>·</b> Ø {String(FORM.bubbleDiameterMm).replace('.', ',')} mm daire</span>
            <span>Şablon: {FORM.templateId}</span></div>
        </div>
      </div>

      <div className={workspace === 'scan' ? '' : 'is-screen-hidden'}>
        <ScannerWorkspace definition={formDefinition} />
      </div>

      <footer className="app-footer"><span>Köşe referansları, sayfa QR’si ve sabit işaretleme koordinatları ortak form tanımından üretilir.</span>
        <span>Gerçek kağıt doğrulaması tamamlanmadan klinik kullanıma açık değildir.</span></footer>
    </main>
  </>;
}
