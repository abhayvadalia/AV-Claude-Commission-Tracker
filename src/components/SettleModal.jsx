import { useState } from 'react'
import { Modal } from './ui.jsx'
import { money } from '../lib/format.js'

// Records / edits a settlement (manufacturer paying the distributor the earned commission).
export default function SettleModal({ onClose, onConfirm, count = 1, amount, initial }) {
  const [date, setDate] = useState(initial?.date || '2026-06-28')
  const [reference, setReference] = useState(initial?.reference || '')

  return (
    <Modal
      title={initial ? 'Edit settlement' : `Record settlement${count > 1 ? ` · ${count} commissions` : ''}`}
      onClose={onClose}
      onSave={() => onConfirm({ date, reference: reference.trim() || '—' })}
      saveLabel={initial ? 'Update' : 'Mark as settled'}
      canSave={!!date}
    >
      <p className="muted small mb">
        Recording a settlement marks the commission as received from the manufacturer (Earned → Settled).
        {amount != null && <> Total being settled: <strong style={{ color: 'var(--text)' }}>{money(amount)}</strong>.</>}
      </p>
      <div className="field mb">
        <label className="lbl">Settlement date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="field">
        <label className="lbl">Reference (optional)</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. SETL-SURAT-05 / bank ref" />
      </div>
    </Modal>
  )
}
