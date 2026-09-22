import type { MMPIProfile, ScaleResult } from '../../scoring/mmpiScoring';
import type { ScaleId } from '../../scoring/mmpiKeys';
import {
  SCALE_MEANINGS,
  clinicalBandFor,
  detectSingleElevations,
  tColor,
  type SingleElevationHit,
} from '../../scoring/mmpiInterpretation';
import {
  SCALE_DOSSIERS,
  dossierSourceLine,
  grahamListsFor,
  tabloDetail,
  type ClinicalScaleId,
  type GrahamItem,
  type GrahamList,
} from '../../scoring/mmpiScaleDossiers';
import { Icon } from '../Icon';

function GrahamItemView({ item }: { item: GrahamItem }) {
  if (typeof item === 'string') return <li>{item}</li>;
  return (
    <li>
      {item.text}
      {item.sub.length > 0 && (
        <ul className="graham-sub">
          {item.sub.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      )}
    </li>
  );
}

function GrahamListBlock({ list }: { list: GrahamList }) {
  return (
    <div className="graham-block">
      {list.label && <p className="graham-label">{list.label}</p>}
      <ol className="graham-list">
        {list.items.map((item, i) => (
          <GrahamItemView key={i} item={item} />
        ))}
      </ol>
    </div>
  );
}

/**
 * Ölçek Bazlı Detaylı Klinik Rapor (Graham 1987) kartı.
 * Yalnızca klinik olarak anlamlı ölçekler için üretilir: T ≥ 70 (Klinik
 * Yükseklik) ya da T ≤ 40 (Klinik Düşüklük). Bölümler: Klinik Açıklama ve
 * Analiz → Graham (1987) listeleri → Demografik ve Klinik Notlar → Koşullu
 * ek yorum → Ek Klinik Bilgiler → kaynak (yalnız kart altlığında).
 */
function ScaleDossierCard({
  profile,
  scale,
  singleHits,
}: {
  profile: MMPIProfile;
  scale: ScaleResult;
  singleHits: SingleElevationHit[];
}) {
  const id = scale.id as ClinicalScaleId;
  const dossier = SCALE_DOSSIERS[id];
  const high = scale.tScore >= 70;
  const tMap = Object.fromEntries(profile.clinical.map(s => [s.id, s.tScore])) as Record<ScaleId, number>;
  const band = clinicalBandFor(id, profile.gender, scale.tScore);
  const { range, lists } = grahamListsFor(id, scale.tScore, high ? 'high' : 'low');
  const tab = tabloDetail(id, profile.gender);

  const conditions = [
    ...(dossier.conditions ?? [])
      .map(c => ({ when: c.when, sentence: c.sentence, active: c.match(tMap) }))
      .sort((a, b) => Number(b.active) - Number(a.active)),
    ...singleHits.filter(h => h.scale === id).map(h => ({ when: h.entry.rule, sentence: h.entry.text, active: true })),
  ];

  return (
    <article className={`scale-dossier ${high ? 'is-high' : 'is-low'}`}>
      <header className="scale-dossier-head">
        <div className="scale-dossier-id">
          <span className="scale-avatar" style={{ background: tColor(scale.tScore) }}>
            {scale.shortName}
          </span>
          <div className="scale-dossier-titles">
            <h3>{scale.fullName}</h3>
            <p>Kategori: Klinik Ölçek</p>
          </div>
        </div>
        <div className="scale-dossier-scores">
          <span className={`klinik-pill ${high ? 'is-high' : 'is-low'}`}>
            {high ? 'KLİNİK YÜKSEKLİK' : 'KLİNİK DÜŞÜKLÜK'}
          </span>
          <span className="score-t" style={{ color: tColor(scale.tScore) }}>
            T {Math.round(scale.tScore)}
          </span>
          <span className="score-raw">Ham: {scale.rawScore}</span>
        </div>
      </header>

      <section className="dossier-sec">
        <h4 className="dossier-sec-title">KLİNİK AÇIKLAMA VE ANALİZ</h4>
        <blockquote className="dossier-quote">
          {band ? band.text : high ? SCALE_MEANINGS[id].high : SCALE_MEANINGS[id].low}
        </blockquote>
      </section>

      <section className="dossier-sec">
        <h4 className="dossier-sec-title">
          {scale.shortName} ({dossier.number}) ALT TESTİNDE {high ? 'YÜKSEK' : 'DÜŞÜK'} PUAN ALAN BİREYİN: (GRAHAM 1987)
        </h4>
        {range && <p className="graham-range">Kaynakta bu düzey için verilen liste: {range}</p>}
        {lists.map((list, i) => (
          <GrahamListBlock key={i} list={list} />
        ))}
      </section>

      {dossier.notes && dossier.notes.length > 0 && (
        <section className="dossier-sec">
          <h4 className="dossier-sec-title">Demografik ve Klinik Notlar</h4>
          {dossier.notes.map((note, i) => (
            <div key={i} className="dossier-note">
              {note.title && <p className="graham-label">{note.title}</p>}
              {note.paragraphs?.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {note.list && (
                <ul className="dossier-note-list">
                  {note.list.map((item, j) => (
                    <li key={j}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {conditions.length > 0 && (
        <section className="dossier-sec">
          <h4 className="dossier-sec-title">Koşullu ek yorum</h4>
          <ul className="dossier-cond-list">
            {conditions.map((c, i) => (
              <li key={i} className={c.active ? 'is-active' : undefined}>
                <span className="cond-when">{c.when}:</span> {c.sentence}
                {c.active && (
                  <span className="cond-active-chip" title="Bu profil için koşul sağlanıyor">
                    <Icon name="checkCircle" size={12} /> bu profilde geçerli
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="dossier-sec">
        <h4 className="dossier-sec-title">EK KLİNİK BİLGİLER</h4>
        <p>{dossier.overview}</p>
        <p>
          <b>Tablo {tab.no}:</b> {tab.title} (Madde Sayısı: {tab.count})
        </p>
        <p>
          <b>Doğru Maddeler ({tab.dogru.length} adet):</b> {tab.dogru.join(', ')}
        </p>
        <p>
          <b>Yanlış Maddeler ({tab.yanlis.length} adet):</b> {tab.yanlis.join(', ')}
        </p>
        {tab.kEkleli && <p>K Eklemeli bir alt testtir.</p>}
        {tab.extraNote && <p className="dossier-extra-note">{tab.extraNote}</p>}
        <p>
          Erkeklerde ortalama: {tab.normMale.toFixed(2)}, kadınlarda: {tab.normFemale.toFixed(2)} (Savaşır, 1981)
        </p>
      </section>

      <footer className="dossier-source">{dossierSourceLine(id)}</footer>
    </article>
  );
}

/**
 * Klinik Ölçekler sekmesi — "Ölçek Bazlı Detaylı Klinik Rapor (Graham 1987)".
 * T-skoru 70 ve üzeri ya da 40 ve altı olan ölçekler klinik olarak anlamlı
 * kabul edilir ve otomatik olarak vurgulanır; diğer ölçekler kart almaz.
 */
export function MMPIClinicalTab({ profile }: { profile: MMPIProfile }) {
  const flagged = profile.clinical.filter(s => s.tScore >= 70 || s.tScore <= 40);
  const singleHits = detectSingleElevations(profile);

  return (
    <div role="tabpanel" className="mmpi-tab-panel mmpi-clinical-report">
      <p className="clinical-report-note">
        T-skoru 70 ve üzeri veya 40 ve altı olan ölçekler klinik olarak anlamlı kabul edilir ve otomatik olarak
        vurgulanır.
      </p>
      {flagged.length === 0 ? (
        <div className="mmpi-box info">
          <Icon name="info" size={14} />
          <span>Bu profilde T-skoru 70 ve üzeri ya da 40 ve altı klinik ölçek bulunmuyor.</span>
        </div>
      ) : (
        flagged.map(scale => (
          <ScaleDossierCard key={scale.id} profile={profile} scale={scale} singleHits={singleHits} />
        ))
      )}
    </div>
  );
}
