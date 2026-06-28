import { useState } from 'react'
import MastersLayout from './MastersLayout.jsx'
import { Modal, CommissionTermLabel } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'
import { money } from '../../lib/format.js'

const blank = { name: '', unit: 'm', defaultRate: '', commissionType: 'percent', commissionValue: 4 }

export default function Items() {
  const { state, addItem, updateItem, nextMasterId } = useData()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)

  const openNew = () => { setForm(blank); setEditing('new') }
  const openEdit = (it) => {
    setForm({
      name: it.name, unit: it.unit, defaultRate: it.defaultRate,
      commissionType: it.defaultCommission?.type || 'percent',
      commissionValue: it.defaultCommission?.value ?? 0,
    })
    setEditing(it.id)
  }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const valid = form.name.trim() && Number(form.defaultRate) > 0 && form.commissionValue !== ''

  const save = () => {
    const payload = {
      name: form.name, unit: form.unit, defaultRate: Number(form.defaultRate),
      defaultCommission: { type: form.commissionType, value: Number(form.commissionValue) },
    }
    if (editing === 'new') addItem({ ...payload, id: nextMasterId(state.items, 'IT-') })
    else updateItem(editing, payload)
    setEditing(null)
  }

  return (
    <MastersLayout actions={<button className="btn btn-primary" onClick={openNew}>+ Add Item</button>}>
      <div className="card">
        <table>
          <thead>
            <tr><th>ID</th><th>Fabric / item</th><th>Unit</th><th className="right">Default rate</th><th>Default commission</th><th></th></tr>
          </thead>
          <tbody>
            {state.items.map((it) => (
              <tr key={it.id}>
                <td className="mono">{it.id}</td>
                <td><strong>{it.name}</strong></td>
                <td>{it.unit}</td>
                <td className="num">{money(it.defaultRate)}</td>
                <td><CommissionTermLabel term={it.defaultCommission} /></td>
                <td className="right"><button className="btn-link" onClick={() => openEdit(it)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Item' : `Edit ${form.name}`}
          onClose={() => setEditing(null)}
          onSave={save}
          canSave={valid}
        >
          <div className="field mb">
            <label className="lbl">Fabric / item name</label>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Banarasi Silk" />
          </div>
          <div className="form-grid mb">
            <div className="field">
              <label className="lbl">Unit</label>
              <select value={form.unit} onChange={(e) => set({ unit: e.target.value })}>
                <option value="m">metres</option>
                <option value="rolls">rolls</option>
                <option value="kg">kg</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">Default rate (₹ per unit)</label>
              <input type="number" value={form.defaultRate} onChange={(e) => set({ defaultRate: e.target.value })} />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label className="lbl">Default commission type</label>
              <select value={form.commissionType} onChange={(e) => set({ commissionType: e.target.value })}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <div className="field">
              <label className="lbl">{form.commissionType === 'fixed' ? 'Amount (₹)' : 'Rate (%)'}</label>
              <input type="number" value={form.commissionValue} onChange={(e) => set({ commissionValue: e.target.value })} />
            </div>
          </div>
        </Modal>
      )}
    </MastersLayout>
  )
}
