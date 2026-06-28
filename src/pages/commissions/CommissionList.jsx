import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, Tile } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import { money, money2, fmtDate } from '../../lib/format.js'

export default function CommissionList() {
  const nav = useNavigate()
  const { accruals, manufacturerName, customerName, state } = useData()

  const [mfr, setMfr] = useState('')
  const [status, setStatus] = useState('All')

  const rows = useMemo(
    () =>
      accruals
        .filter((a) => (mfr ? a.manufacturerId === mfr : true))
        .filter((a) => (status === 'All' ? true : a.status === status))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    [accruals, mfr, status],
  )

  const tiles = useMemo(() => {
    const earned = accruals.reduce((s, a) => s + a.earned, 0)
    const settled = accruals.filter((a) => a.status === 'Settled').reduce((s, a) => s + a.earned, 0)
    return { earned, settled, pending: earned - settled, count: accruals.length }
  }, [accruals])

  return (
    <Layout title="Commissions" crumb="Module 3 · Earned on payment">
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
              <select value={mfr} onChange={(e) => setMfr(e.target.value)}>
                <option value="">All</option>
                {state.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All</option>
                <option>Earned</option>
                <option>Settled</option>
              </select>
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Commission</th>
              <th>Date</th>
              <th>From manufacturer</th>
              <th>Customer payment</th>
              <th>Invoice</th>
              <th>Order</th>
              <th className="right">Basis</th>
              <th className="right">Earned</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id} className="clickable" onClick={() => nav(`/commissions/${encodeURIComponent(a.id)}`)}>
                <td className="mono tag-link">{a.id}</td>
                <td className="muted">{fmtDate(a.date)}</td>
                <td>{manufacturerName(a.manufacturerId)}</td>
                <td className="mono">{a.paymentId}</td>
                <td className="mono">{a.invoiceId}</td>
                <td className="mono">{a.orderId}</td>
                <td className="num">{money2(a.basisAmount)}</td>
                <td className="num"><strong>{money2(a.earned)}</strong></td>
                <td><StatusBadge status={a.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
