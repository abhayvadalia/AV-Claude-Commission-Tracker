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
  const [mfr, setMfr] = useState('')
  const [cust, setCust] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [invoiced, setInvoiced] = useState('All') // All | Invoiced | Not invoiced
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
      .filter((r) => !mfr || r.o.manufacturerId === mfr)
      .filter((r) => !cust || r.o.customerId === cust)
      .filter((r) => !from || r.o.date >= from)
      .filter((r) => !to || r.o.date <= to)
      .filter((r) => invoiced === 'All' || (invoiced === 'Invoiced' ? r.invCount > 0 : r.invCount === 0))
      .filter((r) => {
        if (!q) return true
        const hay = `${r.o.id} ${customerName(r.o.customerId)} ${manufacturerName(r.o.manufacturerId)}`.toLowerCase()
        return hay.includes(q.toLowerCase())
      })
      .sort((a, b) => (a.o.date < b.o.date ? 1 : -1))
  }, [state, status, mfr, cust, from, to, invoiced, q])

  // KPIs recalculate from the filtered rows.
  const k = useMemo(() => {
    const count = rows.length
    const value = rows.reduce((s, r) => s + r.total, 0)
    const pending = rows.reduce((s, r) => s + r.pending, 0)
    return {
      count,
      value,
      pending,
      fulfilled: value - pending,
      open: rows.filter((r) => r.st !== 'Completed').length,
      completed: rows.filter((r) => r.st === 'Completed').length,
      avg: count ? value / count : 0,
    }
  }, [rows])

  const clear = () => { setStatus('All'); setMfr(''); setCust(''); setFrom(''); setTo(''); setInvoiced('All'); setQ('') }
  const active = status !== 'All' || mfr || cust || from || to || invoiced !== 'All' || q

  return (
    <Layout
      title="Orders"
      actions={
        <button className="btn btn-primary" onClick={() => nav('/orders/new')}>
          + New Order
        </button>
      }
    >
      <div className="dash-tiles">
        <Tile label="Orders" value={k.count} accent="primary" />
        <Tile label="Open" value={k.open} accent="amber" />
        <Tile label="Completed" value={k.completed} accent="green" />
        <Tile label="Total Value" value={money(k.value)} />
        <Tile label="Fulfilled Value" value={money(k.fulfilled)} accent="green" />
        <Tile label="Pending Value" value={money(k.pending)} accent="red" />
        <Tile label="Avg Order Value" value={money(k.avg)} />
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
              <label className="lbl">Manufacturer</label>
              <select value={mfr} onChange={(e) => setMfr(e.target.value)}>
                <option value="">All</option>
                {state.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Customer</label>
              <select value={cust} onChange={(e) => setCust(e.target.value)}>
                <option value="">All</option>
                {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Invoicing</label>
              <select value={invoiced} onChange={(e) => setInvoiced(e.target.value)}>
                <option>All</option>
                <option>Invoiced</option>
                <option>Not invoiced</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">Order date from</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">to</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="field">
              <label className="lbl">Search</label>
              <input placeholder="Order, customer, manufacturer…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {active && (
              <div className="field" style={{ justifyContent: 'flex-end' }}>
                <button className="btn" onClick={clear}>Clear filters</button>
              </div>
            )}
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
            {rows.length === 0 && (
              <tr><td colSpan={9} className="empty">No orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
