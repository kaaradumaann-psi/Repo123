import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { getSession, onAuthChange, signIn, signOut, userFromSession } from '../auth/supabaseAuth';
import { supabase, supabaseConfig } from '../auth/supabaseClient';
import { Icon } from './Icon';
import { BrandMark } from './BrandMark';
import { LandingPage } from './LandingPage';

export function AuthGate({ children }: { children: (user: AuthenticatedUser, onLogout: () => void) => ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState('');
  const [screen, setScreen] = useState<'landing' | 'login'>('landing');

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    async function hydrate() {
      try {
        const session = await getSession();
        const profile = await userFromSession(session);
        if (alive) { setUser(profile); setError(''); }
      } catch (cause) {
        if (alive) setError(cause instanceof Error ? cause.message : 'Kullanıcı oturumu doğrulanamadı.');
      }
    }
    void hydrate();
    const { data } = onAuthChange((_event, session) => {
      if (!session) { if (alive) setUser(null); return; }
      window.setTimeout(() => {
        void userFromSession(session).then(profile => {
          if (alive) { setUser(profile); setError(''); }
        }).catch(cause => {
          if (alive) { setUser(null); setError(cause instanceof Error ? cause.message : 'Kullanıcı yetkisi doğrulanamadı.'); }
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

  if (user) {
    return (
      <>
        {children(user, () => {
          void signOut().catch(() => {});
          setUser(null);
          setScreen('landing');
        })}
      </>
    );
  }

  if (screen === 'landing') {
    return <LandingPage onLogin={() => setScreen('login')} />;
  }

  if (!supabaseConfig.configured) {
    return <SystemSetupScreen onBack={() => setScreen('landing')} />;
  }

  return (
    <AuthScreen
      onSignIn={handleSignIn}
      error={error}
      onBack={() => setScreen('landing')}
    />
  );
}

function SystemSetupScreen({ onBack }: { onBack: () => void }) {
  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="config-title">
        <div className="auth-brand">
          <span className="auth-brand-mark" aria-hidden="true">
            <BrandMark />
          </span>
          <div>
            <strong>MMPI-566 OMR</strong>
            <small>Klinik optik okuma</small>
          </div>
        </div>
        <button type="button" className="lp-auth-back" onClick={onBack}>
          ← Ana sayfa
        </button>
        <div className="auth-heading">
          <p className="auth-eyebrow">Klinik standartlarda güvenilirlik</p>
          <h1 id="config-title">Giriş henüz açık değil</h1>
          <p>
            Tarama ve arşiv için hesabınızı yöneticiniz açar. Ana sayfadan formu indirebilir, yazdırabilirsiniz.
          </p>
        </div>
        <div className="status-banner info-banner" role="alert">
          <Icon name="alert" size={18} />
          <span>Hesap açılışı yalnızca yönetici tarafından yapılır.</span>
        </div>
      </section>
    </main>
  );
}

type AuthScreenProps = {
  onSignIn: (email: string, password: string) => Promise<void>;
  error: string;
  onBack: () => void;
};

function AuthScreen({ onSignIn, error: externalError, onBack }: AuthScreenProps) {
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
              <BrandMark />
            </span>
            <div>
              <strong>MMPI-566 OMR</strong>
              <small>Klinik optik okuma</small>
            </div>
          </div>

          <button type="button" className="lp-auth-back" onClick={onBack}>
            ← Ana sayfa
          </button>
          <div className="auth-heading">
            <span className="section-badge badge-primary">Klinik standartlarda güvenilirlik</span>
            <h1 id="auth-title">Uzman girişi</h1>
            <p>Kağıt formları tarayın, kayıtları arşivleyin. Manuel veri girişine son verin.</p>
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
                  <span>Giriş yapılıyor…</span>
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
