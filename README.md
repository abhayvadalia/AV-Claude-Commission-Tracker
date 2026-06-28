# Fabric Commission Tracker — Prototype

A clickable, data-backed prototype of the distributor-side commission model described in
*Fabric_Commission_Tracker_Understanding.docx*. Built with React + Vite. All data is seeded
in-memory; changes you make (new orders, invoices, payments) live for the session.

## Run it

```bash
npm install
npm run dev      # opens http://localhost:5173
```

Build a static version with `npm run build` (output in `dist/`), preview with `npm run preview`.

## The three modules

**Orders** — list (filter by status, search), detail (header, line items with per-line
commission and fulfilment status, linked invoices), and a *New Order* punch-in flow that
captures commission (% or fixed) per line. Order status is derived from line fulfilment
(New / Partially Fulfilled / Completed).

**Payments** — filterable, sortable invoice list with live summary tiles (Total Invoiced,
Received, Outstanding, Overdue) that recalculate with the filters. Defaults to open exposure
(New + Partially Paid), sorted by aging descending. Aging buckets: Not due / 0–30 / 31–60 /
61–90 / 90+. Invoice detail shows linked orders, payment history, aging, and the commission
each payment generated. *Record Payment* and *Add Invoice* flows are functional.

**Commissions** — one row per accrual, with totals for earned / settled / pending. The detail
screen renders the full traceability chain: **Customer (payer) → Payment → Invoice →
Order/line → Manufacturer (source)**, plus basis amount, commission type, rate/value and the
computed earned amount.

## The core mechanic

Commission is earned **only when a customer pays**, and is apportioned because orders and
invoices are many-to-many:

1. Each invoice line bills a portion of one order line (so an invoice can bundle several
   orders, and an order can be split across several invoices).
2. A payment of `P` on an invoice of total `T` applies fraction `f = P / T` to each invoice line.
3. Per line: percentage commission = `apportioned paid × rate%`; fixed commission =
   `fixed value × (line billed / order-line value) × f` (pro-rated).
4. One **commission accrual** is written per (payment, order line) — carrying the payment,
   invoice, order and line references for full audit.

Partial payments therefore produce partial commission. Accruals are computed live from
payments (`src/lib/commission.js`), so recording a new payment immediately produces new
commission rows.

### Seeded examples that demonstrate the model
- **INV-E-3310** bundles two orders (ORD-1003 + ORD-1010) → one payment spreads commission
  across both orders.
- **ORD-1002** is billed across two invoices (INV-B-7741 + INV-B-7742).
- Partial payments on INV-B-7741, INV-E-3320, INV-K-9001 → partial, pro-rated commission.
- All three statuses appear in every module.

## Project structure

```
src/
  data/seed.js            seeded master data, orders, invoices, payments
  lib/commission.js       business logic: status, aging, allocation, accruals
  lib/format.js           money/date helpers ("today" fixed at 2026-06-28)
  store/DataContext.jsx   in-memory store + actions
  components/             Layout, shared UI (badges, tiles)
  pages/orders|payments|commissions/
```

## Prototype assumptions (per the doc)
Single distributor user; manufacturers/customers are master data, not logins. Allocation is
proportional by line value. Currency (INR) and units assumed consistent. Taxes, returns/credit
notes, multi-currency and the manufacturer→distributor settlement workflow are out of scope
(settlement is tracked as a status only).
