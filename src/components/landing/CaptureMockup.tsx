import { Reveal } from './Reveal';

function PhonePaper({ analyzed }: { analyzed: boolean }) {
  return (
    <div className={`phone-frame${analyzed ? ' is-analyzed' : ''}`} aria-hidden="true">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="phone-desk">
          <div className="phone-paper">
            <span className="pp-mark pp-tl" />
            <span className="pp-mark pp-tr" />
            <span className="pp-mark pp-br" />
            <span className="pp-mark pp-bl" />
            <span className="pp-qr" />
            <span className="pp-line pp-l1" />
            <span className="pp-line pp-l2" />
            <div className="pp-grid">
              {Array.from({ length: 24 }, (_, i) => (
                <span key={i} className={`pp-bubble${i % 5 === 0 ? ' is-filled' : ''}${analyzed && i % 7 === 0 ? ' is-ringed' : ''}`} />
              ))}
            </div>
            {analyzed && <span className="pp-scanline" />}
          </div>
        </div>
        <div className="phone-hud">
          <span className={`phone-hud-tag${analyzed ? ' is-ok' : ''}`}>{analyzed ? 'ANALYZED' : 'RAW IMAGE'}</span>
          {analyzed && (
            <span className="phone-hud-meta">sayfa 3/4 · set eşleşti</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Stylized hand-held capture pair. Built with CSS only so the single-file
 * offline build stays asset-free; no real respondent photo is embedded. */
export function CaptureMockup() {
  return (
    <div className="capture-stage">
      <Reveal className="capture-card">
        <PhonePaper analyzed={false} />
        <p className="capture-note">Telefon çekimi: doğal ışık, hafif açı</p>
      </Reveal>
      <div className="capture-arrow" aria-hidden="true">
        <svg width="40" height="16" viewBox="0 0 40 16" fill="none">
          <path d="M1 8h34M29 2.5 35.5 8 29 13.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <Reveal className="capture-card" delay={140}>
        <PhonePaper analyzed />
        <p className="capture-note">Aynı kare analiz düzleminde</p>
      </Reveal>
    </div>
  );
}
