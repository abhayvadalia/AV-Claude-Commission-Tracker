import { useState } from 'react'
import MastersLayout from './MastersLayout.jsx'
import { Modal, CommissionTermLabel } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'

const blank = { name: '', contact: '', location: '', commissionType: 'percent', commissionValue: 4 }

export default function Manufacturers() {
  const { state, addManufacturer, updateManufacturer, nextMasterId } = useData()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blank)

  const openNew = () => { setForm(blank); setEditing('new') }
  const openEdit = (m) => {
    setForm({
      name: m.name, contact: m.contact, location: m.location,
      commissionType: m.defaultCommission?.type || 'percent',
      commissionValue: m.defaultCommission?.value ?? 0,
    })
    setEditing(m.id)
  }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const valid = form.name.trim() && form.commissionValue !== '' && Number(form.commissionValue) >= 0

  const save = () => {
    const payload = {
      name: form.name, contact: form.contact, location: form.location,
      defaultCommission: { type: form.commissionType, value: Number(form.commissionValue) },
    }
    if (editing === 'new') addManufacturer({ ...payload, id: nextMasterId(state.manufacturers, 'M', 1) })
    else updateManufacturer(editing, payload)
    setEditing(null)
  }

  return (
    <MastersLayout actions={<button className="btn btn-primary" onClick={openNew}>+ Add Manufacturer</button>}>
      <div className="card">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Contact</th><th>Location</th><th>Default commission</th><th></th></tr>
          </thead>
          <tbody>
            {state.manufacturers.map((m) => (
              <tr key={m.id}>
                <td className="mono">{m.id}</td>
                <td><strong>{m.name}</strong></td>
                <td>{m.contact}</td>
                <td className="muted">{m.location}</td>
                <td><CommissionTermLabel term={m.defaultCommission} /></td>
                <td className="right"><button className="btn-link" onClick={() => openEdit(m)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Manufacturer' : `Edit ${form.name}`}
          onClose={() => setEditing(null)}
          onSave={save}
          canSave={valid}
        >
          <div className="field mb">
            <label className="lbl">Name</label>
            <input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>
          <div className="field mb">
            <label className="lbl">Contact person</label>
            <input value={form.contact} onChange={(e) => set({ contact: e.target.value })} />
          </div>
          <div className="field mb">
            <label className="lbl">Location</label>
            <input value={form.location} onChange={(e) => set({ location: e.target.value })} />
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
