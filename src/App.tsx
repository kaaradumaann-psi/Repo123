import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AuthGate } from './components/AuthGate';
import type { AuthFlowOrigin } from './components/AuthGate';
import { DesignPreviewPage } from './components/DesignPreviewPage';
import { AdminPanel } from './components/AdminPanel';
import { CaseWorkspace } from './components/CaseWorkspace';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { FaqPage } from './components/FaqPage';
import { FormKit } from './components/FormKit';
import { InfoPageShell } from './components/InfoPageShell';
import { MyRecordsPanel } from './components/MyRecordsPanel';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { RecordDetailPage } from './components/RecordDetailPage';
import { SourcesPage } from './components/SourcesPage';
import { SiteFooter } from './components/SiteFooter';
import { TermsPage } from './components/TermsPage';
import { Icon } from './components/Icon';
import { formDefinition } from './form/layout';
import { SITE_URL } from './form/attribution';
import type { AuthenticatedUser } from './auth/authTypes';
import { supabaseConfig } from './auth/supabaseClient';
import { displayName } from './auth/userDisplay';
import { navigate, useRoute } from './router';
import type { AppRoute } from './router';

type Workspace = 'case' | 'form' | 'records' | 'admin';

type SignedInAppProps = { user: AuthenticatedUser; onLogout: () => void; flowOrigin: AuthFlowOrigin };

const TAB_PATH: Record<Workspace, string> = {
  case: '/islem',
  form: '/form',
  records: '/kayitlar',
  admin: '/yonetim',
};

/** Uygulama kökü: yol '/' ise Landing (İşlem sekmesinin 'home' adımı) açılır. */
const LANDING_PATHS = new Set(['/', '/index.html', '/optik-form.html']);

function resolveWorkspace(route: AppRoute): Workspace | null {
  switch (route.page) {
    case 'home':
    case 'islem':
      return 'case';
    case 'form':
      return 'form';
    case 'kayitlar':
      return 'records';
    case 'yonetim':
      return 'admin';
    default:
      return null;
  }
}

export default function App() {
  const route = useRoute();

  // Bilgi sayfaları (SSS, Gizlilik & KVKK, Kullanım Koşulları, Kaynakça):
  // oturum ve yapılandırmadan bağımsız, kendi kabuğu ve alt bilgisiyle açılır.
  if (route.page === 'sss') {
    return (
      <InfoPageShell kicker="Yardım" title="Sıkça Sorulan Sorular" onBack={() => navigate('/')}>
        <FaqPage />
      </InfoPageShell>
    );
  }
  if (route.page === 'gizlilik') {
    return (
      <InfoPageShell kicker="Yasal" title="Gizlilik & KVKK Politikası" onBack={() => navigate('/')}>
        <PrivacyPolicyPage />
      </InfoPageShell>
    );
  }
  if (route.page === 'kullanim') {
    return (
      <InfoPageShell kicker="Yasal" title="Kullanım Koşulları" onBack={() => navigate('/')}>
        <TermsPage />
      </InfoPageShell>
    );
  }
  if (route.page === 'kaynaklar') {
    return (
      <InfoPageShell kicker="Kaynaklar" title="Kaynakça" onBack={() => navigate('/')}>
        <SourcesPage />
      </InfoPageShell>
    );
  }

  // Önizleme rotası: kurulum ekranının yanında, gerçek oturum gerektirmeden
  // sonuç ekranlarının tasarımını gösterir. Yapılandırılmış bir kurulumda rota
  // kapalıdır; üretimde yalnızca giriş akışı çalışır.
  if (!supabaseConfig.configured && route.page === 'onizleme') {
    return <DesignPreviewPage onExit={() => navigate('/')} />;
  }

  // 404 — bilinmeyen rotalar
  if (route.page === 'bulunamadi') {
    return (
      <div className="auth-page">
        <main className="auth-shell">
          <div className="empty-state-card">
            <div className="empty-state-icon">
              <Icon name="alert" size={32} />
            </div>
            <h4>Sayfa Bulunamadı</h4>
            <p>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
            <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/')}>
              Ana Sayfaya Dön
            </button>
          </div>
        </main>
        <SiteFooter compact />
      </div>
    );
  }

  return (
    <AuthGate>
      {(user, onLogout, flowOrigin) => <SignedInApp user={user} onLogout={onLogout} flowOrigin={flowOrigin} />}
    </AuthGate>
  );
}

function SignedInApp({ user, onLogout, flowOrigin }: SignedInAppProps) {
  const route = useRoute();

  // Yeni giriş (logout → login dahil) her zaman Landing'e düşer. F5/ayrı sekme
  // (session hydration) mevcut route'u korur — "refresh ≠ yeni login", ve
  // "persisted work ≠ otomatik yönlendirme" kuralları ayrı tutulur.
  useEffect(() => {
    if (flowOrigin === 'signin' && !LANDING_PATHS.has(window.location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [flowOrigin]);

  // Rol bazlı rota koruması
  useEffect(() => {
    if (route.page === 'yonetim' && user.role !== 'ADMIN') {
      navigate('/', { replace: true });
    }
    if (route.page === 'kayitlar' && user.role === 'ADMIN') {
      navigate('/yonetim', { replace: true });
    }
  }, [route.page, user.role]);

  const workspace = resolveWorkspace(route);
  const [recordsTick, setRecordsTick] = useState(0);
  const tabs: Workspace[] =
    user.role === 'ADMIN'
      ? ['case', 'form', 'admin']
      : ['case', 'form', 'records'];
  const tabRefs = useRef<Partial<Record<Workspace, HTMLButtonElement | null>>>({});

  function activateTab(next: Workspace) {
    navigate(TAB_PATH[next]);
    tabRefs.current[next]?.focus();
  }

  function onTablistKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = Math.max(0, tabs.indexOf(workspace ?? 'case'));
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

  const activeWorkspace = workspace;

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
                  aria-selected={activeWorkspace === tab}
                  aria-controls={`panel-${tab}`}
                  tabIndex={activeWorkspace === tab ? 0 : -1}
                  onClick={() => activateTab(tab)}
                  className={`portal-tab ${activeWorkspace === tab ? 'active' : ''}`}
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

      <ConnectivityBanner />

      <main className="app-main" id="main">
        {route.page === 'kayit' ? (
          <RecordDetailPage
            recordId={route.id}
            viewer={user}
            onBack={() => navigate(user.role === 'ADMIN' ? '/yonetim' : '/kayitlar')}
          />
        ) : (
          <>
            <div
              role="tabpanel"
              id="panel-case"
              aria-labelledby="tab-case"
              className={workspace === 'case' ? 'tab-content-active' : 'is-screen-hidden'}
            >
              <CaseWorkspace definition={formDefinition} actor={user} flowOrigin={flowOrigin} onSaved={() => setRecordsTick(tick => tick + 1)} />
            </div>

            <div
              role="tabpanel"
              id="panel-form"
              aria-labelledby="tab-form"
              className={workspace === 'form' ? 'tab-content-active' : 'is-screen-hidden'}
            >
              <FormKit />
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
          </>
        )}
      </main>

      <SiteFooter
        onNewEntry={() => {
          navigate('/islem');
        }}
      />
    </div>
  );
}