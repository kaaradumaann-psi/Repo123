import type { MMPIProfile } from '../../scoring/mmpiScoring';
import { MMPIScoreChart } from './MMPIScoreChart';
import { Icon } from '../Icon';

type Props = {
  profile: MMPIProfile;
  clientName?: string;
};

export function MMPIResultsPanel({ profile, clientName }: Props) {
  const { validity, clinical, cannotSayScale, validityAnalysis, profileCode } = profile;

  return (
    <div className="mmpi-results-panel">
      <header className="mmpi-results-header">
        <div>
          <span className="section-badge badge-primary">Hesaplama · Türk Normları (Savaşır 1981)</span>
          <h3 className="mmpi-results-title">
            MMPI <em>Profil</em> {clientName ? `· ${clientName}` : ''} {profileCode ? `· Kod: ${profileCode}` : ''}
          </h3>
          <p className="ws-muted">
            Ham puanlar K düzeltmesiyle T skoruna çevrildi. T = 50 + 10·(X-M)/SD; Mf kadın ölçeğinde ters çevrilir. T ≥70 klinik eşik, 56-70 orta yüksek aralıktır.
          </p>
        </div>
        <div className={`mmpi-validity-pill ${validityAnalysis.isValid ? 'is-valid' : 'is-invalid'}`}>
          <Icon name={validityAnalysis.isValid ? 'checkCircle' : 'alert'} size={14} />
          <span>{validityAnalysis.isValid ? 'Geçerli' : 'Şüpheli / Geçersiz'}</span>
        </div>
      </header>

      <div className="mmpi-chart-card">
        <MMPIScoreChart scales={profile.scales} />
      </div>

      <div className="mmpi-tables-grid">
        <div className="mmpi-table-card">
          <h4 className="mmpi-table-title">Geçerlik Ölçekleri</h4>
          <table className="mmpi-mini-table">
            <thead>
              <tr>
                <th>Ölçek</th>
                <th>Ham</th>
                <th>T</th>
                <th>Seviye</th>
              </tr>
            </thead>
            <tbody>
              <tr className={cannotSayScale.rawScore > 30 ? 'is-high' : ''}>
                <td><strong>{cannotSayScale.fullName}</strong></td>
                <td>{cannotSayScale.rawScore}</td>
                <td>{cannotSayScale.tScore}</td>
                <td><span className="level-badge" style={{ background: cannotSayScale.color }}>{cannotSayScale.level}</span></td>
              </tr>
              {validity.map(s => (
                <tr key={s.id} className={s.tScore >= 70 ? 'is-high' : ''}>
                  <td><strong>{s.fullName}</strong></td>
                  <td>{s.rawScore}</td>
                  <td style={{ color: s.tScore >= 70 ? '#ef4444' : undefined, fontWeight: 700 }}>{s.tScore}</td>
                  <td><span className="level-badge" style={{ background: s.color }}>{s.level}</span></td>
                </tr>
              ))}
              <tr>
                <td><strong>F-K</strong></td>
                <td>{validityAnalysis.fMinusK}</td>
                <td>—</td>
                <td className="ws-muted">{validityAnalysis.fMinusK > 15 ? 'Abartma?' : validityAnalysis.fMinusK < -15 ? 'İyi görünme?' : 'Normal'}</td>
              </tr>
            </tbody>
          </table>
          <div className="mmpi-validity-box">
            <p>{validityAnalysis.interpretation}</p>
            {validityAnalysis.warnings.length > 0 && (
              <ul>
                {validityAnalysis.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mmpi-table-card">
          <h4 className="mmpi-table-title">Klinik Ölçekler (K düzeltmeli)</h4>
          <table className="mmpi-mini-table">
            <thead>
              <tr>
                <th>Ölçek</th>
                <th>Ham</th>
                <th>K+</th>
                <th>Düz. Ham</th>
                <th>T</th>
                <th>Seviye</th>
              </tr>
            </thead>
            <tbody>
              {clinical.map(s => (
                <tr key={s.id} className={s.tScore >= 70 ? 'is-high' : s.tScore >= 56 ? 'is-mid' : ''}>
                  <td><strong>{s.shortName}</strong> <span className="ws-muted">{s.name}</span></td>
                  <td>{s.rawScore}</td>
                  <td>{s.kAdded !== undefined ? `+${s.kAdded}` : '—'}</td>
                  <td>{s.kCorrectedRaw ?? s.rawScore}</td>
                  <td style={{ color: s.tScore >= 70 ? '#ef4444' : s.tScore >= 56 ? '#d97706' : undefined, fontWeight: 700 }}>{s.tScore}</td>
                  <td><span className="level-badge" style={{ background: s.color }}>{s.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mmpi-info-foot">
        <p>
          * Bu hesaplama Savaşır (1981) Türk standardizasyonu normları (Erkek/Kadın ayrı) ve klasik K düzeltme oranları (Hs .5, Pd .4, Pt 1, Sc 1, Ma .2) kullanılarak yapılmıştır.
          Kesme puanları tanı koymaz; yalnızca uzmana yol gösterir. Klinik karar nihai olarak uygulayıcı uzmana aittir.
        </p>
      </div>
    </div>
  );
}
