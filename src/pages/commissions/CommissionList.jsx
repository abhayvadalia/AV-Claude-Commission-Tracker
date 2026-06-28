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
      crumb="Module 3 · Earned on payment"
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
              <th>Date</th>
              <th>From manufacturer</th>
              <th>Invoice</th>
              <th>Order</th>
              <th className="right">Earned</th>
              <th>Settlement</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="clickable" onClick={() => nav(`/commissions/${encodeURIComponent(a.id)}`)}>
                <td onClick={(e) => e.stopPropagation()}>
                  {a.status === 'Earned' ? (
                    <input type="checkbox" style={{ width: 'auto' }} checked={!!selected[a.id]} onChange={() => toggle(a.id)} />
                  ) : (
                    <span className="muted">✓</span>
                  )}
                </td>
                <td className="mono tag-link">{a.id}</td>
                <td className="muted">{fmtDate(a.date)}</td>
                <td>{manufacturerName(a.manufacturerId)}</td>
                <td className="mono">{a.invoiceId}</td>
                <td className="mono">{a.orderId}</td>
                <td className="num"><strong>{money2(a.earned)}</strong></td>
                <td className="muted small">
                  {a.status === 'Settled' ? `${fmtDate(a.settlement?.date)} · ${a.settlement?.reference || '—'}` : '—'}
                </td>
                <td><StatusBadge status={a.status} /></td>
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
