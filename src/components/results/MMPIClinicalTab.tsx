import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, clinicalBandFor, detectSingleElevations, tColor } from '../../scoring/mmpiInterpretation';

/**
 * Klinik Ölçekler sekmesi — her ölçek için T puanı aralığının yorumu ve
 * ham → K+ → düzeltilmiş → T akışı. Tanı koydurmaz, uygulayıcı uzmana yol gösterir.
 */
export function MMPIClinicalTab({ profile }: { profile: MMPIProfile }) {
  const singles = detectSingleElevations(profile);
  const singleFor = (id: ScaleId) => singles.find(hit => hit.scale === id);

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div className="mmpi-clinical-list">
        {profile.clinical.map(scale => {
          const meaning = SCALE_MEANINGS[scale.id as ScaleId];
          const band = clinicalBandFor(scale.id as ScaleId, profile.gender, scale.tScore);
          const single = singleFor(scale.id as ScaleId);
          const tone = scale.tScore >= 70 ? 'is-high' : scale.tScore >= 56 ? 'is-mid' : '';
          return (
            <div key={scale.id} className={`clin-row ${tone}`}>
              <div className="clin-row-main">
                <div className="clin-row-head">
                  <span className="clin-chip" style={{ background: tColor(scale.tScore) }}>
                    {scale.shortName}
                  </span>
                  <strong>{scale.fullName}</strong>
                  {band && (
                    <span className="level-badge" style={{ background: scale.color }} title={band.rangeLabel}>
                      {band.rangeLabel} · {band.label}
                    </span>
                  )}
                </div>
                <p className="clin-desc">{meaning.measures}</p>
                {band && <p className="clin-signal">{band.text}</p>}
                {single && (
                  <p className="clin-signal is-low">
                    <b>Sadece {scale.shortName} yükselmesi ({single.entry.rule}): </b>
                    {single.entry.text}
                  </p>
                )}
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
        Düzey rozetleri ölçeğe özgü T puanı aralıklarını gösterir (ör. Hs için 21-49 / 50-59 / 60-74 / 75-84 / 84
        üzeri). K düzeltmesi yalnızca Hs, Pd, Pt, Sc ve Ma ölçeklerine uygulanır.
      </p>
    </div>
  );
}
