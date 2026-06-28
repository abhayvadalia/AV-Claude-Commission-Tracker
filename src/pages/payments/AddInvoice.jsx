import { useState, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { CommissionTermLabel } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import { lineAmount } from '../../lib/commission.js'
import { money, addDays } from '../../lib/format.js'

export default function AddInvoice() {
  const nav = useNavigate()
  const { state, addInvoice, customer } = useData()

  const [manufacturerId, setManufacturerId] = useState(state.manufacturers[0]?.id || '')
  const [customerId, setCustomerId] = useState(state.customers[0]?.id || '')
  const [invId, setInvId] = useState('')
  const [date, setDate] = useState('2026-06-28')
  // selected order lines -> billed amount
  const [picked, setPicked] = useState({}) // { orderLineId: { orderId, amount } }

  const cust = customer(customerId)
  const dueDate = useMemo(() => addDays(date, cust?.creditTermsDays || 30), [date, cust])

  // Eligible order lines: orders matching the chosen manufacturer + customer.
  const eligible = useMemo(() => {
    const out = []
    state.orders
      .filter((o) => o.manufacturerId === manufacturerId && o.customerId === customerId)
      .forEach((o) => {
        o.lines.forEach((l) => {
          // amount already billed for this order line across existing invoices
          const billed = state.invoices.reduce(
            (s, inv) => s + inv.lines.filter((il) => il.orderLineId === l.id).reduce((x, il) => x + il.amount, 0),
            0,
          )
          const remaining = Math.max(0, lineAmount(l) - billed)
          out.push({ order: o, line: l, lineAmt: lineAmount(l), billed, remaining })
        })
      })
    return out
  }, [state, manufacturerId, customerId])

  const toggle = (row) => {
    setPicked((p) => {
      const next = { ...p }
      if (next[row.line.id]) delete next[row.line.id]
      else next[row.line.id] = { orderId: row.order.id, amount: row.remaining || row.lineAmt }
      return next
    })
  }
  const setAmt = (lineId, orderId, amount) =>
    setPicked((p) => ({ ...p, [lineId]: { orderId, amount } }))

  const total = Object.values(picked).reduce((s, v) => s + (Number(v.amount) || 0), 0)
  const valid = manufacturerId && customerId && invId.trim() && Object.keys(picked).length > 0 && total > 0

  const save = () => {
    addInvoice({
      id: invId.trim(),
      manufacturerId,
      customerId,
      date,
      dueDate,
      lines: Object.entries(picked).map(([orderLineId, v]) => ({
        orderId: v.orderId,
        orderLineId,
        amount: Number(v.amount),
      })),
    })
    nav(`/invoices/${encodeURIComponent(invId.trim())}`)
  }

  return (
    <Layout
      title="Add Invoice"
      crumb={<Link to="/invoices" className="tag-link">Payments</Link>}
      actions={<button className="btn" onClick={() => nav('/invoices')}>Cancel</button>}
    >
      <div className="card card-pad mb">
        <div className="form-grid">
          <div className="field">
            <label className="lbl">Manufacturer (raises invoice)</label>
            <select value={manufacturerId} onChange={(e) => { setManufacturerId(e.target.value); setPicked({}) }}>
              {state.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="lbl">Customer (owes)</label>
            <select value={customerId} onChange={(e) => { setCustomerId(e.target.value); setPicked({}) }}>
              {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="lbl">Invoice number</label>
            <input value={invId} onChange={(e) => setInvId(e.target.value)} placeholder="e.g. INV-S-2241" />
          </div>
          <div className="field">
            <label className="lbl">Invoice date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field">
            <label className="lbl">Due date <span className="muted small">(auto: {cust?.creditTermsDays}d terms)</span></label>
            <input type="date" value={dueDate} disabled />
          </div>
        </div>
      </div>

      <div className="section-title">Select order line(s) to bill <span className="muted small">— an invoice can bundle multiple orders</span></div>
      <div className="card mb">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Order</th>
              <th>Fabric line</th>
              <th>Commission (from order)</th>
              <th className="right">Line value</th>
              <th className="right">Already billed</th>
              <th className="right">Bill now</th>
            </tr>
          </thead>
          <tbody>
            {eligible.length === 0 && (
              <tr><td colSpan={7} className="empty">No orders for this manufacturer + customer pair. Create an order first.</td></tr>
            )}
            {eligible.map((row) => {
              const sel = picked[row.line.id]
              return (
                <tr key={row.line.id}>
                  <td><input type="checkbox" style={{ width: 'auto' }} checked={!!sel} onChange={() => toggle(row)} /></td>
                  <td>{row.order.id}</td>
                  <td>{row.line.desc}</td>
                  <td><CommissionTermLabel term={row.line.commission} /></td>
                  <td className="num">{money(row.lineAmt)}</td>
                  <td className="num muted">{money(row.billed)}</td>
                  <td className="num">
                    {sel ? (
                      <input
                        type="number"
                        style={{ width: 120, textAlign: 'right' }}
                        value={sel.amount}
                        onChange={(e) => setAmt(row.line.id, row.order.id, e.target.value)}
                      />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="muted small mb">
        Commission terms are inherited from the originating order line (the authoritative source per the model).
        Capture at invoice time is a convenience that reconciles back to the linked order(s).
      </p>

      <div className="card card-pad flex between">
        <div className="muted">Invoice total: <strong style={{ color: 'var(--text)' }}>{money(total)}</strong></div>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>Save invoice</button>
      </div>
    </Layout>
  )
}
