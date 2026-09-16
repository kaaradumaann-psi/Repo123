import { useState } from 'react';
import type { FormEvent } from 'react';
import { Icon } from './Icon';

type LoginCardProps = {
  mode: 'signin' | 'setup';
  error: string;
  busy: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  onClearError: () => void;
  compact?: boolean;
};

function BrandMark() {
  return (
    <span className="auth-brand-mark" aria-hidden="true">
      <svg width="28" height="28" viewBox="0 0 26 26" fill="none">
        <path d="M9 3H3v6M17 3h6v6M23 17v6h-6M9 23H3v-6" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="10" cy="10" r="1.8" fill="currentColor" />
        <circle cx="16" cy="10" r="1.8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="16" r="1.8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="16" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}

export function LoginCard({ mode, error, busy, onSubmit, onClearError, compact = false }: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const working = busy || submitting;
  const message = localError || error;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    onClearError();
    setSubmitting(true);
    try {
      await onSubmit(email, password);
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : 'Giriş yapılamadı. E-posta veya şifrenizi kontrol edin.');
    } finally {
      setSubmitting(false);
    }
  }

  if (mode === 'setup') {
    return (
      <section className="auth-card" aria-labelledby="login-config-title">
        <div className="auth-brand">
          <BrandMark />
          <div>
            <strong>MMPI-566</strong>
            <small>Optik Değerlendirme Sistemi</small>
          </div>
        </div>
        <div className="auth-heading">
          <p className="auth-eyebrow">Sistem Kurulumu</p>
          <h1 id="login-config-title">Bağlantı Ayarları Gerekli</h1>
          <p>
            Uygulamayı başlatabilmek için ortam değişkenlerinin (VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY)
            yapılandırılması gerekmektedir.
          </p>
        </div>
        <div className="status-banner info-banner" role="alert">
          <Icon name="alert" size={18} />
          <span>Güvenlik gereği yalnızca yayınlanabilir erişim anahtarını yapılandırın.</span>
        </div>
      </section>
    );
  }

  return (
    <section className={`auth-card${compact ? ' auth-card-compact' : ''}`} aria-labelledby="login-title">
      <div className="auth-brand">
        <BrandMark />
        <div>
          <strong>MMPI-566</strong>
          <small>Akıllı Optik Değerlendirme Sistemi</small>
        </div>
      </div>

      <div className="auth-heading">
        <span className="section-badge badge-primary">Güvenli Giriş</span>
        <h1 id="login-title">Uzman Paneline Giriş</h1>
        <p>MMPI formlarını okumak ve arşivlemek için hesabınızla giriş yapın.</p>
      </div>

      {message && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={18} />
          <span>{message}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={submit}>
        <div className="form-group">
          <label htmlFor="login-email">E-posta Adresi</label>
          <input
            id="login-email"
            required
            type="email"
            placeholder="uzman@kurum.com"
            value={email}
            onChange={event => setEmail(event.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Şifre</label>
          <input
            id="login-password"
            required
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={event => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button className="btn-primary auth-submit-btn" type="submit" disabled={working}>
          {working ? (
            <>
              <span className="spinner-inline" aria-hidden="true" />
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
        <p>Hesabınız yoksa veya şifrenizi unuttuysanız lütfen kurum yöneticiniz (Admin) ile iletişime geçiniz.</p>
      </div>
    </section>
  );
}
