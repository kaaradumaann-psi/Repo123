import { useState } from 'react';
import type { FormEvent } from 'react';
import { createUser, displayName, listUsers, setUserActive, type AuthenticatedUser } from '../auth/authStore';

export function AdminPanel({ admin }: { admin: AuthenticatedUser }) {
  const [users, setUsers] = useState(() => listUsers());
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function addPsychologist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (password !== passwordAgain) { setMessage({ kind: 'error', text: 'Şifre tekrarı eşleşmiyor.' }); return; }
    setBusy(true);
    try {
      await createUser({ role: 'PSYCHOLOG', firstName, lastName, identifier, password });
      setUsers(listUsers());
      setFirstName(''); setLastName(''); setIdentifier(''); setPassword(''); setPasswordAgain('');
      setMessage({ kind: 'success', text: 'Psikolog hesabı oluşturuldu. Giriş bilgilerini güvenli kanaldan paylaşın.' });
    } catch (cause) {
      setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : 'Kullanıcı oluşturulamadı.' });
    } finally { setBusy(false); }
  }

  function toggle(user: AuthenticatedUser) {
    try {
      setUsers(setUserActive(user.id, !user.active));
      setMessage({ kind: 'success', text: `${displayName(user)} hesabı ${user.active ? 'pasif' : 'aktif'} yapıldı.` });
    } catch (cause) { setMessage({ kind: 'error', text: cause instanceof Error ? cause.message : 'Hesap durumu değiştirilemedi.' }); }
  }

  const psychologists = users.filter(user => user.role === 'PSYCHOLOG');
  return <section className="admin-panel" aria-labelledby="admin-title">
    <header className="admin-heading"><div><p className="auth-eyebrow">Yönetim</p><h1 id="admin-title">Kullanıcı yönetimi</h1><p>Psikolog hesaplarını yalnızca Admin oluşturabilir ve pasifleştirebilir.</p></div>
      <div className="admin-badge">{admin.identifier}</div></header>
    <div className="admin-warning" role="note"><strong>Yerel sürüm sınırı</strong><span>Kullanıcı ve kayıt verileri bu tarayıcının depolamasındadır. Bu yapı gerçek kullanıcılar arası güvenlik veya merkezi veritabanı yerine geçmez; üretimde backend ile değiştirilmelidir.</span></div>
    <div className="admin-grid">
      <form className="admin-card" onSubmit={addPsychologist}>
        <div className="admin-card-heading"><div><h2>Psikolog ekle</h2><p>Yeni hesap için ilk şifreyi belirleyin.</p></div><span className="admin-card-icon">+</span></div>
        <div className="admin-form-grid"><label>Ad<input required value={firstName} onChange={event => setFirstName(event.target.value)} autoComplete="off" /></label>
          <label>Soyad<input required value={lastName} onChange={event => setLastName(event.target.value)} autoComplete="off" /></label></div>
        <label>E-posta / kullanıcı adı<input required value={identifier} onChange={event => setIdentifier(event.target.value)} autoComplete="off" /></label>
        <div className="admin-form-grid"><label>İlk şifre<input required type="password" minLength={10} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /></label>
          <label>Şifre tekrarı<input required type="password" minLength={10} value={passwordAgain} onChange={event => setPasswordAgain(event.target.value)} autoComplete="new-password" /></label></div>
        {message && <p className={message.kind === 'error' ? 'admin-message admin-message-error' : 'admin-message'} role={message.kind === 'error' ? 'alert' : 'status'}>{message.text}</p>}
        <button className="admin-primary" type="submit" disabled={busy}>{busy ? 'Hesap oluşturuluyor…' : 'Psikolog hesabı oluştur'}</button>
      </form>
      <section className="admin-card" aria-labelledby="psychologists-title"><div className="admin-card-heading"><div><h2 id="psychologists-title">Psikolog hesapları</h2><p>{psychologists.length} hesap</p></div><span className="admin-count">{psychologists.filter(user => user.active).length} aktif</span></div>
        {psychologists.length === 0 ? <p className="admin-empty">Henüz psikolog hesabı oluşturulmadı.</p> : <ul className="user-list">{psychologists.map(user => <li key={user.id} className={user.active ? '' : 'user-inactive'}><span className="user-avatar">{user.firstName.slice(0, 1)}{user.lastName.slice(0, 1)}</span><span className="user-copy"><strong>{displayName(user)}</strong><small>{user.identifier}</small></span><span className="user-status">{user.active ? 'Aktif' : 'Pasif'}</span><button type="button" onClick={() => toggle(user)}>{user.active ? 'Pasifleştir' : 'Aktifleştir'}</button></li>)}</ul>}
      </section>
    </div>
    <p className="admin-footnote">Parolalar düz metin tutulmaz; tarayıcı Web Crypto PBKDF2 ile tuzlanmış özet saklar. Ancak istemci depolaması kullanıcı tarafından değiştirilebilir. Merkezi yetkilendirme için API gerekli.</p>
  </section>;
}
