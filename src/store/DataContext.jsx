import { createContext, useContext, useMemo, useState } from 'react'
import { seed } from '../data/seed.js'
import { computeAccruals, byId } from '../lib/commission.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [state, setState] = useState(() => seed())

  const api = useMemo(() => {
    const manufacturer = (id) => byId(state.manufacturers, id)
    const customer = (id) => byId(state.customers, id)

    return {
      state,
      manufacturer,
      customer,
      manufacturerName: (id) => manufacturer(id)?.name || id,
      customerName: (id) => customer(id)?.name || id,

      accruals: computeAccruals(state),

      addOrder: (order) =>
        setState((s) => ({ ...s, orders: [order, ...s.orders] })),

      addInvoice: (invoice) =>
        setState((s) => ({ ...s, invoices: [invoice, ...s.invoices] })),

      // Atomically record newly-fulfilled quantities on an order AND raise the
      // invoice that bills that newly-fulfilled value (architecture: fulfilment
      // is invoiced, invoice lines reference the order lines, commission inherited).
      fulfilOrder: ({ orderId, fulfilments, invoice }) =>
        setState((s) => ({
          ...s,
          orders: s.orders.map((o) =>
            o.id !== orderId
              ? o
              : {
                  ...o,
                  lines: o.lines.map((l) =>
                    fulfilments[l.id]
                      ? { ...l, qtyFulfilled: Math.min(l.qty, (Number(l.qtyFulfilled) || 0) + Number(fulfilments[l.id])) }
                      : l,
                  ),
                },
          ),
          invoices: invoice ? [invoice, ...s.invoices] : s.invoices,
        })),

      addPayment: (payment) =>
        setState((s) => ({ ...s, payments: [...s.payments, payment] })),

      // ---- Masters CRUD ----
      item: (id) => byId(state.items, id),
      addCustomer: (c) => setState((s) => ({ ...s, customers: [...s.customers, c] })),
      updateCustomer: (id, patch) =>
        setState((s) => ({ ...s, customers: s.customers.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      addManufacturer: (m) => setState((s) => ({ ...s, manufacturers: [...s.manufacturers, m] })),
      updateManufacturer: (id, patch) =>
        setState((s) => ({ ...s, manufacturers: s.manufacturers.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      addItem: (it) => setState((s) => ({ ...s, items: [...s.items, it] })),
      updateItem: (id, patch) =>
        setState((s) => ({ ...s, items: s.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })),

      nextMasterId: (arr, prefix, pad = 2) => {
        const nums = arr.map((x) => parseInt(String(x.id).replace(/\D/g, ''), 10)).filter((n) => !isNaN(n))
        return `${prefix}${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(pad, '0')}`
      },

      nextOrderId: () => {
        const nums = state.orders.map((o) => parseInt(String(o.id).replace(/\D/g, ''), 10)).filter(Boolean)
        return `ORD-${Math.max(1000, ...nums) + 1}`
      },
      nextPaymentId: () => {
        const nums = state.payments.map((p) => parseInt(String(p.id).replace(/\D/g, ''), 10)).filter(Boolean)
        return `PMT-${Math.max(5000, ...nums) + 1}`
      },
    }
  }, [state])

  return <DataContext.Provider value={api}>{children}</DataContext.Provider>
}

export const useData = () => {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
