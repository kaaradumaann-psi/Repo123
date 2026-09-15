import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { createPsychologist, listPsychologists, setPsychologistActive } from '../auth/adminApi';
import { displayName } from '../auth/userDisplay';
import type { AuthenticatedUser } from '../auth/authTypes';

export function AdminPanel({ admin }: { admin: AuthenticatedUser }) {
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function refresh() {
    try { setUsers(await listPsychologists()); }
    catch (cause) { setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : 'Psikolog listesi alınamadı.' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { void refresh(); }, []);

  async function addPsychologist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (password !== passwordAgain) { setMessage({ kind: 'error', text: 'Şifre tekrarı eşleşmiyor.' }); return; }
    setBusy(true);
    try {
      const created = await createPsychologist({ firstName, lastName, email, password });
      setUsers(previous => [...previous, created]);
      setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setPasswordAgain('');
      setMessage({ kind: 'success', text: 'Psikolog hesabı oluşturuldu. İlk şifreyi güvenli kanaldan paylaşın.' });
    } catch (cause) {
      setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : 'Kullanıcı oluşturulamadı.' });
    } finally { setBusy(false); }
  }

  async function toggle(user: AuthenticatedUser) {
    setBusyUser(user.id); setMessage(null);
    try {
      const updated = await setPsychologistActive(user.id, !user.active);
      setUsers(previous => previous.map(candidate => candidate.id === updated.id ? updated : candidate));
      setMessage({ kind: 'success', text: `${displayName(user)} hesabı ${updated.active ? 'aktif' : 'pasif'} yapıldı.` });
    } catch (cause) { setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : 'Hesap durumu değiştirilemedi.' }); }
    finally { setBusyUser(null); }
  }

  const activeCount = users.filter(user => user.active).length;
  return <section className="admin-panel" aria-labelledby="admin-title">
    <header className="admin-heading"><div><p className="auth-eyebrow">Yönetim</p><h1 id="admin-title">Kullanıcı yönetimi</h1><p>Psikolog hesaplarını yalnızca aktif Admin oluşturabilir ve pasifleştirebilir.</p></div>
      <div className="admin-badge">{admin.email}</div></header>
    <div className="admin-warning" role="note"><strong>Supabase</strong><span>Hesaplar Supabase Auth'ta, roller ve aktiflik profiller tablosunda tutulur. Parola uygulama veritabanına yazılmaz; erişim RLS ve Edge Function ile denetlenir.</span></div>
    <div className="admin-grid">
      <form className="admin-card" onSubmit={addPsychologist}>
        <div className="admin-card-heading"><div><h2>Psikolog ekle</h2><p>Supabase Auth için e-posta ve ilk şifreyi belirleyin.</p></div><span className="admin-card-icon">+</span></div>
        <div className="admin-form-grid"><label>Ad<input required value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="off" /></label>
          <label>Soyad<input required value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="off" /></label></div>
        <label>E-posta<input required type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="off" /></label>
        <div className="admin-form-grid"><label>İlk şifre<input required type="password" minLength={10} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /></label>
          <label>Şifre tekrarı<input required type="password" minLength={10} value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password" /></label></div>
        {message && <p className={message.kind === 'error' ? 'admin-message admin-message-error' : 'admin-message'} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
        <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Hesap oluşturuluyor…' : 'Psikolog hesabı oluştur'}</button>
      </form>
      <section className="admin-card" aria-labelledby="psychologists-title"><div className="admin-card-heading"><div><h2 id="psychologists-title">Psikolog hesapları</h2><p>{users.length} hesap</p></div><span className="admin-count">{activeCount} aktif</span></div>
        {loading ? <p className="admin-empty">Supabase kullanıcıları yükleniyor…</p> : users.length === 0 ? <p className="admin-empty">Henüz psikolog hesabı oluşturulmadı.</p> : <ul className="user-list">{users.map(user => <li key={user.id} className={user.active ? '' : 'user-inactive'}><span className="user-avatar">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span><span className="user-copy"><strong>{displayName(user)}</strong><small>{user.email}</small></span><span className="user-status">{user.active ? 'Aktif' : 'Pasif'}</span><button type="button" disabled={busyUser === user.id} onClick={() => void toggle(user)}>{busyUser === user.id ? 'Bekleyin…' : user.active ? 'Pasifleştir' : 'Aktifleştir'}</button></li>)}</ul>}
      </section>
    </div>
    <p className="admin-footnote">Admin işlemleri frontend görünürlüğüne güvenmez: profil listeleme RLS ile, hesap oluşturma ve pasifleştirme doğrulanmış Supabase Edge Function ile korunur.</p>
  </section>;
}
