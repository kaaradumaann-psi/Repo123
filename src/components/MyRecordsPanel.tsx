import { useEffect, useState } from 'react';
import { listOwnRecords, getRecordDetail, deleteRecord } from '../records/supabaseRecords';
import type { RecordSummary, FullRecordDetail } from '../records/supabaseRecords';
import { RecordDetailModal } from './RecordDetailModal';
import { Icon } from './Icon';

export function MyRecordsPanel() {
  const [records, setRecords] = useState<RecordSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<FullRecordDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
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

  async function handleViewDetail(recordId: string) {
    try {
      setLoadingDetail(recordId);
      const detail = await getRecordDetail(recordId);
      setSelectedRecord(detail);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Detaylar yüklenemedi.');
    } finally {
      setLoadingDetail(null);
    }
  }

  async function handleDelete(record: RecordSummary) {
    if (!window.confirm(`"${record.firstName} ${record.lastName}" adlı danışana ait test kaydını silmek istediğinize emin misiniz?`)) {
      return;
    }
    setDeletingId(record.id);
    try {
      await deleteRecord(record.id);
      setRecords(prev => prev.filter(r => r.id !== record.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Kayıt silinemedi.');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = records.filter(r => {
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
          <span className="section-badge">Arşiv</span>
          <h3 id="saved-records-title" className="section-heading">Tamamlanan Test Kayıtlarım</h3>
          <p className="section-subtext">Gerçekleştirdiğiniz test uygulamalarını inceleyebilir, detaylı cevap tablosuna ulaşabilirsiniz.</p>
        </div>
        <div className="section-header-actions">
          <button type="button" className="btn-secondary btn-sm" onClick={fetchRecords} disabled={loading}>
            <Icon name="refresh" size={15} />
            <span>Yenile</span>
          </button>
          <div className="stats-pill">{records.length} Kayıt</div>
        </div>
      </div>

      {/* Arama Barı */}
      <div className="search-filter-box">
        <div className="search-input-wrapper">
          <Icon name="search" size={16} className="search-icon" />
          <input
            type="search"
            placeholder="Danışan adı, soyadı veya kayıt no ile ara..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
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
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Icon name="file" size={32} />
          </div>
          <h4>Henüz Test Kaydı Bulunmuyor</h4>
          <p>Yukarıdaki tarayıcıyı kullanarak 4 sayfalık form setini tarayıp ilk kaydınızı oluşturabilirsiniz.</p>
        </div>
      )}

      {!loading && !error && records.length > 0 && filtered.length === 0 && (
        <div className="empty-state-card">
          <p>Aramanızla eşleşen danışan kaydı bulunamadı.</p>
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
                        <button
                          type="button"
                          className="action-btn-primary"
                          onClick={() => handleViewDetail(record.id)}
                          disabled={loadingDetail === record.id}
                        >
                          <Icon name="eye" size={15} />
                          <span>{loadingDetail === record.id ? 'Açılıyor...' : 'Testi İncele'}</span>
                        </button>
                        <button
                          type="button"
                          className="action-btn-danger"
                          onClick={() => handleDelete(record)}
                          disabled={deletingId === record.id}
                          title="Bu kaydı sil"
                          aria-label="Kaydı sil"
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

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </section>
  );
}
