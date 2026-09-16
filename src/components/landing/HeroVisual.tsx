type Bubble = {
  key: string;
  cx: number;
  cy: number;
  filled: boolean;
  ring: boolean;
  ringDelay: number;
};

const ROWS = 9;
const COLS = 3;
const GRID_TOP = 118;
const ROW_H = 36;
const COL_X = [96, 182, 268];
const DY_GAP = 30;
const BUBBLE_R = 6.5;

function buildBubbles(): Bubble[] {
  const bubbles: Bubble[] = [];
  let ringCount = 0;
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const cy = GRID_TOP + row * ROW_H;
      const itemNo = row * COLS + col + 1;
      const dFilled = (row + col * 2) % 3 === 0;
      const yFilled = !dFilled && (row * 2 + col) % 4 === 0;
      const ringD = ringCount < 5 && (row * 3 + col) % 5 === 0 && dFilled;
      const ringY = !ringD && ringCount < 5 && (row + col * 2) % 7 === 3 && yFilled;
      if (ringD || ringY) ringCount++;
      bubbles.push(
        { key: `d-${itemNo}`, cx: COL_X[col]!, cy, filled: dFilled, ring: ringD, ringDelay: ringCount * 0.9 },
        { key: `y-${itemNo}`, cx: COL_X[col]! + DY_GAP, cy, filled: yFilled, ring: ringY, ringDelay: ringCount * 0.9 },
      );
    }
  }
  return bubbles;
}

const BUBBLES = buildBubbles();
const ITEM_NUMBERS = Array.from({ length: ROWS }, (_, row) =>
  Array.from({ length: COLS }, (_, col) => ({ key: `n-${row}-${col}`, x: COL_X[col]! - 14, y: GRID_TOP + row * ROW_H, n: row * COLS + col + 1 })),
).flat();

/** Conceptual UI of the analysis pipeline. Decorative: the staged animation
 * (alignment → grid → scan → rings → status) illustrates the process order,
 * not a real measurement. */
export function HeroVisual() {
  return (
    <div className="hero-visual" role="img" aria-label="Optik analiz sürecinin konsept görselleştirmesi: hizalama, tarama ve işaret tespiti">
      <div className="hv-frame">
        <svg className="hv-svg" viewBox="0 0 420 500" aria-hidden="true">
          <defs>
            <linearGradient id="hv-sheet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#f1f5f9" />
            </linearGradient>
            <linearGradient id="hv-scan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#2563eb" stopOpacity="0" />
              <stop offset="0.5" stopColor="#2563eb" stopOpacity="0.9" />
              <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* desk shadow */}
          <rect x="86" y="30" width="280" height="440" rx="10" fill="#0f172a" opacity="0.10" />
          {/* sheet */}
          <rect x="70" y="20" width="280" height="440" rx="10" fill="url(#hv-sheet)" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* perspective grid overlay */}
          <g className="hv-grid" stroke="#2563eb" strokeWidth="0.75" opacity="0.35">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <line key={`v${i}`} x1={90 + i * 48} y1="30" x2={90 + i * 48} y2="450" />
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <line key={`h${i}`} x1="80" y1={70 + i * 52} x2="340" y2={70 + i * 52} />
            ))}
          </g>

          {/* header lines */}
          <rect x="92" y="42" width="120" height="9" rx="4.5" fill="#cbd5e1" />
          <rect x="92" y="58" width="84" height="7" rx="3.5" fill="#e2e8f0" />

          {/* QR area */}
          <g className="hv-qr">
            <rect x="292" y="38" width="40" height="40" rx="3" fill="#0f172a" />
            <rect x="296" y="42" width="12" height="12" fill="#fff" />
            <rect x="299" y="45" width="6" height="6" fill="#0f172a" />
            <rect x="316" y="42" width="12" height="12" fill="#fff" />
            <rect x="319" y="45" width="6" height="6" fill="#0f172a" />
            <rect x="296" y="62" width="12" height="12" fill="#fff" />
            <rect x="299" y="65" width="6" height="6" fill="#0f172a" />
            <rect x="312" y="58" width="4" height="4" fill="#fff" />
            <rect x="320" y="62" width="4" height="4" fill="#fff" />
            <rect x="312" y="68" width="8" height="4" fill="#fff" />
          </g>
          <rect x="92" y="92" width="240" height="1.5" fill="#e2e8f0" />

          {/* column headers D / Y */}
          {COL_X.map(x => (
            <g key={`h-${x}`} className="hv-colhead" fontSize="8" fontWeight="700" fill="#64748b" textAnchor="middle">
              <text x={x} y="106">D</text>
              <text x={x + DY_GAP} y="106">Y</text>
            </g>
          ))}

          {/* item numbers */}
          {ITEM_NUMBERS.map(item => (
            <text key={item.key} x={item.x} y={item.y + 2.5} fontSize="7" fill="#94a3b8" textAnchor="middle">
              {item.n}
            </text>
          ))}

          {/* bubbles */}
          {BUBBLES.map(b => (
            <circle
              key={b.key}
              cx={b.cx}
              cy={b.cy}
              r={BUBBLE_R}
              fill={b.filled ? '#0f172a' : '#ffffff'}
              stroke={b.filled ? '#0f172a' : '#94a3b8'}
              strokeWidth="1.4"
            />
          ))}

          {/* analysis rings */}
          {BUBBLES.filter(b => b.ring).map(b => (
            <circle
              key={`ring-${b.key}`}
              className="hv-ring"
              style={{ animationDelay: `${b.ringDelay + 3}s` }}
              cx={b.cx}
              cy={b.cy}
              r={BUBBLE_R + 4.5}
              fill="none"
              stroke="#2563eb"
              strokeWidth="1.6"
            />
          ))}

          {/* alignment diamonds */}
          {[
            { x: 82, y: 32, d: '0.4s' },
            { x: 338, y: 32, d: '0.7s' },
            { x: 338, y: 448, d: '1s' },
            { x: 82, y: 448, d: '1.3s' },
          ].map(m => (
            <g key={`${m.x}-${m.y}`} className="hv-align" style={{ animationDelay: m.d }}>
              <rect x={m.x - 5} y={m.y - 5} width="10" height="10" fill="#2563eb" transform={`rotate(45 ${m.x} ${m.y})`} />
              <circle cx={m.x} cy={m.y} r="1.6" fill="#fff" />
            </g>
          ))}

          {/* scan line */}
          <g className="hv-scan">
            <rect x="72" y="0" width="276" height="14" fill="url(#hv-scan)" opacity="0.25" />
            <rect x="78" y="6" width="264" height="2" rx="1" fill="url(#hv-scan)" />
          </g>
        </svg>

        <div className="hv-chip hv-chip-align" aria-hidden="true">
          <span className="hv-dot hv-dot-ok" /> hizalandı
        </div>
        <div className="hv-chip hv-chip-qr" aria-hidden="true">
          <span className="hv-dot hv-dot-ok" /> QR · sayfa 2/4
        </div>

        <div className="hv-status" aria-hidden="true">
          <div className="hv-status-head">
            <span className="hv-status-title">ANALİZ</span>
            <span className="hv-status-demo">konsept</span>
          </div>
          <ul>
            <li><span className="hv-dot hv-dot-ok" /> 142 algılandı</li>
            <li><span className="hv-dot hv-dot-warn" /> 1 belirsiz</li>
            <li><span className="hv-dot hv-dot-bad" /> 1 çoklu işaret</li>
          </ul>
        </div>
      </div>
      <p className="hv-caption">Temsilî akış: hizalama → tarama → işaret tespiti</p>
    </div>
  );
}
