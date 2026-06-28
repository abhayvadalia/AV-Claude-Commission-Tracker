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

      addPayment: (payment) =>
        setState((s) => ({ ...s, payments: [...s.payments, payment] })),

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
