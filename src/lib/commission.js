// Core business logic for the Fabric Commission Tracker.
// Pure functions over the data state — used by the store and the screens.

import { today, daysBetween } from './format.js'

// ---- Lookups -------------------------------------------------------------

export const byId = (arr, id) => arr.find((x) => x.id === id)

export const lineAmount = (line) => (Number(line.qty) || 0) * (Number(line.rate) || 0)

export const orderTotal = (order) => order.lines.reduce((s, l) => s + lineAmount(l), 0)

export const invoiceAmount = (inv) => inv.lines.reduce((s, l) => s + (Number(l.amount) || 0), 0)

// ---- Order status (derived from line fulfilment) -------------------------

export const orderLineStatus = (line) => {
  const f = Number(line.qtyFulfilled) || 0
  if (f <= 0) return 'New'
  if (f < line.qty) return 'Partially Fulfilled'
  return 'Completed'
}

export const orderStatus = (order) => {
  const total = order.lines.reduce((s, l) => s + (Number(l.qty) || 0), 0)
  const done = order.lines.reduce((s, l) => s + Math.min(Number(l.qtyFulfilled) || 0, l.qty), 0)
  if (done <= 0) return 'New'
  if (done >= total) return 'Completed'
  return 'Partially Fulfilled'
}

// ---- Invoice payment position --------------------------------------------

export const invoicePaid = (state, invoiceId) =>
  state.payments.filter((p) => p.invoiceId === invoiceId).reduce((s, p) => s + (Number(p.amount) || 0), 0)

export const invoicePosition = (state, inv) => {
  const amount = invoiceAmount(inv)
  const paid = invoicePaid(state, inv.id)
  const balance = Math.max(0, amount - paid)
  let status = 'New'
  if (paid <= 0) status = 'New'
  else if (balance <= 0.0001) status = 'Paid'
  else status = 'Partially Paid'
  return { amount, paid, balance, status }
}

// ---- Aging ---------------------------------------------------------------

export const agingDays = (inv, balance) => {
  if (balance <= 0) return 0 // fully settled, no aging
  const d = daysBetween(inv.dueDate, today())
  return d // negative => not yet due
}

export const agingBucket = (days, balance) => {
  if (balance <= 0) return { label: 'Settled', cls: 'b-paid', sort: -2 }
  if (days <= 0) return { label: 'Not due', cls: 'b-new', sort: -1 }
  if (days <= 30) return { label: '0–30 days', cls: 'b-partial', sort: 1 }
  if (days <= 60) return { label: '31–60 days', cls: 'b-partial', sort: 2 }
  if (days <= 90) return { label: '61–90 days', cls: 'b-crit', sort: 3 }
  return { label: '90+ days', cls: 'b-crit', sort: 4 }
}

// ---- Commission engine ---------------------------------------------------
// When a payment is recorded against an invoice, we apportion the paid amount
// across the invoice's lines (each line bills a portion of one order line),
// then apply each order line's commission term.
//
// For a payment of P on an invoice of total T (fraction f = P / T):
//   apportioned paid to invoice line = lineBilled * f          (proportional by value)
//   percent commission = apportionedPaid * rate / 100
//   fixed commission   = fixedValue * (lineBilled / orderLineAmount) * f   (pro-rated)
//
// One accrual is produced per (payment, order line) for full traceability.

export const accrualId = (paymentId, orderLineId) => `${paymentId}#${orderLineId}`

export const computeAccruals = (state) => {
  const accruals = []
  const settled = new Set(state.settledAccrualIds || [])

  for (const pmt of state.payments) {
    const inv = byId(state.invoices, pmt.invoiceId)
    if (!inv) continue
    const total = invoiceAmount(inv)
    if (total <= 0) continue
    const f = (Number(pmt.amount) || 0) / total

    for (const il of inv.lines) {
      const order = byId(state.orders, il.orderId)
      if (!order) continue
      const oline = order.lines.find((l) => l.id === il.orderLineId)
      if (!oline) continue

      const apportionedPaid = (Number(il.amount) || 0) * f
      const term = oline.commission || { type: 'percent', value: 0 }
      let earned = 0
      if (term.type === 'fixed') {
        const olAmt = lineAmount(oline) || 1
        earned = term.value * ((Number(il.amount) || 0) / olAmt) * f
      } else {
        earned = apportionedPaid * (term.value / 100)
      }

      const id = accrualId(pmt.id, oline.id)
      accruals.push({
        id,
        paymentId: pmt.id,
        invoiceId: inv.id,
        orderId: order.id,
        orderLineId: oline.id,
        manufacturerId: inv.manufacturerId,
        customerId: inv.customerId,
        basisAmount: apportionedPaid,
        commissionType: term.type,
        commissionValue: term.value,
        earned,
        status: settled.has(id) ? 'Settled' : 'Earned',
        date: pmt.date,
      })
    }
  }
  return accruals
}

// Invoices that bill a given order (derived many-to-many).
export const invoicesForOrder = (state, orderId) =>
  state.invoices.filter((inv) => inv.lines.some((l) => l.orderId === orderId))

// Orders billed by a given invoice (derived many-to-many).
export const ordersForInvoice = (state, inv) =>
  [...new Set(inv.lines.map((l) => l.orderId))].map((oid) => byId(state.orders, oid)).filter(Boolean)
