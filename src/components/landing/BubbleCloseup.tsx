/** Magnified answer bubble with minimal measurement overlays. Conceptual
 * illustration of the geometric checks, not a real capture. */
export function BubbleCloseup() {
  return (
    <figure className="closeup-figure" role="img" aria-label="Büyütülmüş cevap baloncuğu üzerinde nominal merkez, algılanan halka ve komşu sınır göstergeleri">
      <svg className="closeup-svg" viewBox="0 0 400 340" aria-hidden="true">
        <defs>
          <radialGradient id="cu-paper" cx="0.5" cy="0.4" r="0.9">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e8edf3" />
          </radialGradient>
          <radialGradient id="cu-mark" cx="0.42" cy="0.38" r="0.75">
            <stop offset="0" stopColor="#334155" />
            <stop offset="0.72" stopColor="#0f172a" />
            <stop offset="1" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        <rect x="8" y="8" width="384" height="324" rx="14" fill="url(#cu-paper)" stroke="#cbd5e1" strokeWidth="1.5" />

        {/* faint measurement grid */}
        <g stroke="#cbd5e1" strokeWidth="0.75" opacity="0.7">
          {[70, 110, 150, 190, 230, 270, 310].map(x => (
            <line key={`v${x}`} x1={x} y1="20" x2={x} y2="320" strokeDasharray="3 5" />
          ))}
          {[60, 100, 140, 180, 220, 260, 300].map(y => (
            <line key={`h${y}`} x1="20" y1={y} x2="380" y2={y} strokeDasharray="3 5" />
          ))}
        </g>

        {/* neighbour bubbles, clipped by figure edges */}
        <g opacity="0.55">
          <circle cx="8" cy="170" r="46" fill="#ffffff" stroke="#94a3b8" strokeWidth="3" />
          <circle cx="392" cy="170" r="46" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" />
        </g>

        {/* neighbour boundary */}
        <rect
          className="cu-neighbour"
          x="118"
          y="88"
          width="164"
          height="164"
          rx="6"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="1.5"
          strokeDasharray="7 5"
        />

        {/* analysis area */}
        <circle className="cu-area" cx="200" cy="170" r="72" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2 5" strokeLinecap="round" />

        {/* printed bubble outline (slightly imperfect, as printed) */}
        <circle cx="200" cy="170" r="52" fill="#ffffff" stroke="#475569" strokeWidth="3.5" />

        {/* detected hand mark */}
        <ellipse className="cu-mark" cx="203" cy="172" rx="34" ry="36" fill="url(#cu-mark)" transform="rotate(-8 203 172)" />

        {/* detected ring */}
        <circle className="cu-ring" cx="203" cy="172" r="44" fill="none" stroke="#10b981" strokeWidth="2" />

        {/* nominal center crosshair */}
        <g className="cu-nominal" stroke="#2563eb" strokeWidth="1.75">
          <line x1="200" y1="152" x2="200" y2="188" />
          <line x1="182" y1="170" x2="218" y2="170" />
          <circle cx="200" cy="170" r="3.2" fill="#2563eb" stroke="none" />
        </g>

        {/* measured offset between nominal and detected center */}
        <line x1="200" y1="170" x2="203" y2="172" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="203" cy="172" r="2.4" fill="#ef4444" />

        {/* leader labels */}
        <g fontSize="10.5" fontWeight="600">
          <g className="cu-label">
            <line x1="245" y1="140" x2="292" y2="96" stroke="#10b981" strokeWidth="1.25" />
            <circle cx="245" cy="140" r="2.5" fill="#10b981" />
            <text x="296" y="92" fill="#065f46">algılanan halka</text>
          </g>
          <g className="cu-label">
            <line x1="200" y1="188" x2="200" y2="238" stroke="#2563eb" strokeWidth="1.25" />
            <circle cx="200" cy="188" r="2.5" fill="#2563eb" />
            <text x="200" y="254" fill="#1e40af" textAnchor="middle">nominal merkez</text>
          </g>
          <g className="cu-label">
            <line x1="141" y1="220" x2="96" y2="262" stroke="#2563eb" strokeWidth="1.25" strokeDasharray="3 3" />
            <circle cx="141" cy="220" r="2.5" fill="#2563eb" />
            <text x="40" y="282" fill="#334155">analiz alanı</text>
          </g>
          <g className="cu-label">
            <line x1="282" y1="252" x2="316" y2="286" stroke="#b45309" strokeWidth="1.25" />
            <circle cx="282" cy="252" r="2.5" fill="#f59e0b" />
            <text x="252" y="306" fill="#92400e">komşu sınırı</text>
          </g>
        </g>
      </svg>
      <figcaption className="closeup-caption">Konsept büyütme · Ø 3,5 mm cevap alanı</figcaption>
    </figure>
  );
}
