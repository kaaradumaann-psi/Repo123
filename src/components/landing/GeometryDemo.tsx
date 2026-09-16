import { Reveal } from './Reveal';

function MiniSheet({ skewed }: { skewed: boolean }) {
  return (
    <svg viewBox="0 0 200 260" className={`geo-sheet${skewed ? ' is-skewed' : ''}`} aria-hidden="true">
      <rect x="20" y="10" width="160" height="240" rx="6" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
      {!skewed && (
        <g stroke="#2563eb" strokeWidth="0.6" opacity="0.4">
          {[52, 84, 116, 148].map(x => (
            <line key={x} x1={x} y1="16" x2={x} y2="244" />
          ))}
          {[60, 100, 140, 180, 220].map(y => (
            <line key={y} x1="26" y2={y} x2="174" y1={y} />
          ))}
        </g>
      )}
      <g fill="#0f172a">
        <rect x="28" y="18" width="10" height="10" />
        <rect x="162" y="18" width="10" height="10" />
        <rect x="162" y="232" width="10" height="10" />
        <rect x="28" y="232" width="10" height="10" />
      </g>
      <rect x="140" y="34" width="26" height="26" fill="#0f172a" />
      <rect x="143" y="37" width="8" height="8" fill="#fff" />
      <rect x="155" y="37" width="8" height="8" fill="#fff" />
      <rect x="143" y="49" width="8" height="8" fill="#fff" />
      <rect x="34" y="36" width="80" height="7" rx="3.5" fill="#cbd5e1" />
      <rect x="34" y="48" width="58" height="5" rx="2.5" fill="#e2e8f0" />
      {Array.from({ length: 8 }, (_, row) =>
        [0, 1, 2].map(col => (
          <g key={`${row}-${col}`}>
            <circle
              cx={48 + col * 52}
              cy={84 + row * 20}
              r="5.5"
              fill={(row + col) % 3 === 0 ? '#0f172a' : '#fff'}
              stroke={(row + col) % 3 === 0 ? '#0f172a' : '#94a3b8'}
              strokeWidth="1.2"
            />
            <circle
              cx={70 + col * 52}
              cy={84 + row * 20}
              r="5.5"
              fill={(row * 2 + col) % 5 === 0 ? '#0f172a' : '#fff'}
              stroke={(row * 2 + col) % 5 === 0 ? '#0f172a' : '#94a3b8'}
              strokeWidth="1.2"
            />
          </g>
        )),
      )}
      {!skewed &&
        [
          { x: 33, y: 23 },
          { x: 167, y: 23 },
          { x: 167, y: 237 },
          { x: 33, y: 237 },
        ].map(p => <circle key={`${p.x}${p.y}`} cx={p.x} cy={p.y} r="2.4" fill="#2563eb" />)}
    </svg>
  );
}

/** Before/after perspective normalization. Both sheets are stylized
 * illustrations, not captures. */
export function GeometryDemo() {
  return (
    <div className="geo-stage">
      <Reveal className="geo-card geo-raw">
        <div className="geo-tag geo-tag-raw">HAM GÖRÜNTÜ</div>
        <div className="geo-desk">
          <MiniSheet skewed />
        </div>
        <p className="geo-note">
          <span className="hv-dot hv-dot-warn" aria-hidden="true" /> Eğik açı · perspektif · kayma
        </p>
      </Reveal>

      <div className="geo-pipe" aria-hidden="true">
        <span className="geo-pipe-label">perspective correction</span>
        <span className="geo-pipe-line" />
        <span className="geo-pipe-label">alignment</span>
        <span className="geo-pipe-line" />
        <span className="geo-pipe-label">coordinate mapping</span>
      </div>

      <Reveal className="geo-card geo-clean" delay={140}>
        <div className="geo-tag geo-tag-ok">HİZALANMIŞ · 8 px/mm</div>
        <div className="geo-desk geo-desk-clean">
          <MiniSheet skewed={false} />
        </div>
        <p className="geo-note">
          <span className="hv-dot hv-dot-ok" aria-hidden="true" /> Normalize kanonik düzlem · 1680 × 2376
        </p>
      </Reveal>
    </div>
  );
}
