import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ItemAnswer } from '../../workspace/caseTypes';
import { tColor } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';
import { MMPIScoreChart } from './MMPIScoreChart';
import { MMPIValidityTab } from './MMPIValidityTab';
import { MMPIClinicalTab } from './MMPIClinicalTab';
import { MMPICodeTab } from './MMPICodeTab';
import { MMPIDerivedSection } from './MMPIDerivedSection';
import { MMPIExtraTab } from './MMPIExtraTab';
import { MMPICriticalSection } from './MMPICriticalSection';
import { MMPIAnswersTab } from './MMPIAnswersTab';

type ReportSectionId =
  | 'rapor-overview'
  | 'rapor-validity'
  | 'rapor-clinical'
  | 'rapor-code'
  | 'rapor-derived'
  | 'rapor-extra'
  | 'rapor-critical'
  | 'rapor-answers';

const SECTION_NAV: { id: ReportSectionId; label: string }[] = [
  { id: 'rapor-overview', label: 'Genel Bakış' },
  { id: 'rapor-validity', label: 'Geçerlik Analizleri' },
  { id: 'rapor-clinical', label: 'Klinik Ölçekler' },
  { id: 'rapor-code', label: 'Kod Analizleri' },
  { id: 'rapor-derived', label: 'Türetilmiş Ölçekler' },
  { id: 'rapor-extra', label: 'Desenler & Sözlük' },
  { id: 'rapor-critical', label: 'Kritik Bulgular' },
  { id: 'rapor-answers', label: 'Soru Yanıtları' },
];

/**
 * Düz (sekmeler içine gömülmemiş) MMPI değerlendirme raporu. Tüm bölümler
 * tek sayfada alt alta akar; üstteki çiplar bölüm başlıklarına kaydırır.
 */
export function MMPIReport({
  profile,
  clientName,
  answers,
}: {
  profile: MMPIProfile;
  clientName?: string;
  answers?: ItemAnswer[];
}) {
  const { validityAnalysis, profileCode } = profile;
  const clinical = profile.clinical;

  return (
    <div className="mmpi-report">
      <div className={`mmpi-validity-banner ${validityAnalysis.isValid ? 'is-valid' : 'is-invalid'}`}>
        <Icon name={validityAnalysis.isValid ? 'checkCircle' : 'alert'} size={16} />
        <div>
          <b>{validityAnalysis.isValid ? 'TEST GEÇERLİ' : 'PROFİL ŞÜPHELİ / GEÇERSİZ'}</b>
          <span>
            {validityAnalysis.isValid
              ? 'Profil yorumlanabilir durumdadır; geçerlik göstergeleri ayrıntılı olarak aşağıda verilmiştir.'
              : 'Geçerlik göstergeleri profilin yorumlanmasını güçleştiriyor; ayrıntılar “Geçerlik Analizleri” bölümündedir.'}
          </span>
        </div>
        {profileCode && <span className="report-code-chip">Profil Kodu: {profileCode}</span>}
      </div>

      <nav className="report-quicknav" aria-label="Rapor bölümleri">
        {SECTION_NAV.map(item => (
          <button
            key={item.id}
            type="button"
            className="quicknav-chip"
            onClick={() => {
              // hash değiştirilmeden kaydırılır: hash router #/test/<id> rotasını korur
              const target = document.getElementById(item.id);
              if (!target) return;
              target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="report-section" id="rapor-overview" aria-label="Genel bakış">
        <h3 className="report-section-title">
          <Icon name="pulse" size={16} /> Genel Bakış
        </h3>
        <div className="mmpi-results-meta" style={{ marginBottom: 10 }}>
          <span className="section-badge badge-primary">Hesaplama · Türk Normları (Savaşır 1981)</span>
          {clientName && <span className="mmpi-chip">{clientName}</span>}
          <span className="mmpi-chip">{profile.gender} normları</span>
        </div>
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
                      {s.tScore.toFixed(1)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section className="report-section" id="rapor-validity" aria-label="Geçerlik analizleri">
        <h3 className="report-section-title">
          <Icon name="info" size={16} /> Geçerlik Analizleri
        </h3>
        <MMPIValidityTab profile={profile} />
      </section>

      <section className="report-section" id="rapor-clinical" aria-label="Klinik ölçekler">
        <h3 className="report-section-title">
          <Icon name="list" size={16} /> Klinik Ölçekler
        </h3>
        <MMPIClinicalTab profile={profile} />
      </section>

      <section className="report-section" id="rapor-code" aria-label="Kod analizleri">
        <h3 className="report-section-title">
          <Icon name="trend" size={16} /> Kod Analizleri
        </h3>
        <MMPICodeTab profile={profile} />
      </section>

      <section className="report-section" id="rapor-derived" aria-label="Türetilmiş ölçekler ve endeksler">
        <h3 className="report-section-title">
          <Icon name="layers" size={16} /> Türetilmiş Ölçekler &amp; Endeksler
        </h3>
        <MMPIDerivedSection profile={profile} />
      </section>

      <section className="report-section" id="rapor-extra" aria-label="Desen göstergeleri ve ölçek sözlüğü">
        <h3 className="report-section-title">
          <Icon name="file" size={16} /> Desen Göstergeleri &amp; Ölçek Sözlüğü
        </h3>
        <MMPIExtraTab profile={profile} />
      </section>

      <section className="report-section" id="rapor-critical" aria-label="Kritik bulgular">
        <h3 className="report-section-title">
          <Icon name="alert" size={16} /> Kritik Bulgular &amp; İzlenimler
        </h3>
        <MMPICriticalSection profile={profile} />
      </section>

      <section className="report-section" id="rapor-answers" aria-label="Soru yanıtları">
        <h3 className="report-section-title">
          <Icon name="sheet" size={16} /> Soru Yanıtları
        </h3>
        <MMPIAnswersTab answers={answers} />
      </section>

      <p className="mmpi-info-foot">
        * Bu hesaplama Savaşır (1981) Türk standardizasyonu normları (Erkek/Kadın ayrı) ve klasik K düzeltme oranları
        (Hs .5, Pd .4, Pt 1, Sc 1, Ma .2 — standart ekleme tablosuyla) kullanılarak yapılmıştır. Geçerlik analizleri,
        klinik ölçek yorumları, tek ölçek yükselmeleri ve kod analizleri klinik yorum rehberine dayanır. Kesme puanları
        tanı koymaz; yalnızca uzmana yol gösterir. Klinik karar nihai olarak uygulayıcı uzmana aittir.
      </p>
    </div>
  );
}
