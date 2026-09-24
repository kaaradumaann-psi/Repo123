import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthenticatedUser } from '../auth/authTypes';
import { createPsychologist } from '../auth/adminApi';
import { displayName } from '../auth/userDisplay';
import { Icon } from '../components/Icon';
import { navigate } from '../router';
import { cloudProfileCreatedAt, cloudRoleLabel, listCloudProfiles } from './cloudAccounts';
import type { CloudProfile } from './cloudAccounts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ayarlar → "Psikolog hesabı" (psikolog reposundaki `CloudAdminPanel` karşılığı).
 * Halka açık kayıt yoktur: hesap yalnızca bu formdan, `admin-users` Edge
 * Function'ı ile açılır. Durum değiştirme ve silme Yönetim panelindedir.
 */
export function CloudAccountsPanel({ admin }: { admin: AuthenticatedUser }) {
  const [profiles, setProfiles] = useState<CloudProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  async function refresh() {
    setLoading(true);
    try {
      setProfiles(await listCloudProfiles());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hesap listesi alınamadı.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    if (firstName.length < 2 || lastName.length < 2) {
      setMessage({ kind: 'error', text: 'Ad ve soyad en az 2 karakter olmalı.' });
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setMessage({ kind: 'error', text: 'Geçerli bir e-posta adresi girin.' });
      return;
    }
    if (form.password.length < 10) {
      setMessage({ kind: 'error', text: 'Geçici parola en az 10 karakter olmalı.' });
      return;
    }
    setBusy(true);
    try {
      const created = await createPsychologist({ firstName, lastName, email, password: form.password });
      setProfiles(current => [
        ...current,
        {
          id: created.id,
          firstName: created.firstName,
          lastName: created.lastName,
          email: created.email,
          role: created.role,
          active: created.active,
          createdAt: new Date().toISOString(),
        },
      ]);
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      setMessage({ kind: 'success', text: `${displayName(created)} hesabı açıldı. Geçici parolayı güvenli bir kanalla iletin.` });
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Hesap oluşturulamadı.',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-accounts">
      <div className="settings-accounts-head">
        <div>
          <h3>Psikolog hesabı</h3>
          <p>Halka açık kayıt kapalıdır. Hesap yalnızca bu yönetim formundan, Edge Function ile açılır.</p>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={() => navigate('/yonetim')}>
          <Icon name="shield" size={15} />
          <span>Yönetim paneli</span>
        </button>
      </div>

      <form className="settings-account-form" onSubmit={onSubmit}>
        <label className="settings-field">
          <span>Ad</span>
          <input
            value={form.firstName}
            onChange={event => setForm({ ...form, firstName: event.target.value })}
            minLength={2}
            maxLength={80}
            required
            autoComplete="off"
          />
        </label>
        <label className="settings-field">
          <span>Soyad</span>
          <input
            value={form.lastName}
            onChange={event => setForm({ ...form, lastName: event.target.value })}
            minLength={2}
            maxLength={80}
            required
            autoComplete="off"
          />
        </label>
        <label className="settings-field">
          <span>E-posta</span>
          <input
            type="email"
            value={form.email}
            onChange={event => setForm({ ...form, email: event.target.value })}
            maxLength={254}
            required
            autoComplete="off"
          />
        </label>
        <label className="settings-field">
          <span>Geçici parola</span>
          <input
            type="password"
            value={form.password}
            onChange={event => setForm({ ...form, password: event.target.value })}
            minLength={10}
            required
            autoComplete="new-password"
          />
          <span className="settings-hint">En az 10 karakter; uzman ilk girişte değiştirmeli.</span>
        </label>
        <div className="settings-account-actions">
          <button type="submit" className="btn-primary btn-sm" disabled={busy}>
            {busy ? 'Oluşturuluyor…' : 'Hesap oluştur'}
          </button>
        </div>
      </form>

      {message && (
        <p className={`settings-message ${message.kind === 'success' ? 'is-success' : 'is-error'}`} role="status">
          {message.text}
        </p>
      )}
      {error !== '' && (
        <p className="settings-message is-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="settings-loading">
          <div className="spinner" />
          <span>Hesaplar yükleniyor…</span>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state-card">
          <h4>Hesap bulunamadı</h4>
          <p>İlk psikolog hesabını yukarıdaki formdan açın.</p>
        </div>
      ) : (
        <div className="settings-table-wrapper">
          <table className="settings-table">
            <caption className="settings-table-caption">
              Bu çalışma alanındaki hesaplar. Toplam {profiles.length} hesap ·{' '}
              {profiles.filter(profile => profile.active).length} aktif.
            </caption>
            <thead>
              <tr>
                <th scope="col">Ad Soyad</th>
                <th scope="col">E-posta</th>
                <th scope="col">Rol</th>
                <th scope="col">Durum</th>
                <th scope="col">Açılış</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(profile => (
                <tr key={profile.id}>
                  <td data-label="Ad Soyad">
                    <strong>{`${profile.firstName} ${profile.lastName}`.trim() || '—'}</strong>
                    {profile.id === admin.id && <span className="settings-chip">bu hesap</span>}
                  </td>
                  <td data-label="E-posta">{profile.email || '—'}</td>
                  <td data-label="Rol">{cloudRoleLabel(profile.role)}</td>
                  <td data-label="Durum">
                    <span className={`settings-chip ${profile.active ? '' : 'is-passive'}`}>
                      {profile.active ? 'aktif' : 'pasif'}
                    </span>
                  </td>
                  <td data-label="Açılış">{cloudProfileCreatedAt(profile)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
