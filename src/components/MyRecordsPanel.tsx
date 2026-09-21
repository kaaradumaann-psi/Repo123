import { useEffect, useState } from 'react';
import { listOwnRecords, deleteRecord } from '../records/supabaseRecords';
import type { RecordSummary } from '../records/supabaseRecords';
import { ConfirmDialog } from './ConfirmDialog';
import { navigate } from '../router';
import { Icon } from './Icon';

export function MyRecordsPanel() {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<RecordSummary | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchRecords() {
    try {
      setLoading(true);
      setError('');
      const result = await listOwnRecords();
      setRecords(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Kayıtlar yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchRecords();
  }, []);

  async function confirmDelete() {
    const record = confirmTarget;
    if (!record) return;
    setDeletingId(record.id);
    try {
      await deleteRecord(record.id);
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setConfirmTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt silinemedi.');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = records.filter(r => {
    // Tarih filtresi: uygulama tarihi (YYYY-MM-DD) aralık içinde olmalı.
    if (dateFrom && r.applicationDate < dateFrom) return false;
    if (dateTo && r.applicationDate > dateTo) return false;
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    return (
      r.firstName.toLowerCase().includes(query) ||
      r.lastName.toLowerCase().includes(query) ||
      r.id.toLowerCase().includes(query) ||
      (r.occupation && r.occupation.toLowerCase().includes(query))
    );
  });

  return (
    <section className="dashboard-section" aria-labelledby="saved-records-title">
      <div className="section-header-row">
        <div>
          <span className="section-badge badge-primary">Arşiv</span>
          <h3 id="saved-records-title" className="section-heading">Kayıtlar</h3>
          <p className="section-subtext">
            Bu hesaptan tamamlanan MMPI uygulamaları. “Testi İncele” kaydı ayrı bir sayfada açar: T skorları, profil
            grafiği, geçerlik/kod analizleri ve cevap detayı tek raporda görüntülenir; hatalı kayıtları buradan kaldırın.
          </p>
        </div>
        <div className="section-header-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={() => void fetchRecords()} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>Yenile</span>
          </button>
          <div className="stats-pill">{records.length} Kayıt</div>
        </div>
      </div>

      <div className="search-filter-box">
        <div className="search-input-wrapper">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Danışan adı, soyadı veya kayıt no ile ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Kayıtlarda ara"
          />
        </div>
        <div className="date-range-filter">
          <label className="date-filter-field">
            <span>Başlangıç</span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={e => setDateFrom(e.target.value)}
              aria-label="Uygulama tarihi başlangıç filtresi"
            />
          </label>
          <label className="date-filter-field">
            <span>Bitiş</span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={e => setDateTo(e.target.value)}
              aria-label="Uygulama tarihi bitiş filtresi"
            />
          </label>
          {(dateFrom || dateTo) && (
            <button
              type="button"
              className="btn-secondary btn-sm"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
            >
              Tarihi temizle
            </button>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Kayıtlar yükleniyor, lütfen bekleyin...</p>
        </div>
      )}

      {error && !loading && (
        <div className="status-banner error-banner" role="alert">
          <Icon name="alert" size={18} />
          <span style={{ flex: 1 }}>{error}</span>
          <button type="button" className="btn-secondary btn-sm" onClick={() => void fetchRecords()}>
            Tekrar dene
          </button>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Icon name="file" size={32} />
          </div>
          <h4>Henüz kayıt yok</h4>
          <p>İşlem sekmesinden yeni bir MMPI başlatın; tamamlanan uygulamalar burada listelenecek.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && filtered.length === 0 && (
        <div className="empty-state-card">
          <p>Arama ve tarih filtrenizle eşleşen danışan kaydı bulunamadı. Filtreleri gevşetmeyi deneyin.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="modern-table-card">
          <div className="table-responsive">
            <table className="modern-data-table">
              <thead>
                <tr>
                  <th>Danışan</th>
                  <th>Cinsiyet / Yaş</th>
                  <th>Uygulama Tarihi</th>
                  <th>Kayıt Tarihi</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="table-user-cell">
                        <div className="user-initials-avatar">
                          {record.firstName.charAt(0)}{record.lastName.charAt(0)}
                        </div>
                        <div>
                          <strong className="cell-title">{record.firstName} {record.lastName}</strong>
                          <span className="cell-subtitle mono-sub">ID: {record.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-secondary">
                        {record.gender || '—'} {record.age ? `(${record.age})` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="date-tag">{record.applicationDate}</span>
                    </td>
                    <td>
                      <span className="text-muted-sm">
                        {new Date(record.createdAt).toLocaleDateString('tr-TR', {
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
                        <a
                          href={`/kayitlar/${record.id}`}
                          className="action-btn-primary"
                        >
                          <Icon name="eye" size={15} />
                          <span>Testi İncele</span>
                        </a>
                        <button
                          type="button"
                          className="action-btn-secondary"
                          onClick={() => navigate(`/islem?duzenle=${record.id}`)}
                          title="Kaydı düzenle (yeni revizyon oluşturur)"
                          aria-label={`${record.firstName} ${record.lastName} kaydını düzenle`}
                        >
                          <Icon name="edit" size={15} />
                        </button>
                        <button
                          type="button"
                          className="action-btn-danger"
                          onClick={() => setConfirmTarget(record)}
                          disabled={deletingId === record.id}
                          title="Bu kaydı kalıcı sil (geri alınamaz)"
                          aria-label={`${record.firstName} ${record.lastName} kaydını sil`}
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

      {confirmTarget && (
        <ConfirmDialog
          title={`"${confirmTarget.firstName} ${confirmTarget.lastName}" kaydı silinsin mi?`}
          description="Test kaydı ve cevap verisi kalıcı olarak silinecek. Bu işlem geri alınamaz."
          confirmLabel="Evet, kaydı sil"
          busy={deletingId === confirmTarget.id}
          onConfirm={() => void confirmDelete()}
          onCancel={() => {
            if (!deletingId) setConfirmTarget(null);
          }}
        />
      )}

    </section>
  );
}
