import { useState } from 'react'
import MastersLayout from './MastersLayout.jsx'
import { Modal } from '../../components/ui.jsx'
import { useData } from '../../store/DataContext.jsx'

const blank = { name: '', contact: '', location: '', creditTermsDays: 30 }

export default function Customers() {
  const { state, addCustomer, updateCustomer, nextMasterId } = useData()
  const [editing, setEditing] = useState(null) // null | 'new' | id
  const [form, setForm] = useState(blank)

  const openNew = () => { setForm(blank); setEditing('new') }
  const openEdit = (c) => { setForm({ ...c }); setEditing(c.id) }
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const valid = form.name.trim() && Number(form.creditTermsDays) >= 0

  const save = () => {
    const payload = { ...form, creditTermsDays: Number(form.creditTermsDays) }
    if (editing === 'new') addCustomer({ ...payload, id: nextMasterId(state.customers, 'C', 1) })
    else updateCustomer(editing, payload)
    setEditing(null)
  }

  return (
    <MastersLayout actions={<button className="btn btn-primary" onClick={openNew}>+ Add Customer</button>}>
      <div className="card">
        <table>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Contact</th><th>Location</th><th className="right">Credit terms</th><th></th></tr>
          </thead>
          <tbody>
            {state.customers.map((c) => (
              <tr key={c.id}>
                <td className="mono">{c.id}</td>
                <td><strong>{c.name}</strong></td>
                <td>{c.contact}</td>
                <td className="muted">{c.location}</td>
                <td className="num">{c.creditTermsDays} days</td>
                <td className="right"><button className="btn-link" onClick={() => openEdit(c)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add Customer' : `Edit ${form.name}`}
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
          <div className="field">
            <label className="lbl">Default credit terms (days) — drives due date &amp; aging</label>
            <input type="number" value={form.creditTermsDays} onChange={(e) => set({ creditTermsDays: e.target.value })} />
          </div>
        </Modal>
      )}
    </MastersLayout>
  )
}
