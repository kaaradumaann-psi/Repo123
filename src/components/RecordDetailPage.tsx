import { useEffect, useMemo, useState } from 'react';
import { getRecordDetail } from '../records/supabaseRecords';
import type { FullRecordDetail } from '../records/supabaseRecords';
import { methodLabel, parseRecordPayload } from '../workspace/caseTypes';
import { answersFromRecordPayload, profileFromRecord } from '../results/recordProfile';
import { MMPIReport } from './results/MMPIReport';
import { Icon } from './Icon';

function dash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

/**
 * Test kaydı detay sayfası — açılır pencere değil, tam sayfa.
 * `#/test/<id>` hash rotasıyla açılır; Supabase RLS erişimi zorlar
 * (yönetici tüm kayıtları, psikolog yalnız kendi kayıtlarını görür).
 */
export function RecordDetailPage({ recordId, onBack }: { recordId: string; onBack: () => void }) {
  const [record, setRecord] = useState<FullRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getRecordDetail(recordId)
      .then(detail => {
        if (active) setRecord(detail);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'Test kaydı yüklenemedi.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [recordId]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [recordId]);

  const parsed = useMemo(() => (record ? parseRecordPayload(record.rawOmrAnswers ?? []) : null), [record]);
  const client = parsed?.client;
  const omrPages = parsed?.omrPages ?? [];
  const profile = useMemo(
    () => (record && parsed ? profileFromRecord(record, parsed) : null),
    [record, parsed],
  );
  const answers = useMemo(() => (parsed ? answersFromRecordPayload(parsed) : null), [parsed]);

  if (loading) {
    return (
      <div className="record-page">
        <div className="loading-state-card">
          <div className="spinner" />
          <p>Test kaydı açılıyor...</p>
        </div>
      </div>
    );
  }

  if (error || !record || !parsed) {
    return (
      <div className="record-page">
        <div className="record-page-topbar no-print">
          <button type="button" className="btn-secondary btn-sm" onClick={onBack}>
            <Icon name="left" size={15} />
            <span>Listeye dön</span>
          </button>
        </div>
        <div className="empty-state-card">
          <div className="empty-state-icon">
            <Icon name="alert" size={32} />
          </div>
          <h4>Kayıt açılamadı</h4>
          <p>{error || 'Bu kayıt bulunamadı ya da erişim yetkiniz yok.'}</p>
          <button type="button" className="btn-secondary btn-sm" onClick={onBack}>
            Listeye dön
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${client?.firstName ?? record.firstName} ${client?.lastName ?? record.lastName}`.trim();

  return (
    <div className="record-page">
      <div className="record-page-topbar no-print">
        <button type="button" className="btn-secondary btn-sm" onClick={onBack}>
          <Icon name="left" size={15} />
          <span>Listeye dön</span>
        </button>
        <div className="record-page-topbar-title">
          <span className="section-badge badge-primary">Kayıt İnceleme</span>
          <span className="mono-sub">ID: {record.id}</span>
        </div>
        <button type="button" className="btn-secondary btn-sm" onClick={() => window.print()}>
          <Icon name="sheet" size={15} />
          <span>Yazdır / PDF</span>
        </button>
      </div>

      <header className="record-page-header">
        <div>
          <h1 className="record-page-name">{fullName}</h1>
          <p className="record-page-sub">
            {dash(client?.testDate ?? record.applicationDate)} · Kayıt:{' '}
            {new Date(record.createdAt).toLocaleString('tr-TR')}
            {parsed.method ? ` · ${methodLabel(parsed.method)}` : ''}
          </p>
        </div>
        {record.psychologistName && (
          <div className="record-page-psychologist">
            <Icon name="user" size={14} />
            <div>
              <span>Uygulayan Uzman</span>
              <b>{record.psychologistName}</b>
            </div>
          </div>
        )}
      </header>

      <section className="client-info-section" aria-label="Danışan bilgileri">
        <h3 className="section-mini-heading">Danışan ve Uygulama Bilgileri</h3>
        <div className="client-details-grid">
          <div className="detail-item">
            <span className="detail-label">Ad Soyad</span>
            <span className="detail-val">{dash(fullName)}</span>
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
            <span className="detail-label">Eğitim</span>
            <span className="detail-val">{dash(client?.education ?? record.education)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Medeni durum</span>
            <span className="detail-val">{dash(parsed.maritalStatus)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">İzlem</span>
            <span className="detail-val">{dash(parsed.followUp)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Başvuru nedeni</span>
            <span className="detail-val">{dash(parsed.applicationReason || record.requestedBy)}</span>
          </div>
          {parsed.method && (
            <div className="detail-item">
              <span className="detail-label">Yöntem</span>
              <span className="detail-val">{methodLabel(parsed.method)}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Uzman</span>
            <span className="detail-val highlight">{dash(record.psychologistName)}</span>
          </div>
        </div>
        {parsed.clinicalContext && <p className="ws-muted record-page-context">{parsed.clinicalContext}</p>}
      </section>

      {profile ? (
        <MMPIReport profile={profile} clientName={fullName} answers={answers ?? undefined} />
      ) : (
        <div className="mmpi-results-placeholder">
          <Icon name="info" size={20} />
          <div>
            <strong>Profil hesaplanamadı</strong>
            <p className="ws-muted">
              Bu kaydın verisi skorlamaya uygun değil (cinsiyet normlara uygun seçilmemiş olabilir ya da cevap/ham
              puan verisi eksik). Aşağıda ham verileri görebilirsiniz.
            </p>
          </div>
        </div>
      )}

      {/* Ham veri bölümü: profil varken optik cevaplar “Soru Yanıtları”
          bölümünde zaten görünür; profilsiz kayıtlarda ham veri gösterilir. */}
      {!profile && parsed.quickAnswers && (
        <section className="report-section" aria-label="Hızlı giriş cevapları">
          <h3 className="report-section-title">
            <Icon name="sheet" size={16} /> Hızlı giriş cevapları
          </h3>
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

      {!profile && parsed.rawScales && (
        <section className="report-section" aria-label="Ham puanlar">
          <h3 className="report-section-title">
            <Icon name="pulse" size={16} /> Ham puanlar
          </h3>
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

      {!profile && omrPages.length > 0 && <OmrPagesFallback pages={omrPages} />}
    </div>
  );
}

function OmrPagesFallback({ pages }: { pages: ReturnType<typeof parseRecordPayload>['omrPages'] }) {
  const [activePageNum, setActivePageNum] = useState<number>(pages[0]?.pageNumber ?? 1);
  const activePage = pages.find(page => page.pageNumber === activePageNum);
  return (
    <section className="report-section" aria-label="Optik cevaplar">
      <div className="answers-nav-row">
        <h3 className="report-section-title">
          <Icon name="scan" size={16} /> Optik cevaplar
        </h3>
        <div className="page-switcher-pills">
          {pages.map(page => (
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
        <div className="answers-bubble-grid">
          {activePage.items?.map(item => {
            const review = activePage.manualReviews?.[item.itemId];
            const effectiveChoice = review ? review.choiceId : item.choiceId;
            return (
              <div
                key={item.itemId}
                className={`answer-bubble-cell ${
                  effectiveChoice === 'D' ? 'choice-true' : effectiveChoice === 'Y' ? 'choice-false' : 'choice-blank'
                } ${review ? 'is-reviewed' : ''}`}
              >
                <span className="item-num">{item.itemNumber}</span>
                <span className="item-ans">{effectiveChoice || 'Boş'}</span>
                {review && <span className="manual-indicator" title="Manuel">✎</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="no-data-text">Ham optik veri yok.</p>
      )}
    </section>
  );
}
