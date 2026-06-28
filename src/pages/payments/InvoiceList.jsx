import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, AgingBadge, Tile } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import { invoicePosition, agingDays, agingBucket } from '../../lib/commission.js'
import { money, fmtDate } from '../../lib/format.js'

const SORTS = {
  aging: 'Aging',
  outstanding: 'Outstanding amount',
  date: 'Invoice date',
  dueDate: 'Due date',
  amount: 'Invoice amount',
  manufacturer: 'Manufacturer',
  customer: 'Customer',
}

export default function InvoiceList() {
  const nav = useNavigate()
  const { state, manufacturerName, customerName } = useData()

  // Defaults per requirements §4.3: show open exposure (New + Partially Paid),
  // no manufacturer/customer pre-selected, sorted by aging descending.
  const [mfr, setMfr] = useState('')
  const [cust, setCust] = useState('')
  const [statusFilter, setStatusFilter] = useState('open') // 'open' | 'New' | 'Partially Paid' | 'Paid' | 'all'
  const [sortKey, setSortKey] = useState('aging')
  const [sortDir, setSortDir] = useState('desc')

  const enriched = useMemo(
    () =>
      state.invoices.map((inv) => {
        const pos = invoicePosition(state, inv)
        const days = agingDays(inv, pos.balance)
        const bucket = agingBucket(days, pos.balance)
        return { inv, pos, days, bucket }
      }),
    [state],
  )

  const filtered = useMemo(() => {
    let rows = enriched.filter((r) => {
      if (mfr && r.inv.manufacturerId !== mfr) return false
      if (cust && r.inv.customerId !== cust) return false
      if (statusFilter === 'open') return r.pos.status !== 'Paid'
      if (statusFilter === 'all') return true
      return r.pos.status === statusFilter
    })

    const dir = sortDir === 'asc' ? 1 : -1
    rows = [...rows].sort((a, b) => {
      let av, bv
      switch (sortKey) {
        case 'aging': av = a.bucket.sort * 10000 + a.days; bv = b.bucket.sort * 10000 + b.days; break
        case 'outstanding': av = a.pos.balance; bv = b.pos.balance; break
        case 'amount': av = a.pos.amount; bv = b.pos.amount; break
        case 'date': av = a.inv.date; bv = b.inv.date; break
        case 'dueDate': av = a.inv.dueDate; bv = b.inv.dueDate; break
        case 'manufacturer': av = manufacturerName(a.inv.manufacturerId); bv = manufacturerName(b.inv.manufacturerId); break
        case 'customer': av = customerName(a.inv.customerId); bv = customerName(b.inv.customerId); break
        default: av = 0; bv = 0
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })
    return rows
  }, [enriched, mfr, cust, statusFilter, sortKey, sortDir])

  // Summary tiles recalculate on the current filter (§4.2).
  const tiles = useMemo(() => {
    const invoiced = filtered.reduce((s, r) => s + r.pos.amount, 0)
    const received = filtered.reduce((s, r) => s + r.pos.paid, 0)
    const outstanding = filtered.reduce((s, r) => s + r.pos.balance, 0)
    const overdue = filtered.reduce((s, r) => s + (r.days > 0 ? r.pos.balance : 0), 0)
    return { invoiced, received, outstanding, overdue }
  }, [filtered])

  return (
    <Layout
      title="Payments"
      actions={
        <button className="btn btn-primary" onClick={() => nav('/invoices/new')}>
          + Add Invoice
        </button>
      }
    >
      <div className="tiles">
        <Tile label="Total Invoiced" value={money(tiles.invoiced)} />
        <Tile label="Total Received" value={money(tiles.received)} accent="green" />
        <Tile label="Total Outstanding" value={money(tiles.outstanding)} accent="primary" />
        <Tile label="Overdue Outstanding" value={money(tiles.overdue)} accent="red" />
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
              <label className="lbl">Customer</label>
              <select value={cust} onChange={(e) => setCust(e.target.value)}>
                <option value="">All</option>
                {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Status</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="open">Open (New + Partially Paid)</option>
                <option value="New">New</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Paid">Paid</option>
                <option value="all">All</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">Sort by</label>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="lbl">Direction</label>
              <select value={sortDir} onChange={(e) => setSortDir(e.target.value)}>
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Manufacturer</th>
              <th>Customer</th>
              <th>Due</th>
              <th className="right">Amount</th>
              <th className="right">Outstanding</th>
              <th>Aging</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ inv, pos, days, bucket }) => (
              <tr key={inv.id} className="clickable" onClick={() => nav(`/invoices/${inv.id}`)}>
                <td><span className="tag-link">{inv.id}</span></td>
                <td>{manufacturerName(inv.manufacturerId)}</td>
                <td>{customerName(inv.customerId)}</td>
                <td className="muted">{fmtDate(inv.dueDate)}</td>
                <td className="num">{money(pos.amount)}</td>
                <td className="num">{money(pos.balance)}</td>
                <td><AgingBadge bucket={bucket} days={days} /></td>
                <td><StatusBadge status={pos.status} /></td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="empty">No invoices match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}
