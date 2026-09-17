import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, tColor } from '../../scoring/mmpiInterpretation';

/**
 * Klinik Ölçekler sekmesi — her ölçek için okunabilir satır:
 * ne ölçtüğü, yüksekse ne düşündürdüğü ve ham → K+ → düzeltilmiş → T akışı.
 */
export function MMPIClinicalTab({ profile }: { profile: MMPIProfile }) {
  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div className="mmpi-clinical-list">
        {profile.clinical.map(scale => {
          const meaning = SCALE_MEANINGS[scale.id as ScaleId];
          const tone = scale.tScore >= 70 ? 'is-high' : scale.tScore >= 56 ? 'is-mid' : '';
          return (
            <div key={scale.id} className={`clin-row ${tone}`}>
              <div className="clin-row-main">
                <div className="clin-row-head">
                  <span className="clin-chip" style={{ background: tColor(scale.tScore) }}>
                    {scale.shortName}
                  </span>
                  <strong>{scale.fullName}</strong>
                  <span className="level-badge" style={{ background: scale.color }}>
                    {scale.level}
                  </span>
                </div>
                <p className="clin-desc">{meaning.measures}</p>
                {scale.tScore >= 56 && <p className="clin-signal">Yüksekte: {meaning.high}</p>}
                {scale.tScore <= 35 && <p className="clin-signal is-low">Düşükte: {meaning.low}</p>}
              </div>
              <div className="clin-row-stats">
                <div className="clin-stat">
                  <span>Ham</span>
                  <b>{scale.rawScore}</b>
                </div>
                {scale.kAdded !== undefined && (
                  <div className="clin-stat">
                    <span>K+</span>
                    <b className="k">+{scale.kAdded}</b>
                  </div>
                )}
                {scale.kCorrectedRaw !== undefined && (
                  <div className="clin-stat">
                    <span>Düzeltilmiş</span>
                    <b>{scale.kCorrectedRaw}</b>
                  </div>
                )}
                <div className="clin-t" style={{ color: tColor(scale.tScore) }} title="T skoru">
                  {scale.tScore.toFixed(1)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mmpi-summary-note">
        T ≥ 70 klinik eşik, 56–69 orta yüksek aralık. K düzeltmesi yalnızca Hs, Pd, Pt, Sc ve Ma ölçeklerine uygulanır.
      </p>
    </div>
  );
}
