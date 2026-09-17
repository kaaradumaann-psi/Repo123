import { useMemo, useRef, useState } from 'react';
import type { FullRecordDetail } from '../records/supabaseRecords';
import { methodLabel, parseRecordPayload } from '../workspace/caseTypes';
import { answersFromRecordPayload, profileFromRecord } from '../results/recordProfile';
import { MMPIResultsPanel } from './results/MMPIResultsPanel';
import { Icon } from './Icon';

function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

type SectionId = 'results' | 'client' | 'omr';

export function RecordDetailModal({
  record,
  onClose,
}: {
  record: FullRecordDetail;
  onClose: () => void;
}) {
  const parsed = useMemo(() => parseRecordPayload(record.rawOmrAnswers ?? []), [record]);
  const client = parsed.client;
  const omrPages = parsed.omrPages;
  const profile = useMemo(() => profileFromRecord(record, parsed), [record, parsed]);
  const recordAnswers = useMemo(() => answersFromRecordPayload(parsed), [parsed]);
  const [activePageNum, setActivePageNum] = useState<number>(omrPages[0]?.pageNumber ?? 1);
  const activePage = omrPages.find(page => page.pageNumber === activePageNum);

  const resultsRef = useRef<HTMLDivElement | null>(null);
  const clientRef = useRef<HTMLDivElement | null>(null);
  const omrRef = useRef<HTMLDivElement | null>(null);

  const navItems: { id: SectionId; label: string }[] = [
    { id: 'results', label: 'Sonuçlar & Grafik' },
    { id: 'client', label: 'Danışan' },
    ...(omrPages.length > 0 ? [{ id: 'omr' as SectionId, label: 'Optik Cevaplar' }] : []),
  ];

  function scrollToSection(id: SectionId) {
    const el = id === 'results' ? resultsRef.current : id === 'client' ? clientRef.current : omrRef.current;
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`modal-container ${profile ? 'modal-wide' : ''}`}>
        <header className="modal-header">
          <div>
            <div className="modal-header-row">
              <div className="badge-chip badge-primary">Kayıt</div>
              {profile && (
                <div
                  className={`mmpi-validity-pill ${profile.validityAnalysis.isValid ? 'is-valid' : 'is-invalid'}`}
                  title="Geçerlik ölçeklerine göre profil durumu"
                >
                  <Icon name={profile.validityAnalysis.isValid ? 'checkCircle' : 'alert'} size={13} />
                  <span>{profile.validityAnalysis.isValid ? 'Geçerli Profil' : 'Şüpheli Profil'}</span>
                </div>
              )}
            </div>
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

        <nav className="modal-quicknav" aria-label="Bölümler arası gezinme">
          {navItems.map(item => (
            <button key={item.id} type="button" className="quicknav-chip" onClick={() => scrollToSection(item.id)}>
              <Icon name={item.id === 'results' ? 'trend' : item.id === 'client' ? 'user' : 'scan'} size={13} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="modal-body">
          <div ref={resultsRef} className="modal-section-anchor">
            <section className="record-results-section" aria-label="MMPI sonuçları">
              <h3 className="section-mini-heading modal-section-title">
                <Icon name="pulse" size={15} />
                MMPI Sonuçları &amp; Grafik
              </h3>
              {profile ? (
                <MMPIResultsPanel
                  profile={profile}
                  clientName={`${client?.firstName ?? record.firstName} ${client?.lastName ?? record.lastName}`.trim()}
                  answers={recordAnswers ?? undefined}
                />
              ) : (
                <div className="mmpi-results-placeholder">
                  <Icon name="info" size={20} />
                  <div>
                    <strong>Profil hesaplanamadı</strong>
                    <p className="ws-muted">
                      Bu kaydın verisi skorlamaya uygun değil (cinsiyet normlara uygun seçilmemiş olabilir ya da
                      cevap/ham puan verisi eksik). Aşağıda ham verileri görebilirsiniz.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div ref={clientRef} className="modal-section-anchor">
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
          </div>

          {/* Panelin “Soru Yanıtları” sekmesi bu listeyi gösterdiğinden, profil
              mevcutken 566 baloncuk tekrarı gizlenir; profilsiz kayıtlarda yine görünür. */}
          {parsed.quickAnswers && !profile && (
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
            <div ref={omrRef} className="modal-section-anchor">
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
            </div>
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
