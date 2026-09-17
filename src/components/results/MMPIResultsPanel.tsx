import { useState } from 'react';
import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ItemAnswer } from '../../workspace/caseTypes';
import { tColor } from '../../scoring/mmpiInterpretation';
import type { IconName } from '../Icon';
import { Icon } from '../Icon';
import { MMPIScoreChart } from './MMPIScoreChart';
import { MMPIValidityTab } from './MMPIValidityTab';
import { MMPIClinicalTab } from './MMPIClinicalTab';
import { MMPICodeTab } from './MMPICodeTab';
import { MMPIExtraTab } from './MMPIExtraTab';
import { MMPIAnswersTab } from './MMPIAnswersTab';

export type MmpiResultsTab = 'overview' | 'validity' | 'clinical' | 'code' | 'extra' | 'answers';

const TABS: { id: MmpiResultsTab; label: string; icon: IconName }[] = [
  { id: 'overview', label: 'Genel Bakış', icon: 'pulse' },
  { id: 'validity', label: 'Geçerlik Analizleri', icon: 'info' },
  { id: 'clinical', label: 'Klinik Ölçekler', icon: 'list' },
  { id: 'code', label: 'Kod Analizleri', icon: 'trend' },
  { id: 'extra', label: 'Ek Ölçekler & Kritikler', icon: 'layers' },
  { id: 'answers', label: 'Soru Yanıtları', icon: 'sheet' },
];

type Props = {
  profile: MMPIProfile;
  clientName?: string;
  /** Madde düzeyinde (566) yanıt dizisi — “Soru Yanıtları” sekmesinde gösterilir. */
  answers?: ItemAnswer[];
};

function formatT(t: number): string {
  return t.toFixed(1);
}

/**
 * MMPI sonuç paneli — sekmeli düzen:
 * Genel Bakış (profil grafiği + özet tablo), Geçerlik Analizleri, Klinik
 * Ölçekler, Kod Analizleri, Ek Ölçekler & Kritikler, Soru Yanıtları.
 */
export function MMPIResultsPanel({ profile, clientName, answers }: Props) {
  const [tab, setTab] = useState<MmpiResultsTab>('overview');
  const { validityAnalysis, profileCode } = profile;
  const clinical = profile.clinical;

  return (
    <div className="mmpi-results-panel">
      <header className="mmpi-results-header">
        <div>
          <div className="mmpi-results-meta">
            <span className="section-badge badge-primary">Hesaplama · Türk Normları (Savaşır 1981)</span>
            {clientName && <span className="mmpi-chip">{clientName}</span>}
            <span className="mmpi-chip">{profile.gender} normları</span>
            {profileCode && <span className="mmpi-chip mmpi-chip-code">Profil Kodu: {profileCode}</span>}
          </div>
          <h3 className="mmpi-results-title">
            MMPI <em>Sonuçları</em>
          </h3>
        </div>
        <div className={`mmpi-validity-pill ${validityAnalysis.isValid ? 'is-valid' : 'is-invalid'}`}>
          <Icon name={validityAnalysis.isValid ? 'checkCircle' : 'alert'} size={14} />
          <span>{validityAnalysis.isValid ? 'Geçerli Profil' : 'Şüpheli / Geçersiz Profil'}</span>
        </div>
      </header>

      <nav className="mmpi-tabs" role="tablist" aria-label="MMPI sonuç sekmeleri">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`mmpi-tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <Icon name={t.icon} size={14} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div role="tabpanel" className="mmpi-tab-panel">
          <section className="mmpi-chart-card">
            <h4 className="mmpi-card-title">
              <span className="mmpi-card-dot" />
              MMPI Profil Grafiği (T-Skorları)
            </h4>
            <MMPIScoreChart scales={profile.scales} />
          </section>

          <section className="mmpi-summary-card">
            <div className="mmpi-summary-table-wrap">
              <table className="mmpi-summary-table">
                <thead>
                  <tr>
                    <th className="row-head">Ölçek</th>
                    {clinical.map(s => (
                      <th key={s.id} title={s.fullName}>
                        {s.shortName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="row-head">Ham Puan</th>
                    {clinical.map(s => (
                      <td key={s.id} className="num">
                        {s.rawScore}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="row-head">K Eklemesi (K+)</th>
                    {clinical.map(s => (
                      <td key={s.id} className="num k-add">
                        {s.kAdded !== undefined ? `+${s.kAdded}` : '—'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th className="row-head">T Puanı</th>
                    {clinical.map(s => (
                      <td key={s.id} className="num t-val" style={{ color: tColor(s.tScore) }}>
                        {formatT(s.tScore)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mmpi-summary-note">
              T skorları cinsiyete özgü Türk normlarına göre hesaplanır; klinik ölçeklerde K düzeltmesi
              uygulanmıştır. Ölçeğe özgü T puanı aralıkları ve yorumları kaynak rapora dayanır ve “Klinik
              Ölçekler” sekmesinde gösterilir; geçerlik kararları “Geçerlik Analizleri” sekmesindeki kaynak
              tablolarına göre verilir.
            </p>
          </section>
        </div>
      )}

      {tab === 'validity' && <MMPIValidityTab profile={profile} />}
      {tab === 'clinical' && <MMPIClinicalTab profile={profile} />}
      {tab === 'code' && <MMPICodeTab profile={profile} />}
      {tab === 'extra' && <MMPIExtraTab profile={profile} />}
      {tab === 'answers' && <MMPIAnswersTab answers={answers} />}

      <p className="mmpi-info-foot">
        * Bu hesaplama Savaşır (1981) Türk standardizasyonu normları (Erkek/Kadın ayrı) ve klasik K düzeltme
        oranları (Hs .5, Pd .4, Pt 1, Sc 1, Ma .2) kullanılarak yapılmıştır. Geçerlik analizleri, klinik ölçek
        yorumları, tek ölçek yükselmeleri ve kod analizleri depodaki kaynak.pdf raporuna birebir dayanır.
        Kesme puanları tanı koymaz; yalnızca uzmana yol gösterir. Klinik karar nihai olarak uygulayıcı uzmana aittir.
      </p>
    </div>
  );
}
