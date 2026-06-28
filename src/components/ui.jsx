// Small shared presentational helpers.

export function StatusBadge({ status }) {
  const map = {
    New: 'b-new',
    'Partially Fulfilled': 'b-partial',
    'Partially Paid': 'b-partial',
    Completed: 'b-done',
    Paid: 'b-paid',
    Earned: 'b-earned',
    Settled: 'b-settled',
  }
  return (
    <span className={`badge ${map[status] || 'b-new'}`}>
      <span className="dot" />
      {status}
    </span>
  )
}

export function AgingBadge({ bucket, days }) {
  return (
    <span className={`badge ${bucket.cls}`} title={days > 0 ? `${days} days overdue` : ''}>
      {bucket.label}
      {days > 0 ? ` · ${days}d` : ''}
    </span>
  )
}

export function Tile({ label, value, accent }) {
  return (
    <div className={`tile ${accent ? 'accent-' + accent : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  )
}

export function KV({ k, children }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{children}</span>
    </div>
  )
}

export function Empty({ children }) {
  return <div className="empty">{children}</div>
}

export function Modal({ title, onClose, onSave, saveLabel = 'Save', canSave = true, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head">{title}</div>
        <div className="modal-body">{children}</div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave} onClick={onSave}>{saveLabel}</button>
        </div>
      </div>
    </div>
  )
}

export function CommissionTermLabel({ term }) {
  if (!term) return <span className="muted">—</span>
  return term.type === 'fixed' ? (
    <span>Fixed · ₹{Number(term.value).toLocaleString('en-IN')}</span>
  ) : (
    <span>{term.value}%</span>
  )
}
