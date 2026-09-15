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
import { downloadFormPdf, printFormPdf, FORM_PDF_FILE_NAME } from './print/formPdf';
import type { AuthenticatedUser } from './auth/authTypes';
import { displayName } from './auth/userDisplay';

type Workspace = 'form' | 'scan' | 'admin';

type SignedInAppProps = { user: AuthenticatedUser; onLogout: () => void };

export default function App() {
  return <AuthGate>{(user, onLogout) => <SignedInApp user={user} onLogout={onLogout} />}</AuthGate>;
}

function SignedInApp({ user, onLogout }: SignedInAppProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [workspace, setWorkspace] = useState<Workspace>('scan');
  const [batchId] = useState(createBatchId);
  const tabs: Workspace[] = user.role === 'ADMIN' ? ['scan', 'form', 'admin'] : ['scan', 'form'];
  const tabRefs = useRef<Partial<Record<Workspace, HTMLButtonElement | null>>>({});

  function activateTab(next: Workspace) {
    setWorkspace(next);
    tabRefs.current[next]?.focus();
  }

  function onTablistKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = Math.max(0, tabs.indexOf(workspace));
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
        ? tabs.length - 1
        : event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? (current + 1) % tabs.length
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
        ? (current - 1 + tabs.length) % tabs.length
        : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    activateTab(tabs[nextIndex]!);
  }

  return (
    <div className="portal-layout">
      {/* Üst Navigasyon Barı */}
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <a className="brand" href="#main" aria-label="MMPI-566 Ana Sayfa">
              <span className="brand-mark">
                <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                  <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
                  <circle cx="10" cy="10" r="1.8" fill="currentColor" />
                  <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="16" cy="16" r="1.8" fill="currentColor" />
                </svg>
              </span>
              <div className="brand-text">
                <strong className="brand-title">MMPI-566</strong>
                <span className="brand-subtitle">Optik Okuma Portalı</span>
              </div>
            </a>

            {/* Çalışma Alanı Navigasyonu */}
            <nav className="workspace-tabs" role="tablist" aria-label="Çalışma alanı" onKeyDown={onTablistKeyDown}>
              {tabs.map(tab => (
                <button
                  type="button"
                  role="tab"
                  key={tab}
                  id={`tab-${tab}`}
                  ref={element => {
                    tabRefs.current[tab] = element;
                  }}
                  aria-selected={workspace === tab}
                  aria-controls={`panel-${tab}`}
                  tabIndex={workspace === tab ? 0 : -1}
                  onClick={() => activateTab(tab)}
                  className={`portal-tab ${workspace === tab ? 'active' : ''}`}
                >
                  <Icon
                    name={tab === 'scan' ? 'scan' : tab === 'form' ? 'sheet' : 'shield'}
                    size={16}
                  />
                  <span>
                    {tab === 'scan'
                      ? 'Test Değerlendirme'
                      : tab === 'form'
                      ? 'Optik Form Hazırla'
                      : 'Yönetim Paneli'}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Sağ Kullanıcı Profili & Çıkış */}
          <div className="header-user">
            <div className="user-profile-summary">
              <div className="user-avatar-circle">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="user-info-text">
                <strong className="user-full-name">{displayName(user)}</strong>
                <span className={`user-role-badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-psy'}`}>
                  {user.role === 'ADMIN' ? 'Yönetici' : 'Klinik Psikolog'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-logout" onClick={onLogout} title="Oturumu Kapat">
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="app-main" id="main">
        {/* PANEL 1: TARA VE İNCELE (TEST DEĞERLENDİRME) */}
        <div
          role="tabpanel"
          id="panel-scan"
          aria-labelledby="tab-scan"
          className={workspace === 'scan' ? 'tab-content-active' : 'is-screen-hidden'}
        >
          <ScannerWorkspace definition={formDefinition} actor={user} />
        </div>

        {/* PANEL 2: OPTİK FORM VE YAZDIRMA */}
        <div
          role="tabpanel"
          id="panel-form"
          aria-labelledby="tab-form"
          className={workspace === 'form' ? 'tab-content-active' : 'is-screen-hidden'}
        >
          <section className="form-prep-hero">
            <div className="hero-text-side">
              <span className="section-badge badge-primary">Form Hazırlığı</span>
              <h1>MMPI-566 Optik Cevap Formu</h1>
              <p>
                A4 standartlarında basılı optik form setini yazdırabilir veya yüksek kaliteli orijinal PDF dosyasını indirebilirsiniz.
              </p>
            </div>
            <div className="hero-cta-group">
              <button type="button" className="btn-primary btn-print" onClick={() => { void printFormPdf(); }}>
                <Icon name="print" size={18} />
                <div className="btn-multiline">
                  <span>Tüm Sayfaları Yazdır</span>
                  <small>{PAGE_COUNT} Sayfa · A4 Tek Yüz</small>
                </div>
              </button>
              <button type="button" className="btn-secondary btn-download download-button" onClick={downloadFormPdf}>
                <Icon name="download" size={18} />
                <div className="btn-multiline">
                  <span>PDF Olarak İndir</span>
                  <small>{FORM_PDF_FILE_NAME}</small>
                </div>
              </button>
            </div>
          </section>

          <div className="form-workspace-grid">
            <aside className="form-sidebar-panel" aria-label="Form bilgisi ve sayfa seçimi">
              <PageNavigation current={currentPage} onChange={setCurrentPage} />

              <div className="print-guide-card card-elevated">
                <h3 className="guide-title">
                  <Icon name="print" size={18} />
                  <span>Yazdırma Rehberi</span>
                </h3>
                <dl className="guide-spec-list">
                  <div>
                    <dt>Kağıt Boyutu:</dt>
                    <dd>A4 (210 × 297 mm)</dd>
                  </div>
                  <div>
                    <dt>Ölçek Ayarı:</dt>
                    <dd>%100 (Gerçek Boyut)</dd>
                  </div>
                  <div>
                    <dt>Kenar Boşluğu:</dt>
                    <dd>Yok (Sıfır)</dd>
                  </div>
                  <div>
                    <dt>Baskı Şekli:</dt>
                    <dd>Tek Yüz · Siyah Beyaz</dd>
                  </div>
                </dl>
                <p className="guide-note">
                  "Sayfaya sığdır" seçeneğini işaretlemeyiniz. Köşe hizalama karelerinin ve QR kodun net çıkması optik okuyucunun hatasız çalışmasını sağlar.
                </p>
              </div>
            </aside>

            <div className="form-preview-column">
              <FormPreview
                current={currentPage}
                onChange={setCurrentPage}
                definition={formDefinition}
                batchId={batchId}
              />
              <div className="document-meta-strip">
                <span>{FORM.totalItems} Madde Alanı</span>
                <span>•</span>
                <span>{PAGE_COUNT} Sayfalık A4 Form Seti</span>
                <span>•</span>
                <span>Ø {String(FORM.bubbleDiameterMm).replace('.', ',')} mm Optik Kabarcık</span>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL 3: ADMİN YÖNETİM PANELİ */}
        {user.role === 'ADMIN' && (
          <div
            role="tabpanel"
            id="panel-admin"
            aria-labelledby="tab-admin"
            className={workspace === 'admin' ? 'tab-content-active' : 'is-screen-hidden'}
          >
            <AdminPanel admin={user} />
          </div>
        )}
      </main>

      {/* Alt Bilgi */}
      <footer className="app-footer">
        <div className="footer-inner">
          <span className="copyright-text">
            © {COPYRIGHT_YEAR} {COPYRIGHT_HOLDER} · Tüm hakları saklıdır.
          </span>
          <nav className="app-footer-links" aria-label="Yazar bağlantıları">
            <a href={SITE_URL} target="_blank" rel="noopener noreferrer">
              {SITE_LABEL}
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
