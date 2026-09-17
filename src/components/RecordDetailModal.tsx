import { useState } from 'react';
import type { FullRecordDetail } from '../records/supabaseRecords';
import { methodLabel, parseRecordPayload } from '../workspace/caseTypes';
import { Icon } from './Icon';

function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

export function RecordDetailModal({
  record,
  onClose,
}: {
  record: FullRecordDetail;
  onClose: () => void;
}) {
  const parsed = parseRecordPayload(record.rawOmrAnswers ?? []);
  const client = parsed.client;
  const omrPages = parsed.omrPages;
  const [activePageNum, setActivePageNum] = useState<number>(omrPages[0]?.pageNumber ?? 1);
  const activePage = omrPages.find(page => page.pageNumber === activePageNum);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        <header className="modal-header">
          <div>
            <div className="badge-chip badge-primary">Kayıt</div>
            <h2 id="modal-title">
              {client?.firstName ?? record.firstName} {client?.lastName ?? record.lastName}
            </h2>
            <p className="modal-subtitle">
              {client?.testDate ?? record.applicationDate} · {new Date(record.createdAt).toLocaleString('tr-TR')}
              {parsed.method ? ` · ${methodLabel(parsed.method)}` : ''}
            </p>
          </div>
          <button type="button" className="icon-close-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" size={20} />
          </button>
        </header>

        <div className="modal-body">
          <section className="client-info-section">
            <h3 className="section-mini-heading">Danışan</h3>
            <div className="client-details-grid">
              <div className="detail-item">
                <span className="detail-label">Ad Soyad</span>
                <span className="detail-val">{dash(`${client?.firstName ?? record.firstName} ${client?.lastName ?? record.lastName}`.trim())}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Cinsiyet</span>
                <span className="detail-val">{dash(client?.gender ?? record.gender)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Yaş</span>
                <span className="detail-val">{dash(client?.age ?? record.age)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Test tarihi</span>
                <span className="detail-val">{dash(client?.testDate ?? record.applicationDate)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Süre</span>
                <span className="detail-val">{dash(parsed.testDuration)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Meslek</span>
                <span className="detail-val">{dash(client?.occupation ?? record.occupation)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">İzlem</span>
                <span className="detail-val">{dash(parsed.followUp)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Eğitim</span>
                <span className="detail-val">{dash(client?.education ?? record.education)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Medeni durum</span>
                <span className="detail-val">{dash(parsed.maritalStatus)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Başvuru nedeni</span>
                <span className="detail-val">{dash(parsed.applicationReason || record.requestedBy)}</span>
              </div>
              {parsed.method ? (
                <div className="detail-item">
                  <span className="detail-label">Yöntem</span>
                  <span className="detail-val">{methodLabel(parsed.method)}</span>
                </div>
              ) : null}
              {record.psychologistName && (
                <div className="detail-item">
                  <span className="detail-label">Uzman</span>
                  <span className="detail-val highlight">{record.psychologistName}</span>
                </div>
              )}
              <div className="detail-item">
                <span className="detail-label">Kayıt no</span>
                <span className="detail-val mono">{record.id}</span>
              </div>
            </div>
            {parsed.clinicalContext ? (
              <p className="ws-muted" style={{ marginTop: 12 }}>{parsed.clinicalContext}</p>
            ) : null}
          </section>

          {parsed.quickAnswers && (
            <section>
              <h3 className="section-mini-heading">Hızlı giriş</h3>
              <div className="answers-bubble-grid">
                {parsed.quickAnswers.map((choice, index) => (
                  <div
                    key={index}
                    className={`answer-bubble-cell ${
                      choice === 'D' ? 'choice-true' : choice === 'Y' ? 'choice-false' : 'choice-blank'
                    }`}
                  >
                    <span className="item-num">{index + 1}</span>
                    <span className="item-ans">{choice || 'Boş'}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {parsed.rawScales && (
            <section>
              <h3 className="section-mini-heading">Ham puan</h3>
              <div className="client-details-grid">
                {Object.entries(parsed.rawScales).map(([key, value]) => (
                  <div className="detail-item" key={key}>
                    <span className="detail-label">{key}</span>
                    <span className="detail-val">{value === '' ? '—' : String(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {omrPages.length > 0 && (
            <section className="answers-section">
              <div className="answers-nav-row">
                <h3 className="section-mini-heading">Optik cevaplar</h3>
                <div className="page-switcher-pills">
                  {omrPages.map(page => (
                    <button
                      key={page.pageNumber}
                      type="button"
                      className={`pill-btn ${page.pageNumber === activePageNum ? 'active' : ''}`}
                      onClick={() => setActivePageNum(page.pageNumber)}
                    >
                      {page.pageNumber}. sayfa
                    </button>
                  ))}
                </div>
              </div>

              {activePage ? (
                <div className="page-answers-table-container">
                  <div className="table-stats-bar">
                    <span>Set: <code>{activePage.batchId}</code></span>
                    <span>{activePage.items?.length || 0} madde</span>
                    <span>{Object.keys(activePage.manualReviews || {}).length} düzeltme</span>
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
                          <span className="item-ans">{effectiveChoice || 'Boş'}</span>
                          {isManual && <span className="manual-indicator" title="Manuel">✎</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="no-data-text">Ham optik veri yok.</p>
              )}
            </section>
          )}
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
