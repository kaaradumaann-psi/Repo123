import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import { SCALE_MEANINGS, clinicalBandFor, detectSingleElevations, tColor } from '../../scoring/mmpiInterpretation';
import { DisclosureControls, DisclosureRow, useDisclosureGroup } from './Disclosure';
import { Icon } from '../Icon';

/** T puanının 0–120 ölçeğinde konumu; 50 ortalama, 70 klinik sınır. */
function TBar({ tScore, color }: { tScore: number; color: string }) {
  const pct = (value: number) => `${Math.min(100, Math.max(0, (value / 120) * 100))}%`;
  return (
    <span className="mmpi-tbar" aria-hidden="true">
      <span className="mmpi-tbar-fill" style={{ width: pct(tScore), background: color }} />
      <span className="mmpi-tbar-mark" style={{ left: pct(50) }} />
      <span className="mmpi-tbar-mark is-limit" style={{ left: pct(70) }} />
    </span>
  );
}

/**
 * Klinik Ölçekler — her ölçek tek satırda özetlenir (T puanı, düzey ve profil
 * çubuğu); ayrıntılı yorum yalnızca istendiğinde açılır. Klinik eşiği (T ≥ 70)
 * aşan ölçekler açık gelir, böylece dikkat gerektiren tablo ilk bakışta görünür.
 */
export function MMPIClinicalTab({ profile }: { profile: MMPIProfile }) {
  const singles = detectSingleElevations(profile);
  const singleFor = (id: ScaleId) => singles.find(hit => hit.scale === id);

  const elevated = profile.clinical.filter(scale => scale.tScore >= 70);
  const ids = profile.clinical.map(scale => scale.id);
  const group = useDisclosureGroup(elevated.map(scale => scale.id));

  return (
    <div role="tabpanel" className="mmpi-tab-panel">
      <section className="mmpi-list-card">
        <header className="mmpi-list-head">
          <div className="mmpi-list-title">
            <span className="mmpi-card-dot" />
            <b>Klinik Ölçekler</b>
            <span className="mmpi-list-note">
              {elevated.length > 0
                ? `${elevated.length} ölçek klinik eşiğin üzerinde (T ≥ 70) — açık gelir.`
                : 'Klinik eşiği aşan ölçek yok; tüm satırlar kapalı.'}
            </span>
          </div>
          <DisclosureControls ids={ids} group={group} total={profile.clinical.length} />
        </header>

        <div className="mmpi-disc-list">
          {profile.clinical.map(scale => {
            const meaning = SCALE_MEANINGS[scale.id as ScaleId];
            const band = clinicalBandFor(scale.id as ScaleId, profile.gender, scale.tScore);
            const single = singleFor(scale.id as ScaleId);
            const tone = scale.tScore >= 70 ? 'alert' : scale.tScore >= 60 ? 'watch' : 'ok';
            return (
              <DisclosureRow
                key={scale.id}
                id={scale.id}
                tone={tone}
                open={group.isOpen(scale.id)}
                onToggle={group.toggle}
                title={
                  <>
                    <span className="clin-chip" style={{ background: tColor(scale.tScore) }}>
                      {scale.shortName}
                    </span>
                    <strong>{scale.fullName}</strong>
                  </>
                }
                summary={band ? `${band.rangeLabel} · ${band.label}` : scale.level}
                value={
                  <>
                    <TBar tScore={scale.tScore} color={tColor(scale.tScore)} />
                    <span className="mmpi-disc-t" style={{ color: tColor(scale.tScore) }}>
                      {scale.tScore.toFixed(1)}
                    </span>
                  </>
                }
              >
                <p className="clin-desc">{meaning.measures}</p>
                {band && <p className="clin-signal">{band.text}</p>}
                {single && (
                  <p className="clin-signal is-low">
                    <b>
                      Sadece {scale.shortName} yükselmesi ({single.entry.rule}):{' '}
                    </b>
                    {single.entry.text}
                  </p>
                )}
                <div className="mmpi-disc-stats">
                  <div className="clin-stat">
                    <span>Ham</span>
                    <b>{scale.rawScore}</b>
                  </div>
                  {scale.kAdded !== undefined && (
                    <div className="clin-stat">
                      <span>K eklemesi</span>
                      <b className="k">+{scale.kAdded}</b>
                    </div>
                  )}
                  {scale.kCorrectedRaw !== undefined && (
                    <div className="clin-stat">
                      <span>Düzeltilmiş ham</span>
                      <b>{scale.kCorrectedRaw}</b>
                    </div>
                  )}
                  <div className="clin-stat">
                    <span>T puanı</span>
                    <b style={{ color: tColor(scale.tScore) }}>{scale.tScore.toFixed(1)}</b>
                  </div>
                </div>
              </DisclosureRow>
            );
          })}
        </div>
      </section>

      <p className="mmpi-summary-note">
        <Icon name="info" size={13} /> T puanı 50 ortalamadır; 70 ve üzeri klinik eşik kabul edilir. K düzeltmesi
        yalnızca Hs, Pd, Pt, Sc ve Ma ölçeklerine uygulanır. Satır başlığındaki çubuk, puanın 0–120 aralığındaki
        yerini gösterir.
      </p>
    </div>
  );
}
