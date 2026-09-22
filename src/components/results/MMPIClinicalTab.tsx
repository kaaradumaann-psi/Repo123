import { useMemo, useState } from 'react';
import type { MMPIProfile } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import {
  clinicalBandFor,
  codeInterpretationForProfile,
  detectSingleElevations,
  tColor,
} from '../../scoring/mmpiInterpretation';
import { GRAHAM_DETAILS } from '../../scoring/mmpiGrahamDetails';
import { Icon } from '../Icon';

/** T-bar: 0–120, marks at 50 and 70 */
function TBar({ tScore, color }: { tScore: number; color: string }) {
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / 120) * 100))}%`;
  return (
    <div className="clin-tbar" aria-hidden="true">
      <div className="clin-tbar-track">
        <div className="clin-tbar-fill" style={{ width: pct(tScore), background: color }} />
        <span className="clin-tbar-mark" style={{ left: pct(50) }} data-label="50" />
        <span className="clin-tbar-mark is-limit" style={{ left: pct(70) }} data-label="70" />
      </div>
      <div className="clin-tbar-labels">
        <span>0</span>
        <span>50</span>
        <span>70</span>
        <span>120</span>
      </div>
    </div>
  );
}

type ScaleCardProps = {
  scaleId: ScaleId;
  fullName: string;
  shortName: string;
  tScore: number;
  rawScore: number;
  kAdded?: number;
  kCorrectedRaw?: number;
  bandLabel: string;
  bandRange: string;
  bandText: string;
  isHigh: boolean;
  isLow: boolean;
  isElevated: boolean;
  singleText?: string;
  singleRule?: string;
  activeConditions: { quote: string; source: string }[];
};

function ScaleCard({
  shortName,
  fullName,
  tScore,
  rawScore,
  kAdded,
  kCorrectedRaw,
  bandLabel,
  bandRange,
  bandText,
  isHigh,
  isLow,
  isElevated,
  singleText,
  singleRule,
  activeConditions,
}: ScaleCardProps) {
  const [open, setOpen] = useState(isElevated);
  const color = tColor(tScore);
  const graham = GRAHAM_DETAILS[shortName];
  const showHigh = tScore >= 70;
  const showLow = tScore <= 40;

  return (
    <article className={`clin-card ${isHigh ? 'is-high' : ''} ${isLow ? 'is-low' : ''} ${isElevated ? 'is-elevated' : ''}`}>
      <header className="clin-card-head">
        <div className="clin-card-title">
          <span className="clin-card-dot" style={{ background: color }} />
          <span className="clin-card-chip" style={{ background: color }}>
            {shortName}
          </span>
          <h4 className="clin-card-name">{fullName}</h4>
          <span className={`clin-level-badge ${isHigh ? 'is-high' : isLow ? 'is-low' : ''}`}>
            {bandLabel}
          </span>
        </div>
        <div className="clin-card-scores">
          <div className="clin-card-t">
            <span className="clin-card-t-label">T</span>
            <b style={{ color }}>{tScore.toFixed(1)}</b>
          </div>
          <TBar tScore={tScore} color={color} />
        </div>
      </header>

      <div className="clin-card-meta">
        <span className="clin-meta-item">
          <em>Ham</em> {rawScore}
        </span>
        {kAdded !== undefined && (
          <span className="clin-meta-item">
            <em>K+</em> +{kAdded}
          </span>
        )}
        {kCorrectedRaw !== undefined && (
          <span className="clin-meta-item">
            <em>Düz. ham</em> {kCorrectedRaw}
          </span>
        )}
        <span className="clin-meta-item">
          <em>Aralık</em> {bandRange}
        </span>
      </div>

      <div className="clin-card-body">
        <p className="clin-card-band">{bandText}</p>

        {singleText && (
          <div className="clin-card-single">
            <b>Sadece {shortName} yükselmesi ({singleRule}):</b> {singleText}
          </div>
        )}

        {activeConditions.length > 0 && (
          <div className="clin-card-conditions">
            <div className="clin-conditions-title">
              <Icon name="info" size={12} />
              <span>Koşullu ek yorum</span>
            </div>
            {activeConditions.map((c, idx) => (
              <p key={idx} className="clin-condition">
                {c.quote}
              </p>
            ))}
          </div>
        )}

        {(graham && (showHigh || showLow || isElevated)) && (
          <div className="clin-card-graham">
            <button
              type="button"
              className="clin-graham-toggle"
              onClick={() => setOpen(v => !v)}
              aria-expanded={open}
            >
              <span className={`clin-graham-chevron ${open ? 'is-open' : ''}`} aria-hidden="true">
                <Icon name="right" size={12} />
              </span>
              <span>
                {showHigh
                  ? `Yüksek puan özellikleri (Graham 1987) — ${graham.high.length} madde`
                  : showLow
                  ? `Düşük puan özellikleri (Graham 1987) — ${graham.low.length} madde`
                  : `Klinik özellikler (Graham 1987)`}
              </span>
            </button>
            {open && (
              <div className="clin-graham-body">
                {showHigh && (
                  <ul className="clin-graham-list">
                    {graham.high.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {showLow && !showHigh && (
                  <ul className="clin-graham-list">
                    {graham.low.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                )}
                {!showHigh && !showLow && (
                  <>
                    <p className="clin-graham-note">T puanı klinik eşik dışında; her iki yön için kısa özet:</p>
                    <div className="clin-graham-two">
                      <div>
                        <b>Yüksek puan:</b>
                        <ul>
                          {graham.high.slice(0, 6).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <b>Düşük puan:</b>
                        <ul>
                          {graham.low.slice(0, 5).map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Ölçek Bazlı Detaylı Klinik Rapor — site tasarım diliyle uyumlu
 * - Her ölçek kartı: T skoru, düzey, bar (0-120, 50 ve 70 işaretli)
 * - T>=70 veya T<=40 vurgulanır ve otomatik açılır
 * - Band metni kaynak-doğruludur (mmpiSource.ts)
 * - Graham 1987 listeleri koşullu olarak gösterilir
 * - Koşullu ek yorumlar (CODE_CONDITIONS) sadece koşul sağlanınca gösterilir
 * - Kaynak künyesi altta, s29 gibi iç kodlar metin içinde yok
 */
export function MMPIClinicalTab({ profile }: { profile: MMPIProfile }) {
  const singles = detectSingleElevations(profile);
  const singleFor = (id: ScaleId) => singles.find(h => h.scale === id);

  const codeResolved = useMemo(
    () => (profile.profileCode ? codeInterpretationForProfile(profile.profileCode, profile) : undefined),
    [profile],
  );

  const activeConditions = codeResolved?.activeConditions ?? [];

  // Koşullu yorumları ilgili ölçekle eşleştirmek için basit heuristik:
  // quote içinde ölçek numarası veya adı geçiyorsa ilgili ölçeğe at.
  const conditionsByScale = useMemo(() => {
    const map: Record<string, typeof activeConditions> = {};
    profile.clinical.forEach(s => {
      map[s.id] = [];
    });
    activeConditions.forEach(cond => {
      const q = cond.quote.toLowerCase();
      // Ölçek adları / rakam eşleştirmesi
      const matches: ScaleId[] = [];
      if (q.includes('alt test 1') || q.includes('test 1') || q.includes(' hs') || q.includes('(1)')) matches.push('Hs');
      if (q.includes('alt test 2') || q.includes('test 2') || q.includes(' d ') || q.includes('depresyon') || q.includes('(2)')) matches.push('D');
      if (q.includes('alt test 3') || q.includes('test 3') || q.includes(' hy') || q.includes('(3)')) matches.push('Hy');
      if (q.includes('alt test 4') || q.includes('test 4') || q.includes(' pd') || q.includes('(4)')) matches.push('Pd');
      if (q.includes('alt test 5') || q.includes('test 5') || q.includes(' mf') || q.includes('(5)')) matches.push('Mf');
      if (q.includes('alt test 6') || q.includes('test 6') || q.includes(' pa') || q.includes('(6)')) matches.push('Pa');
      if (q.includes('alt test 7') || q.includes('test 7') || q.includes(' pt') || q.includes('(7)')) matches.push('Pt');
      if (q.includes('alt test 8') || q.includes('test 8') || q.includes(' sc') || q.includes('(8)')) matches.push('Sc');
      if (q.includes('alt test 9') || q.includes('test 9') || q.includes(' ma') || q.includes('(9)')) matches.push('Ma');
      if (q.includes('alt test 0') || q.includes('test 0') || q.includes(' si') || q.includes('(0)')) matches.push('Si');
      // Eğer hiçbir ölçek eşleşmezse, kodun kendisine ait ölçeklere ata
      if (matches.length === 0 && profile.profileCode) {
        const digits = profile.profileCode.split('');
        const idByDigit: Record<string, ScaleId> = {
          '1': 'Hs',
          '2': 'D',
          '3': 'Hy',
          '4': 'Pd',
          '5': 'Mf',
          '6': 'Pa',
          '7': 'Pt',
          '8': 'Sc',
          '9': 'Ma',
          '0': 'Si',
        };
        digits.forEach(d => {
          const sid = idByDigit[d];
          if (sid) matches.push(sid);
        });
      }
      // Tekrarları temizle
      const uniq = Array.from(new Set(matches));
      uniq.forEach(sid => {
        if (!map[sid]) map[sid] = [];
        map[sid].push(cond);
      });
    });
    return map;
  }, [activeConditions, profile]);

  const elevatedCount = profile.clinical.filter(s => s.tScore >= 70 || s.tScore <= 40).length;

  return (
    <div role="tabpanel" className="mmpi-tab-panel clin-report">
      <section className="clin-report-intro">
        <div className="clin-intro-head">
          <span className="mmpi-card-dot" />
          <h3>Ölçek Bazlı Detaylı Klinik Rapor</h3>
          <span className="clin-source-badge">Graham 1987 · Türk Normları</span>
        </div>
        <p className="clin-intro-text">
          T-skoru <b>70 ve üzeri</b> veya <b>40 ve altı</b> olan ölçekler klinik olarak anlamlı kabul edilir ve
          otomatik olarak vurgulanır. Çubuk 0–120 aralığını gösterir; 50 ortalama, 70 klinik eşiktir.
          {elevatedCount > 0
            ? ` Bu profilde ${elevatedCount} ölçek anlamlı aralıkta.`
            : ' Bu profilde anlamlı aralıkta ölçek yok.'}
        </p>
      </section>

      <div className="clin-cards">
        {profile.clinical.map(scale => {
          const band = clinicalBandFor(scale.id as ScaleId, profile.gender, scale.tScore);
          const single = singleFor(scale.id as ScaleId);
          const isHigh = scale.tScore >= 70;
          const isLow = scale.tScore <= 40;
          const isElevated = isHigh || isLow;

          return (
            <ScaleCard
              key={scale.id}
              scaleId={scale.id as ScaleId}
              shortName={scale.shortName}
              fullName={scale.fullName}
              tScore={scale.tScore}
              rawScore={scale.rawScore}
              kAdded={scale.kAdded}
              kCorrectedRaw={scale.kCorrectedRaw}
              bandLabel={band?.label ?? scale.level}
              bandRange={band?.rangeLabel ?? `${scale.tScore.toFixed(0)} T`}
              bandText={band?.text ?? ''}
              isHigh={isHigh}
              isLow={isLow}
              isElevated={isElevated}
              singleText={single?.entry.text}
              singleRule={single?.entry.rule}
              activeConditions={conditionsByScale[scale.id] ?? []}
            />
          );
        })}
      </div>

      {activeConditions.length > 0 && (
        <section className="clin-extra-conditions">
          <h4>
            <Icon name="info" size={14} />
            Koşullu Ek Yorumlar (yalnızca koşul sağlandığında)
          </h4>
          <ul>
            {activeConditions.map((c, i) => (
              <li key={i}>
                {c.quote}
                <span className="clin-cond-source"> — {c.source}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="clin-report-footer">
        <p>
          <b>Kaynak:</b> Graham, J.R. (1987). MMPI: Guide to Interpretation; Dahlstrom ve ark. (1972);
          Savaşır (1981) Türk normları — Tablo 30; Ceyhun & Oral (2003) Türkçe uyarlama.
          Bant yorumları <code>mmpiSource.ts</code> içindeki doğrulanmış metinlerdir; kod koşulları{' '}
          <code>mmpiSourceCodes.ts</code> · <code>CODE_CONDITIONS</code> üzerinden değerlendirilir.
        </p>
        <p className="clin-footer-disclaimer">
          T skorları tanı koymaz; kesme puanları yalnızca uzmana yol gösterir. Klinik karar uygulayıcı uzmana
          aittir.
        </p>
      </footer>
    </div>
  );
}
