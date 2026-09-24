import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createPsychologist } from '../auth/adminApi';
import { listCloudProfiles } from './cloudAccounts';
import type { CloudProfile } from './cloudAccounts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Ayarlar → "Psikolog hesabı" (psikolog reposundaki `CloudAdminPanel` karşılığı).
 *
 * Halka açık kayıt yoktur: hesap yalnızca bu formdan, `admin-users` Edge
 * Function'ı ile açılır. Liste düz bir satır listesidir:
 * `Ad Soyad · e-posta · ROL · aktif`.
 */
export function CloudAccountsPanel() {
  const [profiles, setProfiles] = useState<CloudProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  useEffect(() => {
    let cancelled = false;
    listCloudProfiles()
      .then(rows => {
        if (!cancelled) {
          setProfiles(rows);
          setError('');
        }
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Hesap listesi alınamadı.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim().toLowerCase();
    if (firstName.length < 2 || lastName.length < 2) {
      setError('Ad ve soyad en az 2 karakter olmalı.');
      return;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }
    if (form.password.length < 10) {
      setError('Geçici parola en az 10 karakter olmalı.');
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Hesap oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-accounts">
      <h3>Psikolog hesabı</h3>
      <p>Halka açık kayıt kapalıdır. Hesap yalnızca bu yönetim formundan, Edge Function ile açılır.</p>

      <form onSubmit={onSubmit} className="settings-account-form">
        <label className="form-group">
          Ad
          <input
            value={form.firstName}
            onChange={event => setForm({ ...form, firstName: event.target.value })}
            required
            minLength={2}
            maxLength={80}
            autoComplete="off"
          />
        </label>
        <label className="form-group">
          Soyad
          <input
            value={form.lastName}
            onChange={event => setForm({ ...form, lastName: event.target.value })}
            required
            minLength={2}
            maxLength={80}
            autoComplete="off"
          />
        </label>
        <label className="form-group">
          E-posta
          <input
            type="email"
            value={form.email}
            onChange={event => setForm({ ...form, email: event.target.value })}
            required
            maxLength={254}
            autoComplete="off"
          />
        </label>
        <label className="form-group">
          Geçici parola
          <input
            type="password"
            value={form.password}
            onChange={event => setForm({ ...form, password: event.target.value })}
            required
            minLength={10}
            autoComplete="new-password"
          />
          <span className="settings-hint">En az 10 karakter; uzman ilk girişte değiştirmeli.</span>
        </label>
        <button type="submit" className="btn-primary btn-sm" disabled={busy}>
          {busy ? 'Oluşturuluyor…' : 'Hesap oluştur'}
        </button>
      </form>

      {error !== '' && <p className="settings-error">{error}</p>}

      {loading ? (
        <p className="settings-note">Hesaplar yükleniyor…</p>
      ) : profiles.length === 0 ? (
        <p className="settings-note">Henüz hesap yok. İlk psikolog hesabını yukarıdaki formdan açın.</p>
      ) : (
        <ul className="settings-account-list">
          {profiles.map(profile => (
            <li key={profile.id}>
              {`${profile.firstName} ${profile.lastName}`.trim() || '—'} · {profile.email || '—'} · {profile.role} ·{' '}
              {profile.active ? 'aktif' : 'pasif'}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
