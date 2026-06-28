import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { useData } from '../../store/DataContext.jsx'
import { lineAmount } from '../../lib/commission.js'
import { money } from '../../lib/format.js'

const blankLine = () => ({
  desc: '', unit: 'm', qty: '', rate: '',
  commissionType: 'percent', commissionValue: '',
})

export default function NewOrder() {
  const nav = useNavigate()
  const { state, addOrder, nextOrderId, manufacturer } = useData()

  const [customerId, setCustomerId] = useState(state.customers[0]?.id || '')
  const [manufacturerId, setManufacturerId] = useState(state.manufacturers[0]?.id || '')
  const [date, setDate] = useState('2026-06-28')
  const [lines, setLines] = useState([blankLine()])

  const setLine = (i, patch) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)))
  const addLine = () => setLines((ls) => [...ls, blankLine()])
  const removeLine = (i) => setLines((ls) => (ls.length > 1 ? ls.filter((_, j) => j !== i) : ls))

  // Convenience: prefill commission from the selected vendor's default.
  const applyVendorDefault = (mid) => {
    setManufacturerId(mid)
    const def = manufacturer(mid)?.defaultCommission
    if (def) {
      setLines((ls) => ls.map((l) => ({
        ...l,
        commissionType: def.type,
        commissionValue: l.commissionValue === '' ? String(def.value) : l.commissionValue,
      })))
    }
  }

  const total = lines.reduce((s, l) => s + lineAmount({ qty: Number(l.qty), rate: Number(l.rate) }), 0)

  const valid =
    customerId && manufacturerId &&
    lines.every((l) => l.desc && Number(l.qty) > 0 && Number(l.rate) > 0 && l.commissionValue !== '')

  const save = () => {
    const id = nextOrderId()
    addOrder({
      id, customerId, manufacturerId, date,
      lines: lines.map((l, i) => ({
        id: `${id}-L${i + 1}`,
        desc: l.desc,
        unit: l.unit,
        qty: Number(l.qty),
        qtyFulfilled: 0, // new orders start unfulfilled => status New
        rate: Number(l.rate),
        commission: { type: l.commissionType, value: Number(l.commissionValue) },
      })),
    })
    nav(`/orders/${id}`)
  }

  return (
    <Layout
      title="New Order"
      crumb={<Link to="/orders" className="tag-link">Orders</Link>}
      actions={<button className="btn" onClick={() => nav('/orders')}>Cancel</button>}
    >
      <div className="card card-pad mb">
        <div className="form-grid">
          <div className="field">
            <label className="lbl">Customer (buyer)</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {state.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="lbl">Manufacturer (vendor)</label>
            <select value={manufacturerId} onChange={(e) => applyVendorDefault(e.target.value)}>
              {state.manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="lbl">Order date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="section-title">Line items &amp; commission</div>
      {lines.map((l, i) => (
        <div className="linebox" key={i}>
          <div className="flex between mb">
            <strong>Line {i + 1}</strong>
            {lines.length > 1 && (
              <button className="btn-link" onClick={() => removeLine(i)}>Remove</button>
            )}
          </div>
          <div className="form-grid">
            <div className="field full">
              <label className="lbl">Fabric description</label>
              <input value={l.desc} placeholder="e.g. Banarasi Silk" onChange={(e) => setLine(i, { desc: e.target.value })} />
            </div>
            <div className="field">
              <label className="lbl">Quantity</label>
              <input type="number" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
            </div>
            <div className="field">
              <label className="lbl">Unit</label>
              <select value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>
                <option value="m">metres</option>
                <option value="rolls">rolls</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">Rate (per unit)</label>
              <input type="number" value={l.rate} onChange={(e) => setLine(i, { rate: e.target.value })} />
            </div>
            <div className="field">
              <label className="lbl">Line amount</label>
              <input value={money(lineAmount({ qty: Number(l.qty), rate: Number(l.rate) }))} disabled />
            </div>
            <div className="field">
              <label className="lbl">Commission type</label>
              <select value={l.commissionType} onChange={(e) => setLine(i, { commissionType: e.target.value })}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">{l.commissionType === 'fixed' ? 'Commission amount (₹)' : 'Commission rate (%)'}</label>
              <input type="number" value={l.commissionValue} onChange={(e) => setLine(i, { commissionValue: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      <button className="btn mb" onClick={addLine}>+ Add line</button>

      <div className="card card-pad flex between">
        <div className="muted">Total order value: <strong style={{ color: 'var(--text)' }}>{money(total)}</strong></div>
        <button className="btn btn-primary" disabled={!valid} onClick={save}>Save order</button>
      </div>
    </Layout>
  )
}
