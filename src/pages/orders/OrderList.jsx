import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, Tile } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import { orderTotal, orderStatus, invoicesForOrder, orderPendingAmount } from '../../lib/commission.js'
import { money, fmtDate } from '../../lib/format.js'

export default function OrderList() {
  const nav = useNavigate()
  const { state, manufacturerName, customerName } = useData()
  const [status, setStatus] = useState('All')
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    return state.orders
      .map((o) => ({
        o,
        st: orderStatus(o),
        total: orderTotal(o),
        pending: orderPendingAmount(o),
        invCount: invoicesForOrder(state, o.id).length,
      }))
      .filter((r) => status === 'All' || r.st === status)
      .filter((r) => {
        if (!q) return true
        const hay = `${r.o.id} ${customerName(r.o.customerId)} ${manufacturerName(r.o.manufacturerId)}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      })
      .sort((a, b) => (a.o.date < b.o.date ? 1 : -1))
  }, [state, status, q])

  const totals = useMemo(() => {
    const all = state.orders.map((o) => orderTotal(o))
    return {
      count: state.orders.length,
      value: all.reduce((s, v) => s + v, 0),
      open: state.orders.filter((o) => orderStatus(o) !== 'Completed').length,
    }
  }, [state])

  return (
    <Layout
      title="Orders"
      crumb="Module 1"
      actions={
        <button className="btn btn-primary" onClick={() => nav('/orders/new')}>
          + New Order
        </button>
      }
    >
      <div className="tiles">
        <Tile label="Total Orders" value={totals.count} accent="primary" />
        <Tile label="Open (not completed)" value={totals.open} accent="amber" />
        <Tile label="Total Order Value" value={money(totals.value)} />
      </div>

      <div className="card">
        <div className="card-head">
          <div className="filters">
            <div className="field">
              <label className="lbl">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option>All</option>
                <option>New</option>
                <option>Partially Fulfilled</option>
                <option>Completed</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">Search</label>
              <input placeholder="Order, customer, manufacturer…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Manufacturer</th>
              <th className="right">Lines</th>
              <th className="right">Value</th>
              <th className="right">Pending</th>
              <th className="right">Invoices</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ o, st, total, pending, invCount }) => (
              <tr key={o.id} className="clickable" onClick={() => nav(`/orders/${o.id}`)}>
                <td><span className="tag-link">{o.id}</span></td>
                <td className="muted">{fmtDate(o.date)}</td>
                <td>{customerName(o.customerId)}</td>
                <td>{manufacturerName(o.manufacturerId)}</td>
                <td className="num">{o.lines.length}</td>
                <td className="num">{money(total)}</td>
                <td className="num">
                  {pending > 0 ? <strong style={{ color: 'var(--amber)' }}>{money(pending)}</strong> : <span className="muted">—</span>}
                </td>
                <td className="num">{invCount || '—'}</td>
                <td><StatusBadge status={st} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
