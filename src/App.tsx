import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AuthGate } from './components/AuthGate';
import { AdminPanel } from './components/AdminPanel';
import { PageNavigation } from './components/PageNavigation';
import { FormPreview } from './components/FormPreview';
import { ScannerWorkspace } from './components/ScannerWorkspace';
import { Icon } from './components/Icon';
import { FORM, PAGE_COUNT, formDefinition } from './form/layout';
import { CONTACT_EMAIL, COPYRIGHT_HOLDER, COPYRIGHT_YEAR, SITE_LABEL, SITE_URL } from './form/attribution';
import { createBatchId } from './form/pageIdentity';
import { downloadFormPdf, FORM_PDF_FILE_NAME } from './print/formPdf';
import type { AuthenticatedUser } from './auth/authTypes';
import { displayName } from './auth/userDisplay';

type Workspace = 'form' | 'scan' | 'admin';

type SignedInAppProps = { user: AuthenticatedUser; onLogout: () => void };

export default function App() {
  return <AuthGate>{(user, onLogout) => <SignedInApp user={user} onLogout={onLogout} />}</AuthGate>;
}

function SignedInApp({ user, onLogout }: SignedInAppProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace>('form');
  const [batchId] = useState(createBatchId);
  const tabs: Workspace[] = user.role === 'ADMIN' ? ['form', 'scan', 'admin'] : ['form', 'scan'];
  const tabRefs = useRef<Partial<Record<Workspace, HTMLButtonElement | null>>>({});

  function activateTab(next: Workspace) {
    setWorkspace(next);
    tabRefs.current[next]?.focus();
  }

  function onTablistKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = Math.max(0, tabs.indexOf(workspace));
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : event.key === 'ArrowRight' || event.key === 'ArrowDown' ? (current + 1) % tabs.length
      : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? (current - 1 + tabs.length) % tabs.length : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    activateTab(tabs[nextIndex]!);
  }

  function logout() {
    onLogout();
  }

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
      <span className="header-divider" /><span className="header-section">{workspace === 'form' ? 'Form hazırlığı' : workspace === 'scan' ? 'Tara ve incele' : 'Admin paneli'}</span>
      <div className="header-user"><span><strong>{displayName(user)}</strong><small>{user.role === 'ADMIN' ? 'Admin' : 'Psikolog'}</small></span><button type="button" onClick={logout}>Çıkış yap</button></div>
    </header>

    <main className="app-main" id="main">
      <div className="workspace-tabs" role="tablist" aria-label="Çalışma alanı" onKeyDown={onTablistKeyDown}>
        {tabs.map(tab => <button type="button" role="tab" key={tab} id={`tab-${tab}`} ref={element => { tabRefs.current[tab] = element; }}
          aria-selected={workspace === tab} aria-controls={`panel-${tab}`} tabIndex={workspace === tab ? 0 : -1}
          onClick={() => activateTab(tab)}>{tab === 'form' ? 'Optik form' : tab === 'scan' ? 'Tara ve gözden geçir' : 'Admin paneli'}</button>)}
      </div>

      <div role="tabpanel" id="panel-form" aria-labelledby="tab-form" className={workspace === 'form' ? '' : 'is-screen-hidden'}>
        <section className="page-intro">
          <div><h1 id="page-title">Optik cevap formu</h1><p className="intro-description">Kimlik alanları yalnızca ilk sayfada; tüm sayfalar aynı ızgara düzenini kullanır.</p></div>
          <div className="intro-actions">
            <button type="button" className="print-button" onClick={() => window.print()}><Icon name="print" />
              <span>Tüm sayfaları yazdır<small>{PAGE_COUNT} sayfa · A4 · aynı QR seti</small></span><Icon name="right" size={16} /></button>
            <button type="button" className="download-button" onClick={downloadFormPdf}><Icon name="download" />
              <span>Hazır PDF'i indir<small>{FORM_PDF_FILE_NAME} · okuyucuyla doğrulandı</small></span></button>
          </div>
        </section>
        <div className="form-workspace">
          <aside className="form-sidebar" aria-label="Form bilgisi ve sayfa seçimi">
            <PageNavigation current={currentPage} onChange={setCurrentPage} />
            <section className="print-guide" aria-labelledby="print-guide-title">
              <h2 id="print-guide-title"><Icon name="print" size={17} />Yazdırma ayarları</h2>
              <dl><div><dt>Kağıt / yön</dt><dd>A4 / Dikey</dd></div><div><dt>Ölçek</dt><dd>%100 · Gerçek boyut</dd></div><div><dt>Kenar boşlukları</dt><dd>Yok</dd></div><div><dt>Üst / alt bilgi</dt><dd>Kapalı</dd></div><div><dt>Baskı</dt><dd>Tek yüz · Siyah-beyaz</dd></div></dl>
              <p>Beyaz, temiz kağıt kullanın. “Sayfaya sığdır” seçeneğini açmayın; köşe işaretleri ve QR kesilmemelidir. Dört sayfayı aynı oturumda yazdırın.</p>
            </section>
          </aside>
          <div className="preview-column"><FormPreview current={currentPage} onChange={setCurrentPage} definition={formDefinition} batchId={batchId} />
            <div className="document-meta"><span>{FORM.totalItems} madde alanı <b>·</b> {PAGE_COUNT} ayrı A4 sayfa <b>·</b> Ø {String(FORM.bubbleDiameterMm).replace('.', ',')} mm daire</span></div>
          </div>
        </div>
      </div>

      <div role="tabpanel" id="panel-scan" aria-labelledby="tab-scan" className={workspace === 'scan' ? '' : 'is-screen-hidden'}>
        <ScannerWorkspace definition={formDefinition} actor={user} />
      </div>

      {user.role === 'ADMIN' && <div role="tabpanel" id="panel-admin" aria-labelledby="tab-admin" className={workspace === 'admin' ? '' : 'is-screen-hidden'}>
        <AdminPanel admin={user} />
      </div>}
    </main>

    <footer className="app-footer"><span>© {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER}</span><nav className="app-footer-links" aria-label="Yazar bağlantıları">
      <a href={SITE_URL} target="_blank" rel="noopener noreferrer">{SITE_LABEL}</a><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
    </nav></footer>
  </>;
}
