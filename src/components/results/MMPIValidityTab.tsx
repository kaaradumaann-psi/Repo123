import type { MMPIProfile, ValidityFinding } from '../../scoring/mmpiScoring';
import { SCALE_MEANINGS } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';

const toneClass = (tone: ValidityFinding['tone']): string =>
  tone === 'alert' ? 'is-high' : tone === 'watch' ? 'is-low' : '';

const badgeColor = (tone: ValidityFinding['tone']): string =>
  tone === 'alert' ? '#d2453a' : tone === 'watch' ? '#b4770b' : '#0e9e6a';

function FindingCard({ finding }: { finding: ValidityFinding }) {
  const meaning = SCALE_MEANINGS[finding.id];
  return (
    <div className={`mmpi-vcard ${toneClass(finding.tone)}`}>
      <div className="mmpi-vcard-head">
        <span className={`mmpi-vcard-letter ${finding.id === '?' ? 'q' : ''}`}>{finding.id}</span>
        <span className="mmpi-vcard-name">{finding.fullName}</span>
      </div>
      <p className="mmpi-vcard-desc">{meaning.measures}</p>
      <div className="mmpi-vcard-stats">
        <div className="mmpi-vstat">
          <span>Ham</span>
          <b>{finding.raw}</b>
        </div>
        {finding.t !== null && (
          <div className="mmpi-vstat">
            <span>T</span>
            <b>{finding.t.toFixed(1)}</b>
          </div>
        )}
        <div className="mmpi-vstat">
          <span>Aralık</span>
          <b>{finding.rawRange}</b>
        </div>
        <span className="level-badge" style={{ background: badgeColor(finding.tone), marginLeft: 'auto' }}>
          {finding.band}
        </span>
      </div>
      <p className="mmpi-vcard-signal">{finding.comment}</p>
      {finding.tDetail && (
        <p className="mmpi-vcard-signal">
          <b>{finding.tRange}: </b>
          {finding.tDetail}
        </p>
      )}
    </div>
  );
}

export function MMPIValidityTab({ profile }: { profile: MMPIProfile }) {
  const { validityAnalysis } = profile;
  const fK = validityAnalysis.fMinusK;
  const fKAlert = validityAnalysis.fMinusKNote !== null;
  const fKLabel = fKAlert
    ? 'F-K endeksi 16’nın üstünde: dikkatli değerlendirme gerekir'
    : 'F-K endeksi kaynakta belirtilen 16 sınırının altında';
  const fKColor = fKAlert ? '#d2453a' : '#0e9e6a';

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div className="mmpi-vgrid">
        {validityAnalysis.findings.map(finding => (
          <FindingCard key={finding.id} finding={finding} />
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
      {validityAnalysis.fMinusKNote && (
        <div className="mmpi-box warn">
          <Icon name="alert" size={14} />
          <span> {validityAnalysis.fMinusKNote}</span>
        </div>
      )}

      <div>
        <h4 className="mmpi-section-title">Uyarılar</h4>
        {validityAnalysis.warnings.length === 0 ? (
          <div className="mmpi-box ok">
            <Icon name="checkCircle" size={14} />
            <span>
              {' '}Geçerlik skalaları kaynak ölçütlerine göre normal sınırlarda — yanıtlama isteği, inkar/savunma
              düzeyi ve uygun olmayan yaşantı miktarı beklenen aralıkta.
            </span>
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
        <p className="mmpi-summary-note">
          Geçerlik değerlendirmesi kaynak rapordaki ham puan tablolarına [(?) “Hiç Bir Şey Diyemem”, L, K, F]
          ve L/F/K için T puanı aralıklarına birebir dayanır; F-K endeksinde kaynak sınırı 16’dır.
        </p>
      </div>
    </div>
  );
}
