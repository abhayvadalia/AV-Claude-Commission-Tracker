import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'
import { StatusBadge, KV, Empty } from '../../components/ui.jsx'
import SettleModal from '../../components/SettleModal.jsx'
import { useData } from '../../store/DataContext.jsx'
import { byId, invoicePosition } from '../../lib/commission.js'
import { money, money2, fmtDate } from '../../lib/format.js'

export default function CommissionDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const decoded = decodeURIComponent(id)
  const { accruals, state, manufacturerName, customerName, settleCommissions, clearSettlement } = useData()
  const [settleOpen, setSettleOpen] = useState(false)
  const a = accruals.find((x) => x.id === decoded)

  if (!a) return <Layout title="Commission not found"><Empty>No commission "{decoded}".</Empty></Layout>

  const payment = byId(state.payments, a.paymentId)
  const inv = byId(state.invoices, a.invoiceId)
  const pos = inv ? invoicePosition(state, inv) : null
  const order = byId(state.orders, a.orderId)
  const oline = order?.lines.find((l) => l.id === a.orderLineId)

  return (
    <Layout
      title="Commission Detail"
      crumb={<Link to="/commissions" className="tag-link">Commissions</Link>}
      actions={
        <>
          <button className="btn" onClick={() => nav('/commissions')}>← Back</button>
          {a.status === 'Earned' ? (
            <button className="btn btn-primary" onClick={() => setSettleOpen(true)}>Record Settlement</button>
          ) : (
            <button className="btn" onClick={() => setSettleOpen(true)}>Edit Settlement</button>
          )}
        </>
      }
    >
      {/* Traceability chain: Customer (payer) -> Manufacturer (commission source) */}
      <div className="section-title">Traceability chain</div>
      <div className="chain mb">
        <div className="node">
          <div className="k">Customer (payer)</div>
          <div className="v">{customerName(a.customerId)}</div>
          <div className="sub">pays the invoice</div>
        </div>
        <div className="arrow">→</div>
        <div className="node">
          <div className="k">Payment</div>
          <div className="v">{money(payment?.amount || 0)}</div>
          <div className="sub">{a.paymentId} · {fmtDate(payment?.date)}</div>
        </div>
        <div className="arrow">→</div>
        <div className="node">
          <div className="k">Invoice</div>
          <div className="v">{a.invoiceId}</div>
          <div className="sub">{pos ? `bal ${money(pos.balance)}` : ''}</div>
        </div>
        <div className="arrow">→</div>
        <div className="node">
          <div className="k">Order / line</div>
          <div className="v">{a.orderId}</div>
          <div className="sub">{oline?.desc}</div>
        </div>
        <div className="arrow">→</div>
        <div className="node">
          <div className="k">Manufacturer (source)</div>
          <div className="v">{manufacturerName(a.manufacturerId)}</div>
          <div className="sub">owes commission</div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>Payment</div>
          <div className="detail-grid">
            <KV k="Payment ID">{a.paymentId}</KV>
            <KV k="Date">{fmtDate(payment?.date)}</KV>
            <KV k="Amount">{money(payment?.amount || 0)}</KV>
            <KV k="Mode / reference">{payment?.mode} · {payment?.reference}</KV>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>Invoice</div>
          <div className="detail-grid">
            <KV k="Invoice">
              <Link to={`/invoices/${encodeURIComponent(a.invoiceId)}`} className="tag-link">{a.invoiceId}</Link>
            </KV>
            <KV k="Amount">{pos ? money(pos.amount) : '—'}</KV>
            <KV k="Balance">{pos ? money(pos.balance) : '—'}</KV>
            <KV k="Status">{pos ? <StatusBadge status={pos.status} /> : '—'}</KV>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>Order &amp; line</div>
          <div className="detail-grid">
            <KV k="Order">
              <Link to={`/orders/${a.orderId}`} className="tag-link">{a.orderId}</Link>
            </KV>
            <KV k="Line">{oline?.desc || a.orderLineId}</KV>
            <KV k="Line reference">{a.orderLineId}</KV>
            <KV k="Customer → Manufacturer">{customerName(a.customerId)} → {manufacturerName(a.manufacturerId)}</KV>
          </div>
        </div>

        <div className="card card-pad">
          <div className="section-title" style={{ marginTop: 0 }}>Commission computation</div>
          <div className="detail-grid">
            <KV k="Basis amount (apportioned paid)">{money2(a.basisAmount)}</KV>
            <KV k="Commission type">{a.commissionType === 'fixed' ? 'Fixed' : 'Percentage'}</KV>
            <KV k="Rate / value">
              {a.commissionType === 'fixed' ? `₹${a.commissionValue.toLocaleString('en-IN')} (pro-rated)` : `${a.commissionValue}%`}
            </KV>
            <KV k="Earned commission"><strong style={{ color: 'var(--primary)' }}>{money2(a.earned)}</strong></KV>
            <KV k="Settlement status"><StatusBadge status={a.status} /></KV>
          </div>
        </div>
      </div>

      <div className="section-title">Settlement <span className="muted small">(manufacturer → distributor)</span></div>
      <div className="card card-pad">
        {a.status === 'Settled' ? (
          <div className="flex between">
            <div className="detail-grid" style={{ flex: 1 }}>
              <KV k="Status"><StatusBadge status="Settled" /></KV>
              <KV k="Settled amount">{money2(a.earned)}</KV>
              <KV k="Settlement date">{fmtDate(a.settlement?.date)}</KV>
              <KV k="Reference">{a.settlement?.reference || '—'}</KV>
            </div>
            <div className="flex" style={{ gap: 8 }}>
              <button className="btn btn-sm" onClick={() => setSettleOpen(true)}>Edit</button>
              <button className="btn btn-sm" onClick={() => clearSettlement(a.id)}>Mark unsettled</button>
            </div>
          </div>
        ) : (
          <div className="flex between">
            <div>
              <StatusBadge status="Earned" />
              <span className="muted small" style={{ marginLeft: 10 }}>
                Not yet settled — {money2(a.earned)} pending from {manufacturerName(a.manufacturerId)}.
              </span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setSettleOpen(true)}>Record Settlement</button>
          </div>
        )}
      </div>

      {settleOpen && (
        <SettleModal
          onClose={() => setSettleOpen(false)}
          onConfirm={(detail) => { settleCommissions([a.id], detail); setSettleOpen(false) }}
          amount={a.earned}
          initial={a.status === 'Settled' ? a.settlement : null}
        />
      )}
    </Layout>
  )
}
