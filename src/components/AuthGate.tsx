import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { getSession, onAuthChange, signIn, signOut, userFromSession } from '../auth/supabaseAuth';
import { supabase, supabaseConfig } from '../auth/supabaseClient';
import { Icon } from './Icon';

export function AuthGate({ children }: { children: (user: AuthenticatedUser, onLogout: () => void) => ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    let alive = true;
    async function hydrate() {
      try {
        const session = await getSession();
        const profile = await userFromSession(session);
        if (alive) { setUser(profile); setError(''); }
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'Kullanıcı oturumu doğrulanamadı.');
      } finally { if (alive) setChecking(false); }
    }
    void hydrate();
    const { data } = onAuthChange((_event, session) => {
      if (!session) { if (alive) setUser(null); return; }
      window.setTimeout(() => {
        void userFromSession(session).then(profile => {
          if (alive) { setUser(profile); setError(''); setChecking(false); }
        }).catch(cause => {
          if (alive) { setUser(null); setError(cause instanceof Error ? cause.message : 'Kullanıcı yetkisi doğrulanamadı.'); setChecking(false); }
        });
      }, 0);
    });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    let alive = true;
    const validate = async () => {
      try {
        const session = await getSession();
        const profile = await userFromSession(session);
        if (!profile && alive) setUser(null);
      } catch {
        if (alive) setUser(null);
      }
    };
    const interval = window.setInterval(() => { void validate(); }, 60_000);
    window.addEventListener('focus', validate);
    return () => { alive = false; window.clearInterval(interval); window.removeEventListener('focus', validate); };
  }, [user]);

  async function handleSignIn(email: string, password: string) {
    const profile = await signIn(email, password);
    setUser(profile);
    setError('');
  }

  if (!supabaseConfig.configured) return <SystemSetupScreen />;
  if (checking) {
    return (
      <main className="auth-shell">
        <div className="auth-card auth-loading">
          <div className="spinner" />
          <p>Oturum doğrulanıyor, lütfen bekleyin...</p>
        </div>
      </main>
    );
  }
  if (user) {
    return (
      <>
        {children(user, () => {
          void signOut().catch(() => {});
          setUser(null);
        })}
      </>
    );
  }
  return <AuthScreen onSignIn={handleSignIn} error={error} />;
}

function SystemSetupScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="config-title">
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            <Icon name="scan" size={24} />
          </span>
          <div>
            <strong>MMPI-566</strong>
            <small>Optik Değerlendirme Sistemi</small>
          </div>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">Sistem Kurulumu</p>
          <h1 id="config-title">Bağlantı Ayarları Gerekli</h1>
          <p>
            Uygulamayı başlatabilmek için ortam değişkenlerinin (VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY) yapılandırılması gerekmektedir.
          </p>
        </div>
        <div className="status-banner info-banner" role="alert">
          <Icon name="alert" size={18} />
          <span>Güvenlik gereği yalnızca yayınlanabilir erişim anahtarını yapılandırın.</span>
        </div>
      </section>
    </main>
  );
}

type AuthScreenProps = { onSignIn: (email: string, password: string) => Promise<void>; error: string };

function AuthScreen({ onSignIn, error: externalError }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSignIn(email, password);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Giriş yapılamadı. E-posta veya şifrenizi kontrol edin.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <div className="auth-card-wrapper">
        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">
              <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
                <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="10" cy="10" r="1.8" fill="currentColor" />
                <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="16" cy="16" r="1.8" fill="currentColor" />
              </svg>
            </span>
            <div>
              <strong>MMPI-566</strong>
              <small>Akıllı Optik Değerlendirme Sistemi</small>
            </div>
          </div>

          <div className="auth-heading">
            <span className="section-badge badge-primary">Güvenli Giriş</span>
            <h1 id="auth-title">Uzman Paneline Giriş</h1>
            <p>MMPI formlarını okumak ve arşivlemek için hesabınızla giriş yapın.</p>
          </div>

          {(error || externalError) && (
            <div className="status-banner error-banner" role="alert">
              <Icon name="alert" size={18} />
              <span>{error || externalError}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={submit}>
            <div className="form-group">
              <label>E-posta Adresi</label>
              <input
                required
                type="email"
                placeholder="uzman@kurum.com"
                value={email}
                onChange={event => setEmail(event.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <input
                required
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button className="btn-primary auth-submit-btn" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <div className="spinner-inline" />
                  <span>Giriş Yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <Icon name="arrowRight" size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-help">
            <Icon name="shield" size={16} />
            <p>
              Hesabınız yoksa veya şifrenizi unuttuysanız lütfen kurum yöneticiniz (Admin) ile iletişime geçiniz.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
