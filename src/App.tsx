import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AuthGate } from './components/AuthGate';
import { AdminPanel } from './components/AdminPanel';
import { CaseWorkspace } from './components/CaseWorkspace';
import { MyRecordsPanel } from './components/MyRecordsPanel';
import { Icon } from './components/Icon';
import { PAGE_COUNT, formDefinition } from './form/layout';
import { CONTACT_EMAIL, COPYRIGHT_HOLDER, COPYRIGHT_YEAR, SITE_LABEL, SITE_URL } from './form/attribution';
import { downloadFormPdf, openFormPdf, printFormPdf, FORM_PDF_FILE_NAME, PRINT_SETTINGS_HINT } from './print/formPdf';
import type { AuthenticatedUser } from './auth/authTypes';
import { displayName } from './auth/userDisplay';

type Workspace = 'case' | 'form' | 'records' | 'admin';

type SignedInAppProps = { user: AuthenticatedUser; onLogout: () => void };

export default function App() {
  return <AuthGate>{(user, onLogout) => <SignedInApp user={user} onLogout={onLogout} />}</AuthGate>;
}

function SignedInApp({ user, onLogout }: SignedInAppProps) {
  const [printNote, setPrintNote] = useState<'' | 'busy' | 'opened' | 'manual'>('');
  const [workspace, setWorkspace] = useState<Workspace>('case');
  const [recordsTick, setRecordsTick] = useState(0);
  const tabs: Workspace[] =
    user.role === 'ADMIN'
      ? ['case', 'form', 'admin']
      : ['case', 'form', 'records'];
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

  const tabLabel: Record<Workspace, string> = {
    case: 'İşlem',
    form: 'Form',
    records: 'Kayıtlar',
    admin: 'Yönetim',
  };
  const tabIcon: Record<Workspace, 'scan' | 'sheet' | 'file' | 'shield'> = {
    case: 'scan',
    form: 'sheet',
    records: 'file',
    admin: 'shield',
  };

  return (
    <div className="portal-layout">
      <header className="app-header">
        <div className="header-inner">
          <div className="header-left">
            <a className="brand" href="#main" aria-label="MMPI-566 çalışma alanı">
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
                <span className="brand-subtitle">Çalışma alanı</span>
              </div>
            </a>

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
                  <Icon name={tabIcon[tab]} size={16} />
                  <span>{tabLabel[tab]}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="header-user">
            <a
              className="home-site-link"
              href={SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              title="Ana site: halilkaraduman.com.tr"
            >
              <span>halilkaraduman.com.tr</span>
              <Icon name="external" size={13} />
            </a>
            <div className="user-profile-summary">
              <div className="user-avatar-circle">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="user-info-text">
                <strong className="user-full-name">{displayName(user)}</strong>
                <span className={`user-role-badge ${user.role === 'ADMIN' ? 'badge-admin' : 'badge-psy'}`}>
                  {user.role === 'ADMIN' ? 'Yönetici' : 'Psikolog'}
                </span>
              </div>
            </div>
            <button type="button" className="btn-logout" onClick={onLogout} title="Oturumu Kapat">
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      <main className="app-main" id="main">
        <div
          role="tabpanel"
          id="panel-case"
          aria-labelledby="tab-case"
          className={workspace === 'case' ? 'tab-content-active' : 'is-screen-hidden'}
        >
          <CaseWorkspace definition={formDefinition} actor={user} onSaved={() => setRecordsTick(tick => tick + 1)} />
        </div>

        <div
          role="tabpanel"
          id="panel-form"
          aria-labelledby="tab-form"
          className={workspace === 'form' ? 'tab-content-active' : 'is-screen-hidden'}
        >
          <section className="form-kit">
            <div>
              <h1>Optik form</h1>
              <p className="ws-muted">{PAGE_COUNT} sayfa A4 · {FORM_PDF_FILE_NAME}</p>
            </div>
            <div className="form-kit-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setPrintNote('busy');
                  void printFormPdf().then(outcome => setPrintNote(outcome === 'printed' ? 'opened' : 'manual'));
                }}
              >
                <Icon name="print" size={16} />
                Yazdır
              </button>
              <button type="button" className="btn-secondary download-button" onClick={downloadFormPdf}>
                <Icon name="download" size={16} />
                İndir
              </button>
              <button type="button" className="btn-secondary download-button" onClick={() => { void openFormPdf(); }}>
                <Icon name="sheet" size={16} />
                Aç
              </button>
            </div>
            {printNote !== '' && (
              <p className="print-status-note" role="status" aria-live="polite">
                {printNote === 'busy'
                  ? 'PDF hazırlanıyor…'
                  : printNote === 'opened'
                    ? `Yazdırma: ${PRINT_SETTINGS_HINT}.`
                    : `Pencere açılamadı. “Aç” ile yazdırın: ${PRINT_SETTINGS_HINT}.`}
              </p>
            )}
            <ul className="form-kit-list">
              <li>A4, dikey, %100, kenar yok, tek yüz.</li>
              <li>“Sayfaya sığdır” kapalı.</li>
              <li>Köşe kareleri ve QR net çıksın.</li>
              <li>Aynı danışanın 4 sayfasını birlikte okutun.</li>
            </ul>
          </section>
        </div>

        {user.role === 'PSYCHOLOG' && (
          <div
            role="tabpanel"
            id="panel-records"
            aria-labelledby="tab-records"
            className={workspace === 'records' ? 'tab-content-active' : 'is-screen-hidden'}
          >
            <MyRecordsPanel key={recordsTick} />
          </div>
        )}

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

      <footer className="app-footer">
        <div className="footer-inner">
          <span className="copyright-text">
            © {COPYRIGHT_YEAR} <b>{COPYRIGHT_HOLDER}</b>
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
