import type { ScaleResult } from '../../scoring/mmpiScoring';

type Props = {
  scales: ScaleResult[]; // validity + clinical + ?
  height?: number;
};

const ORDER: string[] = ['?', 'L', 'F', 'K', 'Hs', 'D', 'Hy', 'Pd', 'Mf', 'Pa', 'Pt', 'Sc', 'Ma', 'Si'];

export function MMPIScoreChart({ scales, height = 360 }: Props) {
  const ordered = [...scales].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

  const width = 820;
  const padding = { top: 24, right: 24, bottom: 36, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const yMin = 20;
  const yMax = 120;
  const yRange = yMax - yMin;

  const xStep = chartW / (ordered.length - 1 || 1);

  function yPos(t: number) {
    const clamped = Math.max(yMin, Math.min(yMax, t));
    return padding.top + chartH - ((clamped - yMin) / yRange) * chartH;
  }
  function xPos(i: number) {
    return padding.left + i * xStep;
  }

  const tTicks = [30, 40, 50, 60, 70, 80, 90, 100, 110, 120];

  // Separate lines: cannotSay, validity, clinical
  const validityIds = new Set(['L', 'F', 'K']);
  const cannotIds = new Set(['?']);

  const validityPoints = ordered.map((s, i) => ({ s, i })).filter(p => validityIds.has(p.s.id));
  const clinicalPoints = ordered.map((s, i) => ({ s, i })).filter(p => !validityIds.has(p.s.id) && !cannotIds.has(p.s.id));

  function linePath(points: { s: ScaleResult; i: number }[]) {
    if (points.length < 2) return '';
    return points
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xPos(p.i)} ${yPos(p.s.tScore)}`)
      .join(' ');
  }

  return (
    <div className="mmpi-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="MMPI Profil Grafiği" className="mmpi-chart-svg">
        {/* Grid */}
        {tTicks.map(t => (
          <g key={t}>
            <line
              x1={padding.left}
              x2={width - padding.right}
              y1={yPos(t)}
              y2={yPos(t)}
              stroke={t === 50 ? '#0d9488' : t === 70 ? '#ef4444' : '#e2e8f0'}
              strokeDasharray={t === 50 ? '4 3' : t === 70 ? '6 4' : '3 3'}
              strokeWidth={t === 50 || t === 70 ? 1.2 : 0.8}
            />
            <text x={padding.left - 8} y={yPos(t) + 3} textAnchor="end" fontSize="10" fill="#64748b">
              {t}
            </text>
          </g>
        ))}

        {/* Vertical separator after ?LK */}
        <line
          x1={xPos(3) + xStep / 2}
          x2={xPos(3) + xStep / 2}
          y1={padding.top}
          y2={padding.top + chartH}
          stroke="#cbd5e1"
          strokeDasharray="4 4"
          strokeWidth={1}
        />

        {/* Clinical line */}
        <path d={linePath(clinicalPoints)} fill="none" stroke="#6d28d9" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Validity line */}
        <path d={linePath(validityPoints)} fill="none" stroke="#0d9488" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {/* Cannot line is single point, no line */}

        {/* Points */}
        {ordered.map((s, i) => {
          const cx = xPos(i);
          const cy = yPos(s.tScore);
          const isHigh = s.tScore >= 70;
          const fill = s.group === 'cannot' ? (s.rawScore >= 30 ? '#ef4444' : s.rawScore >= 11 ? '#f59e0b' : '#64748b') : isHigh ? '#ef4444' : s.group === 'validity' ? '#0d9488' : '#6d28d9';
          return (
            <g key={s.id}>
              <circle cx={cx} cy={cy} r={6} fill={fill} stroke="#ffffff" strokeWidth={1.6} />
              <text x={cx} y={cy - 12} textAnchor="middle" fontSize="10" fontWeight={700} fill={fill}>
                {Math.round(s.tScore)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {ordered.map((s, i) => (
          <text key={`label-${s.id}`} x={xPos(i)} y={padding.top + chartH + 18} textAnchor="middle" fontSize="11" fontWeight={700} fill={s.group === 'validity' ? '#0d9488' : s.group === 'cannot' ? '#64748b' : '#334155'}>
            {s.shortName}
          </text>
        ))}
      </svg>

      <div className="mmpi-chart-legend">
        <span className="legend-item"><span className="legend-dot" style={{ background: '#0d9488' }} /> Geçerlik (L,F,K)</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#6d28d9' }} /> Klinik</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> T ≥70 klinik eşik</span>
        <span className="legend-item"><span className="legend-dot" style={{ background: '#0d9488', opacity: 0.3 }} /> 50 = Türk norm ortalaması</span>
      </div>
    </div>
  );
}
