import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  createPsychologist,
  listPsychologists,
  setPsychologistActive,
  deletePsychologist,
} from '../auth/adminApi';
import {
  listAllRecords,
  getRecordDetail,
  deleteRecord,
} from '../records/supabaseRecords';
import type { RecordSummary, FullRecordDetail } from '../records/supabaseRecords';
import { displayName } from '../auth/userDisplay';
import type { AuthenticatedUser } from '../auth/authTypes';
import { RecordDetailModal } from './RecordDetailModal';
import { Icon } from './Icon';

type AdminTab = 'records' | 'users' | 'new-user';

export function AdminPanel({ admin }: { admin: AuthenticatedUser }) {
  const [activeTab, setActiveTab] = useState<AdminTab>('records');

  // Psikologlar state
  const [users, setUsers] = useState<AuthenticatedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearch, setUserSearch] = useState('');

  // Tüm Test Kayıtları state
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [recordSearch, setRecordSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<FullRecordDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);

  // Yeni psikolog form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyUser, setBusyUser] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  async function refreshUsers() {
    try {
      setLoadingUsers(true);
      setUsers(await listPsychologists());
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Psikolog listesi alınamadı.',
      });
    } finally {
      setLoadingUsers(false);
    }
  }

  async function refreshRecords() {
    try {
      setLoadingRecords(true);
      const data = await listAllRecords();
      setRecords(data);
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Test kayıtları alınamadı.',
      });
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    void refreshUsers();
    void refreshRecords();
  }, []);

  async function addPsychologist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (password !== passwordAgain) {
      setMessage({ kind: 'error', text: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.' });
      return;
    }
    setBusy(true);
    try {
      const created = await createPsychologist({ firstName, lastName, email, password });
      setUsers(previous => [...previous, created]);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setPasswordAgain('');
      setMessage({
        kind: 'success',
        text: `${displayName(created)} hesabı başarıyla oluşturuldu. Giriş bilgilerini güvenle paylaşabilirsiniz.`,
      });
      setActiveTab('users');
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Kullanıcı oluşturulamadı.',
      });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(user: AuthenticatedUser) {
    setBusyUser(user.id);
    setMessage(null);
    try {
      const updated = await setPsychologistActive(user.id, !user.active);
      setUsers(previous => previous.map(c => (c.id === updated.id ? updated : c)));
      setMessage({
        kind: 'success',
        text: `${displayName(user)} hesabı ${updated.active ? 'aktif' : 'pasif'} duruma getirildi.`,
      });
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Hesap durumu güncellenemedi.',
      });
    } finally {
      setBusyUser(null);
    }
  }

  async function handleDeletePsychologist(user: AuthenticatedUser) {
    const name = displayName(user);
    if (
      !window.confirm(
        `"${name}" isimli psikolog hesabını tamamen silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz. Psikoloğun oluşturduğu tüm test kayıtları da silinecektir.`,
      )
    ) {
      return;
    }

    setDeletingUserId(user.id);
    setMessage(null);
    try {
      await deletePsychologist(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      // Test kayıtlarını da güncelle
      setRecords(prev => prev.filter(r => r.createdBy !== user.id));
      setMessage({
        kind: 'success',
        text: `"${name}" hesabı sistemden başarıyla silindi.`,
      });
    } catch (cause) {
      setMessage({
        kind: 'error',
        text: cause instanceof Error ? cause.message : 'Kullanıcı silinemedi.',
      });
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handleViewRecord(recordId: string) {
    try {
      setLoadingDetail(recordId);
      const detail = await getRecordDetail(recordId);
      setSelectedRecord(detail);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Test detayları yüklenemedi.');
    } finally {
      setLoadingDetail(null);
    }
  }

  async function handleDeleteRecord(record: RecordSummary) {
    if (
      !window.confirm(
        `"${record.firstName} ${record.lastName}" adlı danışanın test kaydını silmek istediğinize emin misiniz?`,
      )
    ) {
      return;
    }
    setDeletingRecordId(record.id);
    try {
      await deleteRecord(record.id);
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setMessage({ kind: 'success', text: 'Test kaydı sistemden kaldırıldı.' });
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Test kaydı silinemedi.',
      });
    } finally {
      setDeletingRecordId(null);
    }
  }

  const activeCount = users.filter(u => u.active).length;

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const filteredRecords = records.filter(r => {
    const q = recordSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      (r.psychologistName && r.psychologistName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-console-wrapper">
      {/* Üst Karşılama ve İstatistik Kartları */}
      <header className="admin-header-hero">
        <div className="hero-text-side">
          <div className="badge-chip badge-primary">
            <Icon name="shield" size={14} /> Sistem Yönetim Paneli
          </div>
          <h1>Yönetici Denetim Merkezi</h1>
          <p>
            Psikolog hesaplarını yönetin, sisteme kayıtlı tüm test uygulamalarını inceleyin ve sistem güvenliğini kontrol edin.
          </p>
        </div>
        <div className="hero-account-badge">
          <div className="admin-avatar-ring">
            <Icon name="shield" size={18} />
          </div>
          <div>
            <strong>{admin.firstName} {admin.lastName}</strong>
            <span className="mono-sub">{admin.email} (Yönetici)</span>
          </div>
        </div>
      </header>

      {/* İstatistik Göstergeleri */}
      <div className="admin-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon-wrap bg-blue-tint">
            <Icon name="file" size={22} />
          </div>
          <div>
            <span className="metric-label">Toplam Test Kaydı</span>
            <strong className="metric-value">{records.length}</strong>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap bg-purple-tint">
            <Icon name="users" size={22} />
          </div>
          <div>
            <span className="metric-label">Kayıtlı Psikolog</span>
            <strong className="metric-value">{users.length}</strong>
          </div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-wrap bg-green-tint">
            <Icon name="checkCircle" size={22} />
          </div>
          <div>
            <span className="metric-label">Aktif Uzman</span>
            <strong className="metric-value">{activeCount}</strong>
          </div>
        </div>
      </div>

      {/* Bildirim Mesajı */}
      {message && (
        <div
          className={`status-banner ${message.kind === 'error' ? 'error-banner' : 'success-banner'}`}
          role={message.kind === 'error' ? 'alert' : 'status'}
        >
          <Icon name={message.kind === 'error' ? 'alert' : 'checkCircle'} size={18} />
          <span style={{ flex: 1 }}>{message.text}</span>
          <button type="button" className="close-banner-btn" onClick={() => setMessage(null)}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Yönetim Sekmeleri */}
      <div className="admin-subnav-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'records'}
          className={`subnav-tab ${activeTab === 'records' ? 'active' : ''}`}
          onClick={() => setActiveTab('records')}
        >
          <Icon name="file" size={16} />
          <span>Psikologların Yaptığı Testler ({records.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'users'}
          className={`subnav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Icon name="users" size={16} />
          <span>Psikolog Hesapları ({users.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'new-user'}
          className={`subnav-tab ${activeTab === 'new-user' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-user')}
        >
          <span style={{ fontWeight: 800, fontSize: 16 }}>+</span>
          <span>Yeni Psikolog Ekle</span>
        </button>
      </div>

      {/* TAB 1: PSİKOLOGLARIN YAPTIĞI TESTLER */}
      {activeTab === 'records' && (
        <section className="dashboard-section card-elevated" aria-label="Tüm Test Kayıtları">
          <div className="section-header-row">
            <div>
              <h3 className="section-heading">Tüm Test Uygulamaları</h3>
              <p className="section-subtext">
                Klinik uzmanlarının uyguladığı tüm MMPI testlerini listeleyebilir, optik cevap formlarını detaylıca inceleyebilir ve silebilirsiniz.
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={refreshRecords}
              disabled={loadingRecords}
            >
              <Icon name="refresh" size={15} />
              <span>Yenile</span>
            </button>
          </div>

          <div className="search-filter-box">
            <div className="search-input-wrapper">
              <Icon name="search" size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Danışan adı, uygulayan psikolog veya kayıt no ile filtreleyin..."
                value={recordSearch}
                onChange={e => setRecordSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingRecords && (
            <div className="loading-state-card">
              <div className="spinner" />
              <p>Test kayıtları yükleniyor...</p>
            </div>
          )}

          {!loadingRecords && records.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Icon name="file" size={32} />
              </div>
              <h4>Sistemde Henüz Test Kaydı Yok</h4>
              <p>Psikologlar test taraması tamamladığında kayıtlar otomatik olarak burada listelenecektir.</p>
            </div>
          )}

          {!loadingRecords && records.length > 0 && filteredRecords.length === 0 && (
            <div className="empty-state-card">
              <p>Arama kriterinize uygun test kaydı bulunamadı.</p>
            </div>
          )}

          {!loadingRecords && filteredRecords.length > 0 && (
            <div className="modern-table-card">
              <div className="table-responsive">
                <table className="modern-data-table">
                  <thead>
                    <tr>
                      <th>Danışan</th>
                      <th>Cinsiyet / Yaş</th>
                      <th>Uygulayan Psikolog</th>
                      <th>Uygulama Tarihi</th>
                      <th>Kayıt Tarihi</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map(rec => (
                      <tr key={rec.id}>
                        <td>
                          <div className="table-user-cell">
                            <div className="user-initials-avatar">
                              {rec.firstName.charAt(0)}{rec.lastName.charAt(0)}
                            </div>
                            <div>
                              <strong className="cell-title">{rec.firstName} {rec.lastName}</strong>
                              <span className="cell-subtitle mono-sub">ID: {rec.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-secondary">
                            {rec.gender || '—'} {rec.age ? `(${rec.age})` : ''}
                          </span>
                        </td>
                        <td>
                          {rec.psychologistName ? (
                            <div className="badge-psychologist">
                              <Icon name="user" size={13} />
                              <span>{rec.psychologistName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-sm">Psikolog</span>
                          )}
                        </td>
                        <td>
                          <span className="date-tag">{rec.applicationDate}</span>
                        </td>
                        <td>
                          <span className="text-muted-sm">
                            {new Date(rec.createdAt).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td>
                          <div className="table-row-actions">
                            <button
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleViewRecord(rec.id)}
                              disabled={loadingDetail === rec.id}
                            >
                              <Icon name="eye" size={15} />
                              <span>{loadingDetail === rec.id ? 'Açılıyor...' : 'Testi İncele'}</span>
                            </button>
                            <button
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDeleteRecord(rec)}
                              disabled={deletingRecordId === rec.id}
                              title="Test kaydını sil"
                              aria-label="Test kaydını sil"
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: PSİKOLOG HESAPLARI YÖNETİMİ & SİLME */}
      {activeTab === 'users' && (
        <section className="dashboard-section card-elevated" aria-label="Psikolog Hesapları">
          <div className="section-header-row">
            <div>
              <h3 className="section-heading">Psikolog Kadrosu</h3>
              <p className="section-subtext">
                Kullanıcı durumunu (aktif/pasif) değiştirebilir veya psikolog hesabını kalıcı olarak silebilirsiniz.
              </p>
            </div>
            <div className="section-header-actions">
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => setActiveTab('new-user')}
              >
                <span>+ Psikolog Ekle</span>
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={refreshUsers}
                disabled={loadingUsers}
              >
                <Icon name="refresh" size={15} />
                <span>Yenile</span>
              </button>
            </div>
          </div>

          <div className="search-filter-box">
            <div className="search-input-wrapper">
              <Icon name="search" size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Psikolog adı, soyadı veya e-posta adresi ile ara..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
          </div>

          {loadingUsers && (
            <div className="loading-state-card">
              <div className="spinner" />
              <p>Psikolog hesapları yükleniyor...</p>
            </div>
          )}

          {!loadingUsers && users.length === 0 && (
            <div className="empty-state-card">
              <div className="empty-state-icon">
                <Icon name="users" size={32} />
              </div>
              <h4>Henüz Psikolog Hesabı Eklenmedi</h4>
              <p>Sistemi kullanacak uzmanları eklemek için "Yeni Psikolog Ekle" sekmesini kullanın.</p>
            </div>
          )}

          {!loadingUsers && users.length > 0 && filteredUsers.length === 0 && (
            <div className="empty-state-card">
              <p>Arama kriterinize uygun psikolog bulunamadı.</p>
            </div>
          )}

          {!loadingUsers && filteredUsers.length > 0 && (
            <div className="modern-table-card">
              <div className="table-responsive">
                <table className="modern-data-table">
                  <thead>
                    <tr>
                      <th>Psikolog</th>
                      <th>E-posta</th>
                      <th>Yetki</th>
                      <th>Durum</th>
                      <th style={{ textAlign: 'right' }}>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className={u.active ? '' : 'row-muted'}>
                        <td>
                          <div className="table-user-cell">
                            <div className={`user-initials-avatar ${!u.active ? 'avatar-inactive' : ''}`}>
                              {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                            </div>
                            <div>
                              <strong className="cell-title">{displayName(u)}</strong>
                              <span className="cell-subtitle">Klinik Psikolog</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="mono-sub">{u.email}</span>
                        </td>
                        <td>
                          <span className="badge-chip badge-default">Psikolog</span>
                        </td>
                        <td>
                          <span className={`status-pill ${u.active ? 'pill-active' : 'pill-inactive'}`}>
                            {u.active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td>
                          <div className="table-row-actions">
                            <button
                              type="button"
                              className={`btn-toggle-status ${u.active ? 'is-active' : ''}`}
                              disabled={busyUser === u.id}
                              onClick={() => void toggleActive(u)}
                            >
                              {busyUser === u.id ? 'İşleniyor...' : u.active ? 'Pasifleştir' : 'Aktifleştir'}
                            </button>
                            <button
                              type="button"
                              className="action-btn-danger"
                              onClick={() => void handleDeletePsychologist(u)}
                              disabled={deletingUserId === u.id}
                              title="Psikoloğu Sil"
                              aria-label="Psikoloğu Sil"
                            >
                              <Icon name="trash" size={15} />
                              <span>{deletingUserId === u.id ? 'Siliniyor...' : 'Sil'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: YENİ PSİKOLOG EKLEME FORMU */}
      {activeTab === 'new-user' && (
        <section className="dashboard-section card-elevated" aria-label="Yeni Psikolog Kaydı">
          <div className="section-header-row">
            <div>
              <span className="section-badge badge-primary">Yeni Uzman</span>
              <h3 className="section-heading">Psikolog Hesabı Oluştur</h3>
              <p className="section-subtext">
                Psikoloğun sisteme giriş yapabilmesi için bilgilerini eksiksiz tanımlayın.
              </p>
            </div>
          </div>

          <form className="admin-creation-form" onSubmit={addPsychologist}>
            <div className="form-grid-2col">
              <div className="form-group">
                <label>Ad *</label>
                <input
                  required
                  placeholder="Örn. Selin"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  autoComplete="off"
                />
              </div>

              <div className="form-group">
                <label>Soyad *</label>
                <input
                  required
                  placeholder="Örn. Demir"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Kurumsal veya Kişisel E-posta *</label>
              <input
                required
                type="email"
                placeholder="psikolog@kurum.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
              />
            </div>

            <div className="form-grid-2col">
              <div className="form-group">
                <label>Başlangıç Şifresi (En az 10 karakter) *</label>
                <input
                  required
                  type="password"
                  minLength={10}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label>Şifre Tekrarı *</label>
                <input
                  required
                  type="password"
                  minLength={10}
                  placeholder="••••••••••"
                  value={passwordAgain}
                  onChange={e => setPasswordAgain(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-actions-bar">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveTab('users')}
              >
                Vazgeç
              </button>
              <button className="btn-primary" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <div className="spinner-inline" />
                    <span>Hesap Oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={16} />
                    <span>Psikolog Hesabını Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Test Detay Modalı */}
      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
