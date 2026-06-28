import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { KV, Empty, CommissionTermLabel, StatusBadge } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import {
  byId, lineAmount, orderStatus, orderLineStatus, linePendingQty,
} from '../../lib/commission.js'
import { money, fmtDate, addDays } from '../../lib/format.js'

export default function FulfilOrder() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, fulfilOrder, manufacturerName, customerName, customer } = useData()
  const order = byId(state.orders, id)

  // qty being fulfilled now, keyed by line id
  const [qty, setQty] = useState({})
  const [invNo, setInvNo] = useState('')
  const [invDate, setInvDate] = useState('2026-06-28')

  const cust = order ? customer(order.customerId) : null
  const dueDate = useMemo(() => addDays(invDate, cust?.creditTermsDays || 30), [invDate, cust])

  if (!order) return <Layout title="Order not found"><Empty>No order "{id}".</Empty></Layout>

  const status = orderStatus(order)
  if (status === 'Completed') {
    return (
      <Layout title={`${order.id} · Fulfilment`} crumb={<Link to={`/orders/${order.id}`} className="tag-link">{order.id}</Link>}>
        <div className="card card-pad"><Empty>This order is already fully fulfilled. Nothing pending to update.</Empty></div>
      </Layout>
    )
  }

  const setQ = (lineId, v, max) => {
    const n = Math.max(0, Math.min(Number(v) || 0, max))
    setQty((s) => ({ ...s, [lineId]: v === '' ? '' : n }))
  }

  // lines being fulfilled now -> amount to invoice
  const rows = order.lines.map((l) => {
    const pending = linePendingQty(l)
    const now = Number(qty[l.id]) || 0
    return { line: l, pending, now, amount: now * (Number(l.rate) || 0) }
  })
  const fulfilling = rows.filter((r) => r.now > 0)
  const invoiceTotal = fulfilling.reduce((s, r) => s + r.amount, 0)

  const valid = fulfilling.length > 0 && invNo.trim() && invoiceTotal > 0

  const submit = () => {
    const fulfilments = {}
    fulfilling.forEach((r) => { fulfilments[r.line.id] = r.now })
    const invoice = {
      id: invNo.trim(),
      manufacturerId: order.manufacturerId,
      customerId: order.customerId,
      date: invDate,
      dueDate,
      lines: fulfilling.map((r) => ({ orderId: order.id, orderLineId: r.line.id, amount: r.amount })),
    }
    fulfilOrder({ orderId: order.id, fulfilments, invoice })
    nav(`/invoices/${encodeURIComponent(invoice.id)}`)
  }

  return (
    <Layout
      title={`Update Fulfilment · ${order.id}`}
      crumb={<Link to={`/orders/${order.id}`} className="tag-link">{order.id}</Link>}
      actions={<button className="btn" onClick={() => nav(`/orders/${order.id}`)}>Cancel</button>}
    >
      <div className="card card-pad mb">
        <div className="detail-grid">
          <KV k="Customer (buyer)">{customerName(order.customerId)}</KV>
          <KV k="Manufacturer (vendor)">{manufacturerName(order.manufacturerId)}</KV>
          <KV k="Current status"><StatusBadge status={status} /></KV>
          <KV k="Credit terms">{cust?.creditTermsDays} days</KV>
        </div>
      </div>

      <div className="section-title">Quantities fulfilled now</div>
      <div className="card mb">
        <table>
          <thead>
            <tr>
              <th>Fabric</th>
              <th className="right">Ordered</th>
              <th className="right">Already fulfilled</th>
              <th className="right">Pending</th>
              <th className="right">Fulfil now</th>
              <th className="right">Rate</th>
              <th className="right">Amount to invoice</th>
              <th>Resulting line status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ line, pending, now, amount }) => {
              const resulting = { ...line, qtyFulfilled: (Number(line.qtyFulfilled) || 0) + now }
              return (
                <tr key={line.id}>
                  <td>{line.desc}</td>
                  <td className="num">{line.qty} {line.unit}</td>
                  <td className="num">{line.qtyFulfilled} {line.unit}</td>
                  <td className="num">{pending > 0 ? `${pending} ${line.unit}` : <span className="muted">—</span>}</td>
                  <td className="num">
                    {pending > 0 ? (
                      <input
                        type="number"
                        min="0"
                        max={pending}
                        style={{ width: 90, textAlign: 'right' }}
                        value={qty[line.id] ?? ''}
                        onChange={(e) => setQ(line.id, e.target.value, pending)}
                      />
                    ) : (
                      <span className="muted">fulfilled</span>
                    )}
                  </td>
                  <td className="num">{money(line.rate)}</td>
                  <td className="num">{now > 0 ? <strong>{money(amount)}</strong> : <span className="muted">—</span>}</td>
                  <td><StatusBadge status={orderLineStatus(resulting)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="section-title">Invoice for the fulfilled value <span className="muted small">(required)</span></div>
      <div className="card card-pad mb">
        <p className="muted small mb">
          Fulfilling these quantities raises a manufacturer invoice to the customer for the fulfilled value.
          Invoice lines bill the specific order lines above; commission terms are inherited from each order line.
        </p>
        <div className="form-grid">
          <div className="field">
            <label className="lbl">Invoice number</label>
            <input value={invNo} onChange={(e) => setInvNo(e.target.value)} placeholder="e.g. INV-S-2242" />
          </div>
          <div className="field">
            <label className="lbl">Manufacturer (raises invoice)</label>
            <input value={manufacturerName(order.manufacturerId)} disabled />
          </div>
          <div className="field">
            <label className="lbl">Customer (owes)</label>
            <input value={customerName(order.customerId)} disabled />
          </div>
          <div className="field">
            <label className="lbl">Invoice date</label>
            <input type="date" value={invDate} onChange={(e) => setInvDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="lbl">Due date <span className="muted small">(auto: {cust?.creditTermsDays}d)</span></label>
            <input type="date" value={dueDate} disabled />
          </div>
        </div>
      </div>

      <div className="section-title">Commission to be inherited</div>
      <div className="card mb">
        {fulfilling.length === 0 ? (
          <Empty>Enter quantities above to see the invoice breakdown.</Empty>
        ) : (
          <table>
            <thead>
              <tr><th>Order line</th><th className="right">Invoiced amount</th><th>Commission term</th></tr>
            </thead>
            <tbody>
              {fulfilling.map((r) => (
                <tr key={r.line.id}>
                  <td>{r.line.desc}</td>
                  <td className="num">{money(r.amount)}</td>
                  <td><CommissionTermLabel term={r.line.commission} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card card-pad flex between">
        <div className="muted">
          Invoice total: <strong style={{ color: 'var(--text)' }}>{money(invoiceTotal)}</strong>
          {fulfilling.length > 0 && <span className="small"> · {fulfilling.length} line(s)</span>}
        </div>
        <button className="btn btn-primary" disabled={!valid} onClick={submit}>
          Update fulfilment &amp; raise invoice
        </button>
      </div>
    </Layout>
  )
}
