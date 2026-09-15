import { useState } from 'react';
import type { FullRecordDetail } from '../records/supabaseRecords';
import { Icon } from './Icon';

export function RecordDetailModal({
  record,
  onClose,
}: {
  record: FullRecordDetail;
  onClose: () => void;
}) {
  const [activePageNum, setActivePageNum] = useState<number>(
    record.rawOmrAnswers?.[0]?.pageNumber ?? 1
  );

  const activePage = record.rawOmrAnswers?.find(p => p.pageNumber === activePageNum);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        <header className="modal-header">
          <div>
            <div className="badge-chip badge-primary">Test Detay Raporu</div>
            <h2 id="modal-title">
              {record.firstName} {record.lastName}
            </h2>
            <p className="modal-subtitle">
              Uygulama Tarihi: {record.applicationDate} · Kayıt: {new Date(record.createdAt).toLocaleString('tr-TR')}
            </p>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="modal-body">
          {/* Danışan Bilgileri Kartı */}
          <section className="client-info-section">
            <h3 className="section-mini-heading">Danışan ve Uygulama Bilgileri</h3>
            <div className="client-details-grid">
              <div className="detail-item">
                <span className="detail-label">Ad Soyad</span>
                <span className="detail-val">{record.firstName} {record.lastName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cinsiyet</span>
                <span className="detail-val">{record.gender || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Yaş</span>
                <span className="detail-val">{record.age !== undefined ? `${record.age} yaş` : '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Meslek</span>
                <span className="detail-val">{record.occupation || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Eğitim</span>
                <span className="detail-val">{record.education || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">İstekte Bulunan</span>
                <span className="detail-val">{record.requestedBy || '—'}</span>
              </div>
              {record.psychologistName && (
                <div className="detail-item">
                  <span className="detail-label">Uygulayan Psikolog</span>
                  <span className="detail-val highlight">{record.psychologistName}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Kayıt Numarası</span>
                <span className="detail-val mono">{record.id}</span>
              </div>
            </div>
          </section>

          {/* Sayfalar ve Cevaplar */}
          <section className="answers-section">
            <div className="answers-nav-row">
              <h3 className="section-mini-heading">Optik Cevaplar</h3>
              {record.rawOmrAnswers?.length > 0 && (
                <div className="page-switcher-pills">
                  {record.rawOmrAnswers.map(p => (
                    <button
                      key={p.pageNumber}
                      type="button"
                      className={`pill-btn ${p.pageNumber === activePageNum ? 'active' : ''}`}
                      onClick={() => setActivePageNum(p.pageNumber)}
                    >
                      {p.pageNumber}. Sayfa ({p.items?.length || 0} Madde)
                    </button>
                  ))}
                </div>
              )}
            </div>

            {activePage ? (
              <div className="page-answers-table-container">
                <div className="table-stats-bar">
                  <span>Sayfa Set Kodu: <code>{activePage.batchId}</code></span>
                  <span>Toplam Okunan: <strong>{activePage.items?.length || 0} madde</strong></span>
                  <span>
                    İncelenen: <strong>{Object.keys(activePage.manualReviews || {}).length} madde</strong>
                  </span>
                </div>

                <div className="answers-bubble-grid">
                  {activePage.items?.map(item => {
                    const review = activePage.manualReviews?.[item.itemId];
                    const effectiveChoice = review ? review.choiceId : item.choiceId;
                    const isManual = Boolean(review);

                    return (
                      <div
                        key={item.itemId}
                        className={`answer-bubble-cell ${
                          effectiveChoice === 'D'
                            ? 'choice-true'
                            : effectiveChoice === 'Y'
                            ? 'choice-false'
                            : 'choice-blank'
                        } ${isManual ? 'is-reviewed' : ''}`}
                      >
                        <span className="item-num">{item.itemNumber}</span>
                        <span className="item-ans">
                          {effectiveChoice || 'Boş'}
                        </span>
                        {isManual && <span className="manual-indicator" title="Manuel düzenlendi">✎</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="no-data-text">Bu sayfaya ait ham optik cevap verisi bulunamadı.</p>
            )}
          </section>
        </div>

        <footer className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Kapat
          </button>
        </footer>
      </div>
    </div>
  );
}
