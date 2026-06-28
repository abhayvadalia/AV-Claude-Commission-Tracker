// Tiny dependency-free SVG charts for the dashboard.

export function HBarChart({ data, format = (v) => v, height = 26, gap = 12 }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  if (data.length === 0) return <div className="empty">No data.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {data.map((d) => (
        <div key={d.label} className="flex" style={{ gap: 12 }}>
          <div style={{ width: 150, flexShrink: 0, fontSize: 13 }} title={d.label}>
            <span className="ellip">{d.label}</span>
          </div>
          <div style={{ flex: 1, background: '#f0f2f5', borderRadius: 6, height, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                width: `${(d.value / max) * 100}%`,
                height: '100%',
                background: d.color || 'var(--primary)',
                borderRadius: 6,
                transition: 'width .4s ease',
                minWidth: d.value > 0 ? 3 : 0,
              }}
            />
          </div>
          <div className="mono" style={{ width: 110, textAlign: 'right', fontSize: 13, fontWeight: 600 }}>
            {format(d.value)}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Donut({ segments, size = 150, thickness = 22, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const r = (size - thickness) / 2
  const cx = size / 2
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex" style={{ gap: 20, alignItems: 'center' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${cx} ${cx})`}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="#f0f2f5" strokeWidth={thickness} />
          {segments.map((s, i) => {
            const len = (s.value / total) * circ
            const el = (
              <circle
                key={i}
                cx={cx}
                cy={cx}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
        </g>
        {centerLabel && (
          <text x={cx} y={cx - 2} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text)">{centerLabel}</text>
        )}
        {centerSub && (
          <text x={cx} y={cx + 16} textAnchor="middle" fontSize="11" fill="var(--muted)">{centerSub}</text>
        )}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map((s, i) => (
          <div key={i} className="flex" style={{ gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, display: 'inline-block' }} />
            <span style={{ minWidth: 90 }}>{s.label}</span>
            <span className="mono" style={{ fontWeight: 600 }}>{s.display ?? s.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
