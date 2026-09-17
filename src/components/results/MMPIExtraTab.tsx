import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, detectPatterns } from '../../scoring/mmpiInterpretation';
import { Icon } from '../Icon';

const GLOSSARY_ORDER: ScaleId[] = ['?', 'L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];

/**
 * Ek Ölçekler & Kritikler sekmesi — klinik eşiği aşan ölçekler, klasik profil
 * desen göstergeleri ve tüm ölçeklerin ölçtüğü şeyin sözlüğü.
 */
export function MMPIExtraTab({ profile }: { profile: MMPIProfile }) {
  const critical = profile.clinical.filter(s => s.tScore >= 70);
  const patterns = detectPatterns(profile);

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <div>
        <h4 className="mmpi-section-title">Kritik Ölçekler (T ≥ 70)</h4>
        {critical.length === 0 ? (
          <div className="mmpi-box ok">
            <Icon name="checkCircle" size={14} />
            <span> Klinik eşiği (T ≥ 70) aşan klinik ölçek yok — profil genel olarak normal aralıkta.</span>
          </div>
        ) : (
          <div className="mmpi-crit-list">
            {critical.map(scale => (
              <div className="mmpi-crit-item" key={scale.id}>
                <span className="mmpi-crit-dot" />
                <div>
                  <b>
                    {scale.fullName} — T {scale.tScore.toFixed(1)}
                  </b>
                  <p>{SCALE_MEANINGS[scale.id as ScaleId].high}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="mmpi-section-title">Desen Göstergeleri</h4>
        <div className="mmpi-pattern-list">
          {patterns.map(pattern => (
            <div className={`mmpi-pattern-row ${pattern.hit ? 'is-hit' : ''}`} key={pattern.id}>
              <div className="mmpi-pattern-main">
                <b>{pattern.name}</b>
                <span>{pattern.rule}</span>
                {pattern.hit && <p>{pattern.detail}</p>}
              </div>
              <span className={`pattern-pill ${pattern.hit ? 'hit' : 'miss'}`}>
                {pattern.hit ? 'Görüldü' : 'Görülmedi'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mmpi-section-title">Ölçek Sözlüğü</h4>
        <div className="mmpi-glossary">
          {GLOSSARY_ORDER.map(id => {
            const scale = profile.scales.find(s => s.id === id);
            const meaning = SCALE_MEANINGS[id];
            if (!scale) return null;
            return (
              <div className="mmpi-glossary-item" key={id}>
                <b>
                  <i>{scale.shortName}</i> {scale.name}
                </b>
                <p>{meaning.measures}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
