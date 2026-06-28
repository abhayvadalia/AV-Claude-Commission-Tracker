import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, Tile } from '../../components/ui.jsx'
import SettleModal from '../../components/SettleModal.jsx'
import { useData } from '../../store/DataContext.jsx'
import { money, money2, fmtDate } from '../../lib/format.js'

export default function CommissionList() {
  const nav = useNavigate()
  const { accruals, manufacturerName, customerName, state, settleCommissions } = useData()

  const [mfr, setMfr] = useState('')
  const [status, setStatus] = useState('All')
  const [selected, setSelected] = useState({}) // accrualId -> true (Earned only)
  const [settleOpen, setSettleOpen] = useState(false)

  const rows = useMemo(
    () =>
      accruals
        .filter((a) => (mfr ? a.manufacturerId === mfr : true))
        .filter((a) => (status === 'All' ? true : a.status === status))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [accruals, mfr, status],
  )

  // Tiles reflect the current filters (recalculate from the filtered rows).
  const tiles = useMemo(() => {
    const earned = rows.reduce((s, a) => s + a.earned, 0)
    const settled = rows.filter((a) => a.status === 'Settled').reduce((s, a) => s + a.earned, 0)
    return { earned, settled, pending: earned - settled, count: rows.length }
  }, [rows])

  const earnedRows = rows.filter((a) => a.status === 'Earned')
  const selectedIds = Object.keys(selected).filter((id) => selected[id] && rows.some((r) => r.id === id && r.status === 'Earned'))
  const selectedAmount = rows.filter((r) => selectedIds.includes(r.id)).reduce((s, r) => s + r.earned, 0)
  const allEarnedSelected = earnedRows.length > 0 && earnedRows.every((r) => selected[r.id])

  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const toggleAll = () => {
    if (allEarnedSelected) setSelected({})
    else { const n = {}; earnedRows.forEach((r) => { n[r.id] = true }); setSelected(n) }
  }

  const confirmSettle = (detail) => {
    settleCommissions(selectedIds, detail)
    setSelected({})
    setSettleOpen(false)
  }

  return (
    <Layout
      title="Commissions"
      wide
      actions={
        selectedIds.length > 0 ? (
          <button className="btn btn-primary" onClick={() => setSettleOpen(true)}>
            Record Settlement ({selectedIds.length})
          </button>
        ) : null
      }
    >
      <div className="tiles">
        <Tile label="Total Commission Earned" value={money(tiles.earned)} accent="primary" />
        <Tile label="Settled by Manufacturer" value={money(tiles.settled)} accent="green" />
        <Tile label="Pending Settlement" value={money(tiles.pending)} accent="amber" />
        <Tile label="Accruals" value={tiles.count} />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="filters">
            <div className="field">
              <label className="lbl">Manufacturer</label>
              <select value={mfr} onChange={(e) => { setMfr(e.target.value); setSelected({}) }}>
                <option value="">All</option>
                {state.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Status</label>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setSelected({}) }}>
                <option>All</option>
                <option>Earned</option>
                <option>Settled</option>
              </select>
            </div>
          </div>
          {selectedIds.length > 0 && (
            <div className="small muted">{selectedIds.length} selected · {money(selectedAmount)}</div>
          )}
        </div>
        <table>
          <thead>
            <tr>
              <th style={{ width: 34 }}>
                <input
                  type="checkbox"
                  style={{ width: 'auto' }}
                  checked={allEarnedSelected}
                  onChange={toggleAll}
                  disabled={earnedRows.length === 0}
                  title="Select all Earned"
                />
              </th>
              <th>Commission</th>
              <th>From → To</th>
              <th>Source chain</th>
              <th className="right">Earned</th>
              <th>Status &amp; settlement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="clickable" onClick={() => nav(`/commissions/${encodeURIComponent(a.id)}`)}>
                <td onClick={(e) => e.stopPropagation()}>
                  {a.status === 'Earned' ? (
                    <input type="checkbox" style={{ width: 'auto' }} checked={!!selected[a.id]} onChange={() => toggle(a.id)} />
                  ) : (
                    <span className="muted" title="Settled">✓</span>
                  )}
                </td>
                <td>
                  <div className="cell-main mono tag-link">{a.id}</div>
                  <div className="cell-sub">{fmtDate(a.date)}</div>
                </td>
                <td>
                  <div className="cell-main">{manufacturerName(a.manufacturerId)}</div>
                  <div className="cell-sub">to {customerName(a.customerId)}</div>
                </td>
                <td>
                  <div className="cell-sub" style={{ marginTop: 0 }}>
                    <span className="mono">{a.paymentId}</span><span className="sep">·</span>
                    <span className="mono">{a.invoiceId}</span><span className="sep">·</span>
                    <span className="mono">{a.orderId}</span>
                  </div>
                  <div className="cell-sub">
                    basis {money2(a.basisAmount)} · {a.commissionType === 'fixed' ? `fixed ₹${a.commissionValue.toLocaleString('en-IN')}` : `${a.commissionValue}%`}
                  </div>
                </td>
                <td className="num"><strong style={{ fontSize: 15 }}>{money2(a.earned)}</strong></td>
                <td>
                  <StatusBadge status={a.status} />
                  {a.status === 'Settled' && (
                    <div className="cell-sub">{fmtDate(a.settlement?.date)} · {a.settlement?.reference || '—'}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {settleOpen && (
        <SettleModal
          onClose={() => setSettleOpen(false)}
          onConfirm={confirmSettle}
          count={selectedIds.length}
          amount={selectedAmount}
        />
      )}
    </Layout>
  )
}
