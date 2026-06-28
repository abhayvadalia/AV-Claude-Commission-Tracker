# CLAUDE.md — PrismBridge

Guidance for Claude (and humans) working in this repository. Read this before making changes.

## What this is

**PrismBridge** — _"Clear view. Connected control."_ — a distributor-side fabric **commission tracker**.
A fabric distributor sits between **manufacturers (vendors)** and **customers (buyers)**. The distributor
earns **commission from the manufacturer**, and that commission is earned **only when the customer pays**.
The app tracks the full chain: Order → Invoice → Payment → Commission → Settlement, with full traceability.

Owned by **KRUXIN Global**. Reference deployment: https://prismbridge.vercel.app
A full spec lives in `PrismBridge_SRS.docx`; a one-page overview in `PrismBridge_Demo_Guide.docx`.

## Current state vs target

- **Current (prototype):** React + Vite SPA. All data is **seeded in memory** (`src/data/seed.js`) and held in
  React state (`src/store/DataContext.jsx`). Commission accruals are **computed live on the client**
  (`src/lib/commission.js`). No backend, no auth, no persistence. "Today" is hardcoded to `2026-06-28`.
- **Target (production):** Persist to **Postgres via Supabase** (auth + RLS + storage), move the commission
  engine to an authoritative layer (SQL function/view or a tested service), add auth. The React UI stays
  largely as-is; the in-memory store is swapped for data calls module by module.

When asked to "build the real app," follow the phased plan in the section **Production roadmap** below.

## Tech stack

- React 18, React Router 6 (`BrowserRouter`), Vite 5.
- Plain CSS with CSS variables in `src/index.css` (no Tailwind, no CSS-in-JS).
- No chart library — charts are hand-rolled inline SVG in `src/components/Charts.jsx`.
- Single in-memory store via React Context (`src/store/DataContext.jsx`).
- Hosting: Vercel (Vite auto-detected). `vercel.json` rewrites all routes to `/index.html` (SPA fallback).
- Git + Vercel already configured; pushes to `main` auto-deploy.

## Project structure

```
src/
  main.jsx              bootstraps React, Router, DataProvider
  App.jsx               route table
  index.css             design tokens + all styles
  data/seed.js          seeded master & transactional data
  store/DataContext.jsx in-memory store, actions, computed accruals selector
  lib/commission.js     pure business logic: status, aging, allocation, accrual engine
  lib/format.js         money/date helpers; fixed "today"
  lib/version.js        app name, tagline, version, vendor (footer/sidebar)
  components/           Layout, ui (badges/tiles/modal), Charts, SettleModal
  pages/Dashboard.jsx
  pages/orders/         OrderList, NewOrder, OrderDetail, FulfilOrder
  pages/payments/       InvoiceList, AddInvoice, InvoiceDetail
  pages/commissions/    CommissionList, CommissionDetail
  pages/masters/        MastersLayout, Customers, Manufacturers, Items
```

## Routes

| Path | Screen |
|---|---|
| `/` | Dashboard |
| `/orders`, `/orders/new`, `/orders/:id`, `/orders/:id/fulfil` | Orders |
| `/invoices`, `/invoices/new`, `/invoices/:id` | Payments |
| `/commissions`, `/commissions/:id` | Commissions |
| `/masters` → `/masters/customers` \| `/manufacturers` \| `/items` | Masters |
| `*` | redirect to `/` |

## Data model

Entities: **Manufacturer, Customer, Item** (masters); **Order → OrderLine**; **Invoice → InvoiceLine**;
**Payment**; **CommissionAccrual** (derived, not stored); **Settlement** (map keyed by accrual id).

Relationships:
- Manufacturer 1—∞ Order; Customer 1—∞ Order. An order is always exactly one customer + one manufacturer.
- Order 1—∞ OrderLine.
- **Order ∞—∞ Invoice**, realised through InvoiceLine. Each InvoiceLine = `{ orderId, orderLineId, amount }`,
  billing a portion of one order line. This enables bundling many orders on one invoice AND splitting one
  order across many invoices.
- Invoice 1—∞ Payment.
- Payment 1—∞ CommissionAccrual (one per underlying order line).
- Item 0..1—∞ OrderLine (an order line may be prefilled from a catalog item).

Key fields (see `src/data/seed.js` and the SRS for the complete list):
- OrderLine: `qty`, `qtyFulfilled`, `rate`, `commission: { type: 'percent'|'fixed', value }`.
- Invoice: `date`, `dueDate` (= invoice date + customer credit terms), `lines[]`.
- Payment: `invoiceId`, `date`, `amount`, `mode`, `reference`.

## Business rules (authoritative — keep these exact)

**Order status** (derived from fulfilment across all lines):
`New` (fulfilled = 0) · `Partially Fulfilled` (0 < fulfilled < ordered) · `Completed` (fulfilled ≥ ordered).

**Invoice status** (derived from payments): `New` (paid = 0) · `Partially Paid` (paid > 0, balance > 0) ·
`Paid` (balance = 0). Balance = max(0, amount − paid).

**Aging** (only when balance > 0; days = dueDate → today):
`Not due` (≤0) · `0–30` · `31–60` · `61–90` · `90+` days past due.

**Commission engine** (`computeAccruals`): for each payment `P` on invoice total `T`, paid fraction `f = P / T`.
For every invoice line (which bills `amount` of one order line):
- basis (apportioned paid) = `invoiceLine.amount × f`
- percent commission = `basis × rate / 100`
- fixed commission = `fixedValue × (invoiceLine.amount / orderLineAmount) × f`
- one accrual per `(payment, orderLine)`, id = `` `${paymentId}#${orderLineId}` ``.
Commission terms are read from the **order line** (authoritative); the invoice only references which line and how
much. Partial payments → partial commission.

**Fulfilment → invoicing:** updating fulfilment is the only way `qtyFulfilled` increases, and it **always raises an
invoice** for the newly-fulfilled value (lines bill `nowQty × rate`, commission inherited). Done atomically.

**Settlement:** an `Earned` accrual becomes `Settled` by recording `{ date, reference }` into the settlements map
(bulk-capable). Clearing reverts to `Earned`. Settlement is a status + reference only — **not** a cash ledger.

**ID generation:** Order `ORD-####` (from 1000), Payment `PMT-####` (from 5000), Customer `C#`, Manufacturer `M#`,
Item `IT-##` (zero-padded), OrderLine `{orderId}-L{n}`, Invoice = user-entered number, Accrual `{paymentId}#{orderLineId}`.

## Commission regression fixtures (must not break)

From the seeded data these exact accruals must hold (use as tests):

| Accrual | Basis | Term | Earned | Status |
|---|---|---|---|---|
| PMT-5001#ORD-1001-L1 | 110000 | 4% | 4400.00 | Settled |
| PMT-5001#ORD-1001-L2 | 54000 | 4% | 2160.00 | Settled |
| PMT-5002#ORD-1002-L1 | 60000 | 3% | 1800.00 | Earned |
| PMT-5003#ORD-1003-L1 | 84000 | fixed ₹3000 | 3000.00 | Earned |
| PMT-5003#ORD-1010-L1 | 52000 | fixed ₹2000 | 2000.00 | Earned |
| PMT-5004#ORD-1004-L1 | 56291.39 | 5% | 2814.57 | Earned |
| PMT-5004#ORD-1004-L2 | 43708.61 | 5% | 2185.43 | Earned |
| PMT-5005#ORD-1006-L1 | 70000 | fixed ₹4500 | 2692.31 | Earned |

(INV-E-3310 bundles two orders; ORD-1002 is split across two invoices; INV-E-3320 is a partial payment.)

## Conventions

- **Money:** the prototype uses plain rupee numbers. In the **production/database build, store money as integer
  paise** and only format to ₹ at the edge. Never compare/aggregate floats for money.
- **Transactions:** multi-write operations (fulfilment+invoice, payment+accrual) must be atomic.
- **Dates:** ISO `YYYY-MM-DD` strings; display via `lib/format.js`. Replace the hardcoded `today()` with the
  system clock when going to production.
- **Business logic stays pure** in `lib/commission.js` (or its server equivalent) — no UI imports. Screens call it.
- **Status/term strings are domain contracts** — don't rename `'percent'`/`'fixed'`, `'Earned'`/`'Settled'`, or
  the status labels without updating every consumer and the fixtures.
- **Styling:** use existing CSS tokens/classes in `index.css` (tiles, badges `b-*`, tables, `cell-main`/`cell-sub`).
  Status→colour: New=neutral, Partial=amber, Completed/Paid/Settled=green, Earned=indigo, critical aging=red.
- **No browser storage APIs** in prototype code.

## Production roadmap (when building the real app)

Use **Supabase (Postgres)** via the Vercel Marketplace (managed Postgres + Auth + RLS + storage).
Phases, each as small reviewable PRs:
0. Foundation: env setup, `.env.example`, ESLint/Prettier, Vitest.
1. Schema + migrations from the data model; port seed as a seed script.
2. Commission engine as source of truth (SQL function/view or tested service) — port `commission.js`, seed the
   fixtures above as unit tests **before** any UI rewiring.
3. Replace `DataContext` actions with Supabase calls, one module at a time (Masters → Orders → Payments → Commissions).
4. Supabase Auth + row-level security (single distributor now; multi-tenant ready).
5. Hardening: server-side validation, optimistic UI + rollback, audit fields, real `today`, empty/error states.

## Commands

```bash
npm install        # install deps
npm run dev        # Vite dev server (http://localhost:5173)
npm run build      # production build -> dist/
npm run preview    # preview the build
node verify.mjs    # sanity-check the commission engine against seed data
```

## Working agreements

- Keep changes **small and single-purpose**; one module or one migration per PR.
- Write/extend **tests alongside** logic changes, not after; the commission fixtures are the acceptance bar.
- After any change, run `npm run build` and (for engine changes) `node verify.mjs`.
- Don't commit `node_modules/`, `dist/`, or build artifacts (see `.gitignore`).
- Pushes to `main` auto-deploy on Vercel; use preview deployments to review UI PRs visually.
