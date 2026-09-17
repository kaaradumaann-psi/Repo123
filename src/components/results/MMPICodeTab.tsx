import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, codePointName, tColor } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';

/**
 * Kod Analizleri sekmesi — profil kodu (Mf ve Si hariç en yüksek iki klinik
 * ölçek) ve klinik ölçeklerin T sıralaması (çubuk görünümü).
 */
export function MMPICodeTab({ profile }: { profile: MMPIProfile }) {
  const code = profile.profileCode;
  const codeName = codePointName(code);
  const clinicalSorted = [...profile.clinical].sort((a, b) => b.tScore - a.tScore);
  const codeDigits = (code ?? '').split('');
  const idByDigit: Record<string, string> = {
    '1': 'Hs', '2': 'D', '3': 'Hy', '4': 'Pd', '5': 'Mf', '6': 'Pa', '7': 'Pt', '8': 'Sc', '9': 'Ma', '0': 'Si',
  };
  const topScales = codeDigits
    .map(digit => clinicalSorted.find(s => idByDigit[digit] === s.id))
    .filter(s => s !== undefined);

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div className="mmpi-code-grid">
        <section className="mmpi-code-card">
          <h4 className="mmpi-card-title">
            <span className="mmpi-card-dot" />
            Profil Kodu
          </h4>
          <div className="mmpi-code-value">{code ?? '—'}</div>
          <div className="mmpi-code-name">
            {codeName ?? (code ? 'İki noktalı kod noktası' : 'Kod hesaplanamadı')}
          </div>
          {topScales.length > 0 && (
            <>
              {topScales.map((scale, index) => (
                <div className="mmpi-code-scale" key={scale.id}>
                  <b>
                    {index + 1}. {scale.fullName} — T {scale.tScore.toFixed(1)}
                  </b>
                  <span>
                    {scale.tScore >= 70 ? SCALE_MEANINGS[scale.id as ScaleId].high : SCALE_MEANINGS[scale.id as ScaleId].measures}
                  </span>
                </div>
              ))}
            </>
          )}
          <p className="mmpi-code-desc">
            <Icon name="info" size={13} />
            Kod, Mf ve Si hariç en yüksek iki klinik ölçekten oluşur; kod tek başına tanı değil,
            yorumlamada başlangıç noktasıdır.
          </p>
        </section>

        <section className="mmpi-code-bars">
          <h4 className="mmpi-card-title">
            <span className="mmpi-card-dot" />
            Klinik Ölçekler — T Sıralaması
          </h4>
          {clinicalSorted.map(scale => {
            const pct = Math.max(4, Math.min(100, ((scale.tScore - 30) / 60) * 100));
            const color = tColor(scale.tScore);
            return (
              <div className="code-bar-row" key={scale.id} title={scale.fullName}>
                <span className="code-bar-label">{scale.shortName}</span>
                <div className="code-bar-track">
                  <div className="code-bar-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="code-bar-val" style={{ color }}>
                  {scale.tScore.toFixed(1)}
                </span>
              </div>
            );
          })}
          <p className="mmpi-summary-note">
            Çubuklar T skorunu gösterir; kırmızı T ≥ 70, mor 56–69, yeşil normal aralıktır.
          </p>
        </section>
      </div>
    </div>
  );
}
