import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { authenticate, createUser, currentUser, hasUsers, type AuthenticatedUser } from '../auth/authStore';

export function AuthGate({ children }: { children: (user: AuthenticatedUser, onLogout: () => void) => ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => currentUser());

  if (user) return <>{children(user, () => setUser(null))}</>;
  return <AuthScreen onAuthenticated={setUser} />;
}

type AuthScreenProps = { onAuthenticated: (user: AuthenticatedUser) => void };

function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'setup'>(() => hasUsers() ? 'login' : 'setup');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (mode === 'setup' && password !== passwordAgain) { setError('Şifre tekrarı eşleşmiyor.'); return; }
    setBusy(true);
    try {
      const next = mode === 'setup'
        ? await createUser({ role: 'ADMIN', firstName, lastName, identifier, password })
        : await authenticate(identifier, password);
      if (mode === 'setup') await authenticate(identifier, password);
      onAuthenticated(next);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'İşlem tamamlanamadı.');
    } finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <section className="auth-card" aria-labelledby="auth-title">
      <div className="auth-brand"><span className="auth-brand-mark" aria-hidden="true">M</span><span><strong>MMPI-566</strong><small>Akıllı Optik Okuyucu</small></span></div>
      <div className="auth-heading"><p className="auth-eyebrow">Korumalı çalışma alanı</p>
        <h1 id="auth-title">{mode === 'setup' ? 'İlk yönetici hesabını oluşturun' : 'Güvenli giriş'}</h1>
        <p>{mode === 'setup'
          ? 'Bu cihazdaki yerel çalışma alanını başlatın. Psikolog hesapları yalnızca giriş yaptıktan sonra Admin panelinden eklenebilir.'
          : 'Devam etmek için Admin tarafından oluşturulan hesabınızla giriş yapın.'}</p>
      </div>
      {mode === 'setup' && <div className="auth-notice" role="note"><strong>Kurulum notu</strong><span>Bu statik/çevrimdışı sürümde kullanıcılar yalnızca bu tarayıcıda saklanır. Gerçek çok kullanıcılı ve sunucu tarafı güvenlik için bir backend gerekir.</span></div>}
      <form className="auth-form" onSubmit={submit}>
        {mode === 'setup' && <div className="auth-form-grid">
          <label>Ad<input required value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="given-name" /></label>
          <label>Soyad<input required value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="family-name" /></label>
        </div>}
        <label>E-posta / kullanıcı adı<input required value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="username" /></label>
        <label>Şifre<input required type="password" minLength={10} value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'setup' ? 'new-password' : 'current-password'} /></label>
        {mode === 'setup' && <label>Şifre tekrarı<input required type="password" minLength={10} value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password" /></label>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Hazırlanıyor…' : mode === 'setup' ? 'Admin hesabını oluştur' : 'Giriş yap'}</button>
      </form>
      {mode === 'login' && !hasUsers() && <button className="auth-secondary" type="button" onClick={() => { setError(''); setMode('setup'); }}>İlk kurulumu başlat</button>}
      {mode === 'setup' && hasUsers() && <button className="auth-secondary" type="button" onClick={() => { setError(''); setMode('login'); }}>Giriş ekranına dön</button>}
      <p className="auth-footnote">Klinik puanlama, yorumlama ve raporlama bu sürümde yoktur. Yalnızca optik cevap verisi kaydedilir.</p>
    </section>
  </main>;
}
