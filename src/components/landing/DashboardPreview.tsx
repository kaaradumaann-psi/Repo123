import { Reveal } from './Reveal';

const ROWS = [
  { label: 'Güvenilir işaret', value: '521', tone: 'ok' },
  { label: 'Boş', value: '38', tone: 'muted' },
  { label: 'Çoklu işaret', value: '2', tone: 'bad' },
  { label: 'Belirsiz / inceleyin', value: '5', tone: 'warn' },
] as const;

/** Non-interactive preview of the authenticated analysis workspace. Figures
 * are illustrative placeholders, never mixed with real results. */
export function DashboardPreview({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <Reveal className="dash-shell">
      <div className="dash-window" role="img" aria-label="Analiz ekranının örnek görünümü: form önizlemesi ve özet sayımları">
        <div className="dash-titlebar" aria-hidden="true">
          <span className="dash-traffic"><i /><i /><i /></span>
          <span className="dash-url">Analiz · örnek görünüm</span>
          <span className="dash-ready"><span className="hv-dot hv-dot-ok" /> Hazır</span>
        </div>
        <div className="dash-body" aria-hidden="true">
          <div className="dash-form">
            <div className="dash-form-head">
              <span>FORM ÖNİZLEME</span>
              <span className="dash-page-chip">sayfa 1/4</span>
            </div>
            <div className="dash-sheet">
              <span className="pp-qr dash-qr" />
              <div className="pp-grid dash-grid">
                {Array.from({ length: 30 }, (_, i) => (
                  <span key={i} className={`pp-bubble${i % 4 === 0 ? ' is-filled' : ''}${i % 9 === 0 ? ' is-ringed' : ''}`} />
                ))}
              </div>
            </div>
          </div>
          <div className="dash-side">
            <div className="dash-summary-head">
              <span>ÖZET</span>
              <span className="dash-demo">örnek veri</span>
            </div>
            <p className="dash-total"><strong>566</strong> madde</p>
            <ul className="dash-rows">
              {ROWS.map(row => (
                <li key={row.label}>
                  <span className={`hv-dot hv-dot-${row.tone}`} />
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                </li>
              ))}
            </ul>
            <div className="dash-pages">
              {['1', '2', '3', '4'].map(p => (
                <span key={p} className={`dash-page${p === '4' ? ' is-pending' : ''}`}>{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="dash-cta">
        <p>Gerçek analiz çalışma alanı giriş sonrası açılır. Özet sayımları burada gördüğünüz etiketlerle birebir aynıdır.</p>
        <button type="button" className="btn-primary btn-lg" onClick={onAnalyze}>
          Analize Başla
        </button>
      </div>
    </Reveal>
  );
}
