import type { MMPIProfile, ScaleResult } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, tColor } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';

function ValidityCard({ scale, blankCount }: { scale: ScaleResult; blankCount?: number }) {
  const id = scale.id as ScaleId;
  const meaning = SCALE_MEANINGS[id];
  const isHigh = id !== '?' && scale.tScore >= 70;
  const isLow = id !== '?' && scale.tScore <= 35;
  const tone = isHigh ? 'is-high' : isLow ? 'is-low' : '';

  return (
    <div className={`mmpi-vcard ${tone}`}>
      <div className="mmpi-vcard-head">
        <span className={`mmpi-vcard-letter ${id === '?' ? 'q' : ''}`}>{scale.shortName}</span>
        <span className="mmpi-vcard-name">{scale.fullName}</span>
      </div>
      <p className="mmpi-vcard-desc">{meaning.measures}</p>
      <div className="mmpi-vcard-stats">
        {id === '?' ? (
          <>
            <div className="mmpi-vstat">
              <span>Boş Madde</span>
              <b style={{ color: (blankCount ?? 0) > 30 ? '#d2453a' : (blankCount ?? 0) > 10 ? '#b4770b' : undefined }}>
                {blankCount ?? scale.rawScore}
              </b>
            </div>
            <span className="level-badge" style={{ background: scale.color, marginLeft: 'auto' }}>
              {scale.level}
            </span>
          </>
        ) : (
          <>
            <div className="mmpi-vstat">
              <span>Ham</span>
              <b>{scale.rawScore}</b>
            </div>
            <div className="mmpi-vstat">
              <span>T</span>
              <b style={{ color: tColor(scale.tScore) }}>{scale.tScore.toFixed(1)}</b>
            </div>
            <span className="level-badge" style={{ background: scale.color, marginLeft: 'auto' }}>
              {scale.level}
            </span>
          </>
        )}
      </div>
      {(isHigh || isLow) && (
        <p className="mmpi-vcard-signal">{isHigh ? meaning.high : meaning.low}</p>
      )}
    </div>
  );
}

export function MMPIValidityTab({ profile }: { profile: MMPIProfile }) {
  const { validity, cannotSayScale, validityAnalysis } = profile;
  const fK = validityAnalysis.fMinusK;
  const fKLabel = fK > 15 ? 'Yüksek F-K: abartma / simülasyon yönünde' : fK < -15 ? 'Düşük F-K: iyi görünme çabası yönünde' : 'Normal aralıkta';
  const fKColor = fK > 15 || fK < -15 ? '#d2453a' : '#0e9e6a';

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div className="mmpi-vgrid">
        <ValidityCard scale={cannotSayScale} blankCount={validityAnalysis.cannotSay} />
        {validity.map(scale => (
          <ValidityCard key={scale.id} scale={scale} />
        ))}
      </div>

      <div className="mmpi-fk-row">
        <div className="mmpi-fk-left">
          <b>F–K İndeksi</b>
          <span>
            F ham ({validityAnalysis.fRaw}) − K ham ({validityAnalysis.kRaw})
          </span>
        </div>
        <b className="mmpi-fk-value" style={{ color: fKColor }}>
          {fK > 0 ? `+${fK}` : fK}
        </b>
        <span className="mmpi-fk-label" style={{ color: fKColor }}>
          {fKLabel}
        </span>
      </div>

      <div>
        <h4 className="mmpi-section-title">Uyarılar</h4>
        {validityAnalysis.warnings.length === 0 ? (
          <div className="mmpi-box ok">
            <Icon name="checkCircle" size={14} />
            <span> Geçerlik ölçeklerinden uyarı yok — cevap tutarlılığı ve savunma düzeyi normal sınırlarda.</span>
          </div>
        ) : (
          <div className="mmpi-box warn">
            <ul>
              {validityAnalysis.warnings.map((warning, index) => (
                <li key={index}>
                  <Icon name="alert" size={12} />
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <h4 className="mmpi-section-title">Genel Yorum</h4>
        <div className={`mmpi-box ${validityAnalysis.isValid ? 'ok' : 'warn'}`}>
          {validityAnalysis.interpretation}
        </div>
      </div>
    </div>
  );
}
