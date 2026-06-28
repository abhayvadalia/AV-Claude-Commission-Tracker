import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, KV, CommissionTermLabel, Empty } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import {
  byId, lineAmount, orderTotal, orderStatus, orderLineStatus,
  invoicesForOrder, invoicePosition, linePendingQty, linePendingAmount, orderPendingAmount,
} from '../../lib/commission.js'
import { money, fmtDate } from '../../lib/format.js'

export default function OrderDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { state, manufacturerName, customerName, manufacturer } = useData()
  const order = byId(state.orders, id)

  if (!order) return <Layout title="Order not found"><Empty>No order "{id}".</Empty></Layout>

  const invoices = invoicesForOrder(state, order.id)
  const total = orderTotal(order)
  const m = manufacturer(order.manufacturerId)
  const pendingTotal = orderPendingAmount(order)
  const pendingLines = order.lines.filter((l) => linePendingQty(l) > 0)
  const pendingUnits = pendingLines.reduce((s, l) => s + linePendingQty(l), 0)

  return (
    <Layout
      title={order.id}
      crumb={<Link to="/orders" className="tag-link">Orders</Link>}
      actions={<button className="btn" onClick={() => nav('/orders')}>← Back</button>}
    >
      <div className="card card-pad mb">
        <div className="detail-grid">
          <KV k="Customer (buyer)">{customerName(order.customerId)}</KV>
          <KV k="Manufacturer (vendor)">{manufacturerName(order.manufacturerId)}</KV>
          <KV k="Order date">{fmtDate(order.date)}</KV>
          <KV k="Status"><StatusBadge status={orderStatus(order)} /></KV>
          <KV k="Total order value">{money(total)}</KV>
          <KV k="Vendor default commission"><CommissionTermLabel term={m?.defaultCommission} /></KV>
        </div>
      </div>

      {pendingTotal > 0 && (
        <div className="card card-pad mb" style={{ borderLeft: '4px solid var(--amber)', background: 'var(--amber-soft)' }}>
          <div className="flex between">
            <div>
              <strong style={{ color: 'var(--amber)' }}>Pending fulfilment</strong>
              <div className="small muted">
                {pendingLines.length} of {order.lines.length} line item(s) not fully delivered ·{' '}
                {pendingUnits} unit(s) pending
              </div>
            </div>
            <div className="right">
              <div className="small muted">Pending value</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--amber)' }}>{money(pendingTotal)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="section-title">Line items</div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Fabric</th>
              <th className="right">Ordered</th>
              <th className="right">Fulfilled</th>
              <th className="right">Pending</th>
              <th className="right">Rate</th>
              <th className="right">Line amount</th>
              <th className="right">Pending value</th>
              <th>Commission</th>
              <th>Line status</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => {
              const pq = linePendingQty(l)
              const pv = linePendingAmount(l)
              return (
                <tr key={l.id}>
                  <td>{l.desc}</td>
                  <td className="num">{l.qty} {l.unit}</td>
                  <td className="num">{l.qtyFulfilled} {l.unit}</td>
                  <td className="num">
                    {pq > 0 ? <strong style={{ color: 'var(--amber)' }}>{pq} {l.unit}</strong> : <span className="muted">—</span>}
                  </td>
                  <td className="num">{money(l.rate)}</td>
                  <td className="num">{money(lineAmount(l))}</td>
                  <td className="num">
                    {pv > 0 ? <strong style={{ color: 'var(--amber)' }}>{money(pv)}</strong> : <span className="muted">—</span>}
                  </td>
                  <td><CommissionTermLabel term={l.commission} /></td>
                  <td><StatusBadge status={orderLineStatus(l)} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="section-title">Linked invoices <span className="muted small">(many-to-many)</span></div>
      <div className="card">
        {invoices.length === 0 ? (
          <Empty>No invoices bill this order yet.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th className="right">Billed from this order</th>
                <th className="right">Invoice total</th>
                <th className="right">Paid</th>
                <th className="right">Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const pos = invoicePosition(state, inv)
                const billedHere = inv.lines
                  .filter((il) => il.orderId === order.id)
                  .reduce((s, il) => s + il.amount, 0)
                return (
                  <tr key={inv.id} className="clickable" onClick={() => nav(`/invoices/${inv.id}`)}>
                    <td><span className="tag-link">{inv.id}</span></td>
                    <td className="muted">{fmtDate(inv.date)}</td>
                    <td className="num">{money(billedHere)}</td>
                    <td className="num">{money(pos.amount)}</td>
                    <td className="num">{money(pos.paid)}</td>
                    <td className="num">{money(pos.balance)}</td>
                    <td><StatusBadge status={pos.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
