import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { DerivedScaleResult } from '../../scoring/mmpiDerived';
import { Icon } from '../Icon';

const toneColor = (tone: DerivedScaleResult['tone']): string =>
  tone === 'alert' ? '#d2453a' : tone === 'watch' ? '#b4770b' : '#0e9e6a';

function DerivedCard({ scale }: { scale: DerivedScaleResult }) {
  const color = toneColor(scale.tone);
  return (
    <div className={`mmpi-vcard ${scale.tone === 'alert' ? 'is-high' : scale.tone === 'watch' ? 'is-low' : ''}`}>
      <div className="mmpi-vcard-head">
        <span className="mmpi-vcard-name">{scale.scaleName}</span>
      </div>
      <p className="mmpi-vcard-desc">{scale.description}</p>
      <div className="mmpi-vcard-stats">
        <div className="mmpi-vstat">
          <span>Puan</span>
          <b>
            {scale.rawScore}
            {scale.tScore !== null ? ` · T ${scale.tScore.toFixed(0)}` : ''}
          </b>
        </div>
        <span className="level-badge" style={{ background: color, marginLeft: 'auto' }}>
          {scale.levelLabel}
        </span>
      </div>
      <p className="mmpi-vcard-signal">{scale.interpretation}</p>
    </div>
  );
}

/**
 * Türetilmiş Ölçekler & Endeksler — madde düzeyinde cevap verisinden
 * hesaplanır: ayrım endeksleri (Goldberg, Taulbee, Peterson), DSM yönelimli
 * kişilik eğilimleri, alkol/madde göstergeleri, özel ölçekler (O-H, Es,
 * Welsh A/R, Do, Dy) ve Wiggins içerik ölçekleri.
 */
export function MMPIDerivedSection({ profile }: { profile: MMPIProfile }) {
  const itemLevel = profile.itemLevel;
  if (!itemLevel) {
    return (
      <div className="mmpi-tab-panel">
        <div className="mmpi-box info">
          <Icon name="info" size={14} />
          <span>
            {' '}Türetilmiş ölçekler ve endeksler madde düzeyinde (566) cevap verisi gerektirir. Bu kayıt ham puan
            yöntemiyle girildiği için hesaplanamıyorlar; T skoru temelli yorumlar diğer bölümlerde yer alır.
          </span>
        </div>
      </div>
    );
  }

  const indexes = itemLevel.derivedIndexes;
  const personality = itemLevel.derivedScales.filter(s => s.category === 'personality');
  const addiction = itemLevel.derivedScales.filter(s => s.category === 'addiction');
  const special = itemLevel.derivedScales.filter(s => s.category === 'special');
  const wiggins = itemLevel.derivedScales.filter(s => s.category === 'wiggins');

  return (
    <div className="mmpi-tab-panel">
      <div>
        <h4 className="mmpi-section-title">Ayrım Endeksleri</h4>
        <div className="mmpi-index-grid">
          {indexes.map(index => {
            const color = toneColor(index.tone);
            return (
              <div key={index.scaleId} className={`index-card ${index.tone === 'alert' ? 'is-high' : ''}`}>
                <div className="index-card-value" style={{ color }}>
                  {index.value}
                </div>
                <b>{index.scaleName}</b>
                <span className="index-card-level" style={{ color }}>
                  {index.levelLabel}
                </span>
                <p>{index.interpretation}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="mmpi-section-title">Kişilik Bozukluğu Eğilimleri (Ham Puan)</h4>
        <div className="mmpi-vgrid">
          {personality.map(scale => (
            <DerivedCard key={scale.scaleId} scale={scale} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mmpi-section-title">Madde Bağımlılığı ve Özel Ölçekler</h4>
        <div className="mmpi-vgrid">
          {addiction.map(scale => (
            <DerivedCard key={scale.scaleId} scale={scale} />
          ))}
          {special.map(scale => (
            <DerivedCard key={scale.scaleId} scale={scale} />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mmpi-section-title">Wiggins İçerik Ölçekleri</h4>
        <div className="mmpi-summary-table-wrap">
          <table className="mmpi-summary-table wiggins-table">
            <thead>
              <tr>
                <th className="row-head">Ölçek</th>
                <th>Ham</th>
                <th>T</th>
                <th>Düzey</th>
                <th className="col-note">Not</th>
              </tr>
            </thead>
            <tbody>
              {wiggins.map(scale => (
                <tr key={scale.scaleId}>
                  <th className="row-head" title={scale.description}>
                    {scale.scaleName}
                  </th>
                  <td className="num">{scale.rawScore}</td>
                  <td className="num" style={{ color: toneColor(scale.tone), fontWeight: 700 }}>
                    {scale.tScore !== null ? scale.tScore.toFixed(1) : '—'}
                  </td>
                  <td>
                    <span className="level-badge" style={{ background: toneColor(scale.tone) }}>
                      {scale.levelLabel}
                    </span>
                  </td>
                  <td className="col-note ws-muted">{scale.tone !== 'ok' ? scale.interpretation : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mmpi-summary-note">
          İçerik ölçekleri T puanları Türk örneklemi ortalama/standart sapma değerleriyle hesaplanır; T ≥ 70 belirgin
          içerik yükselmesi kabul edilir.
        </p>
      </div>
    </div>
  );
}
