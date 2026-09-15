import { useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { getSession, onAuthChange, signIn, userFromSession } from '../auth/supabaseAuth';
import { supabase, supabaseConfig } from '../auth/supabaseClient';

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
        if (alive) setError(cause instanceof Error ? cause.message : 'Supabase oturumu doğrulanamadı.');
      } finally { if (alive) setChecking(false); }
    }
    void hydrate();
    const { data } = onAuthChange((_event, session) => {
      if (!session) { if (alive) setUser(null); return; }
      // Supabase advises not to await another Supabase call inside this callback;
      // defer profile/RLS validation until the Auth lock is released.
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

  if (!supabaseConfig.configured) return <SupabaseConfigScreen />;
  if (checking) return <main className="auth-shell"><section className="auth-card auth-loading" aria-live="polite">Supabase oturumu doğrulanıyor…</section></main>;
  if (user) return <>{children(user, () => { void supabase?.auth.signOut({ scope: 'local' }); setUser(null); })}</>;
  return <AuthScreen onSignIn={handleSignIn} error={error} />;
}

function SupabaseConfigScreen() {
  return <main className="auth-shell"><section className="auth-card" aria-labelledby="config-title">
    <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">M</span><span><strong>MMPI-566</strong><small>Akıllı Optik Okuyucu</small></span></div>
    <div className="auth-heading"><p className="auth-eyebrow">Kurulum gerekli</p><h1 id="config-title">Supabase bağlantısı yok</h1>
      <p>Uygulamayı çalıştırmadan önce Vite ortam değişkenlerinde VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlanmalıdır.</p></div>
    <div className="auth-notice" role="alert"><strong>Güvenlik</strong><span>Yalnızca Supabase anon/publishable anahtarını frontend'e koyun. service_role anahtarını asla VITE_ değişkeni olarak paylaşmayın.</span></div>
  </section></main>;
}

type AuthScreenProps = { onSignIn: (email: string, password: string) => Promise<void>; error: string };

function AuthScreen({ onSignIn, error: externalError }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(''); setBusy(true);
    try { await onSignIn(email, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Giriş yapılamadı.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell"><section className="auth-card" aria-labelledby="auth-title">
    <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">M</span><span><strong>MMPI-566</strong><small>Akıllı Optik Okuyucu</small></span></div>
    <div className="auth-heading"><p className="auth-eyebrow">Supabase Auth</p><h1 id="auth-title">Güvenli giriş</h1><p>Devam etmek için Admin tarafından oluşturulan hesabınızla giriş yapın.</p></div>
    {(error || externalError) && <p className="auth-error" role="alert">{error || externalError}</p>}
    <form className="auth-form" onSubmit={submit}>
      <label>E-posta<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="username" /></label>
      <label>Şifre<input required type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" /></label>
      <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</button>
    </form>
    <p className="auth-footnote">Public kayıt kapalıdır. Psikolog hesaplarını yalnızca aktif Admin, Supabase Edge Function üzerinden oluşturabilir.</p>
  </section></main>;
}
