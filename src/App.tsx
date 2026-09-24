import { useEffect, useState } from 'react';
import { AuthGate } from './components/AuthGate';
import type { AuthFlowOrigin } from './components/AuthGate';
import { DesignPreviewPage } from './components/DesignPreviewPage';
import { AdminPanel } from './components/AdminPanel';
import { AdminOverview } from './components/AdminOverview';
import { CaseWorkspace } from './components/CaseWorkspace';
import { Dashboard } from './components/Dashboard';
import { ConnectivityBanner } from './components/ConnectivityBanner';
import { FaqPage } from './components/FaqPage';
import { FormKit } from './components/FormKit';
import { InfoPageShell } from './components/InfoPageShell';
import { MyRecordsPanel } from './components/MyRecordsPanel';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { ReportsPage } from './reports/ReportsPage';
import { RecordDetailPage } from './components/RecordDetailPage';
import { SourcesPage } from './components/SourcesPage';
import { SettingsPage } from './settings/SettingsPage';
import { AuditPage } from './settings/AuditPage';
import { SiteFooter } from './components/SiteFooter';
import { MobileNav } from './components/MobileNav';
import { TermsPage } from './components/TermsPage';
import { Icon } from './components/Icon';
import type { IconName } from './components/Icon';
import { formDefinition } from './form/layout';
import type { AuthenticatedUser, UserRole } from './auth/authTypes';
import { supabaseConfig } from './auth/supabaseClient';
import { displayName } from './auth/userDisplay';
import { navigate, useRoute } from './router';
import type { AppRoute } from './router';

type Workspace = 'home' | 'case' | 'form' | 'records' | 'admin' | 'ayarlar';

type SignedInAppProps = { user: AuthenticatedUser; onLogout: () => void; flowOrigin: AuthFlowOrigin };

/** Uygulama kökü: yol '/' ise gün panosu (psikolog) veya yönetim özeti (admin) açılır; işlem akışı /islem'de yaşar. */
const LANDING_PATHS = new Set(['/', '/index.html', '/optik-form.html']);

type NavItem = { id: Workspace; label: string; icon: IconName; path: string };

function buildNavGroups(role: UserRole): { label: string; items: NavItem[] }[] {
  const groups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Çalışma alanı',
      items: [
        { id: 'home', label: 'Genel bakış', icon: 'layers', path: '/' },
        { id: 'case', label: 'İşlem', icon: 'scan', path: '/islem' },
        { id: 'form', label: 'Form', icon: 'sheet', path: '/form' },
      ],
    },
  ];
  if (role === 'ADMIN') {
    groups.push({
      label: 'Yönetim',
      items: [
        { id: 'admin', label: 'Yönetim', icon: 'shield', path: '/yonetim' },
        { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', path: '/ayarlar' },
      ],
    });
  } else {
    groups.push({
      label: 'Kayıtlar',
      items: [
        { id: 'records', label: 'Kayıtlarım', icon: 'file', path: '/kayitlar' },
        { id: 'ayarlar', label: 'Ayarlar', icon: 'settings', path: '/ayarlar' },
      ],
    });
  }
  return groups;
}

function BrandMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="10" cy="10" r="1.8" fill="currentColor" />
      <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}

function resolveWorkspace(route: AppRoute, role: UserRole): Workspace | null {
  switch (route.page) {
    case 'home':
      return 'home';
    case 'islem':
      return 'case';
    case 'form':
      return 'form';
    case 'kayitlar':
    case 'kayit':
    case 'raporlar':
      return role === 'ADMIN' ? 'admin' : 'records';
    case 'yonetim':
      return 'admin';
    // Denetim kaydı Ayarlar'ın alt sayfasıdır: yan gezinmede "Ayarlar" işaretli kalır.
    case 'ayarlar':
    case 'denetim':
      return 'ayarlar';
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
            <Icon name="alert" size={28} />
            <h4>Sayfa bulunamadı</h4>
            <p>Adres bu çalışma alanında yok.</p>
            <button type="button" className="btn-primary btn-sm" onClick={() => navigate('/')}>
              Ana sayfa
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

  const [recordsTick, setRecordsTick] = useState(0);
  const navGroups = buildNavGroups(user.role);
  const workspace = resolveWorkspace(route, user.role) ?? 'home';
  const activeItem = navGroups.flatMap(group => group.items).find(item => item.id === workspace);
  const canAdmin = user.role === 'ADMIN';
  const roleLabel = canAdmin ? 'Yönetici' : 'Psikolog';
  const recordsPath = canAdmin ? '/yonetim' : '/kayitlar';
  const recordsLabel = canAdmin ? 'Yönetimi aç' : 'Kayıtları aç';

  return (
    <div className="portal-layout">
      <a className="skip-link" href="#main">Ana içeriğe atla</a>
      <aside className="workspace-sidebar" aria-label="Çalışma alanı gezinmesi">
        <a className="brand sidebar-brand" href="/" aria-label="MMPI-566 ana sayfa">
          <span className="brand-mark" aria-hidden="true"><BrandMark /></span>
          <span className="brand-text">
            <strong className="brand-title">MMPI-566</strong>
            <span className="brand-subtitle">Uzman çalışma alanı</span>
          </span>
        </a>
        <div className="sidebar-nav-wrap">
          {navGroups.map(group => (
            <nav className="sidebar-nav" aria-label={group.label} key={group.label}>
              <span className="sidebar-label">{group.label}</span>
              {group.items.map(item => (
                <a
                  key={item.id}
                  href={item.path}
                  className={`sidebar-link${workspace === item.id ? ' is-current' : ''}`}
                  aria-current={workspace === item.id ? 'page' : undefined}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.label}</span>
                  {workspace === item.id && <span className="sidebar-current-dot" aria-hidden="true" />}
                </a>
              ))}
            </nav>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-privacy">
            <span className="sidebar-privacy-icon"><Icon name="shield" size={18} /></span>
            <button
              type="button"
              className="sidebar-privacy-title"
              onClick={() => navigate('/ayarlar')}
              title="Bulut durumu ve hesap ayarlarını aç"
            >
              <strong>Bulut hesabı açık</strong>
              <Icon name="arrowRight" size={14} />
            </button>
            <p>Kayıtlar bulutta tutulur; taslak ve çevrimdışı kuyruk bu tarayıcıda saklanır.</p>
            <span className="sidebar-privacy-actions">
              <button type="button" className="sidebar-privacy-action" onClick={() => navigate(recordsPath)}>
                {recordsLabel} <Icon name="arrowRight" size={14} />
              </button>
              <button type="button" className="sidebar-privacy-action" onClick={() => navigate('/ayarlar')}>
                Ayarları aç <Icon name="arrowRight" size={14} />
              </button>
            </span>
          </div>
          <span className="sidebar-version">MMPI-566 · UZMAN ÇALIŞMA ALANI</span>
        </div>
      </aside>

      <div className="workspace-content">
        <header className="app-header">
          <div className="header-inner">
            <a className="brand header-brand" href="/" aria-label="MMPI-566 ana sayfa">
              <span className="brand-mark" aria-hidden="true"><BrandMark /></span>
              <span className="brand-text">
                <strong className="brand-title">MMPI-566</strong>
                <span className="brand-subtitle">Uzman çalışma alanı</span>
              </span>
            </a>
            <div className="header-current">
              <span>Çalışma alanı <Icon name="right" size={13} /></span>
              <strong>{activeItem?.label}</strong>
            </div>
            <div className="header-user">
              <div className="user-profile-summary">
                <div className="user-avatar-circle" aria-hidden="true">{user.firstName.charAt(0)}{user.lastName.charAt(0)}</div>
                <div className="user-info-text">
                  <strong className="user-full-name">{displayName(user)}</strong>
                  <span className={`user-role-badge ${canAdmin ? 'badge-admin' : 'badge-psy'}`}>{roleLabel}</span>
                </div>
              </div>
              <button type="button" className="btn-logout" onClick={onLogout}>Çıkış</button>
            </div>
            <MobileNav
              items={navGroups.flatMap(group => group.items).map(item => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                active: workspace === item.id,
                onSelect: () => navigate(item.path),
              }))}
              user={user}
              onLogout={onLogout}
            />
          </div>
        </header>
        <ConnectivityBanner />
        <main className="app-main" id="main" tabIndex={-1}>
          {/* Genel bakış, rolün panosudur; "Yeni MMPI işlemi" hero'su yalnız /islem'de yaşar. */}
          {route.page === 'home' && user.role === 'PSYCHOLOG' && (
            <div className="dashboard-wrapper">
              <Dashboard user={user} />
            </div>
          )}
          {route.page === 'home' && user.role === 'ADMIN' && (
            <div className="dashboard-wrapper">
              <AdminOverview admin={user} />
            </div>
          )}
          {route.page === 'islem' && (
            <CaseWorkspace
              definition={formDefinition}
              actor={user}
              flowOrigin={flowOrigin}
              onSaved={() => setRecordsTick(tick => tick + 1)}
            />
          )}
          {route.page === 'form' && <FormKit />}
          {user.role === 'PSYCHOLOG' && route.page === 'kayitlar' && (
            <MyRecordsPanel key={recordsTick} viewer={user} />
          )}
          {user.role === 'ADMIN' && route.page === 'yonetim' && (
            <AdminPanel admin={user} />
          )}
          {route.page === 'ayarlar' && <SettingsPage user={user} />}
          {route.page === 'denetim' && <AuditPage viewer={user} />}
          {route.page === 'kayit' && (
            <RecordDetailPage
              recordId={route.id}
              viewer={user}
              onBack={() => navigate(user.role === 'ADMIN' ? '/yonetim' : '/kayitlar')}
            />
          )}
          {route.page === 'raporlar' && (
            <ReportsPage key={`${route.id}/${route.reportId || ''}`} recordId={route.id} reportId={route.reportId} viewer={user} />
          )}
        </main>
        <SiteFooter
          onNewEntry={() => {
            navigate('/islem');
          }}
        />
      </div>
    </div>
  );
}
