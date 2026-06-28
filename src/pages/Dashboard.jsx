import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { Tile, StatusBadge, AgingBadge, Empty } from '../components/ui.jsx'
import { HBarChart, Donut } from '../components/Charts.jsx'
import { useData } from '../store/DataContext.jsx'
import {
  orderStatus, orderTotal, invoicePosition, agingDays, agingBucket,
} from '../lib/commission.js'
import { money, fmtDate } from '../lib/format.js'

export default function Dashboard() {
  const nav = useNavigate()
  const { state, accruals, manufacturerName, customerName } = useData()

  const m = useMemo(() => {
    const invPos = state.invoices.map((inv) => {
      const pos = invoicePosition(state, inv)
      const days = agingDays(inv, pos.balance)
      return { inv, pos, days, bucket: agingBucket(days, pos.balance) }
    })

    const outstanding = invPos.reduce((s, r) => s + r.pos.balance, 0)
    const overdue = invPos.reduce((s, r) => s + (r.days > 0 ? r.pos.balance : 0), 0)
    const invoiced = invPos.reduce((s, r) => s + r.pos.amount, 0)
    const received = invPos.reduce((s, r) => s + r.pos.paid, 0)

    const earned = accruals.reduce((s, a) => s + a.earned, 0)
    const settled = accruals.filter((a) => a.status === 'Settled').reduce((s, a) => s + a.earned, 0)

    // Commission earned by manufacturer
    const byMfr = {}
    accruals.forEach((a) => { byMfr[a.manufacturerId] = (byMfr[a.manufacturerId] || 0) + a.earned })
    const commByMfr = Object.entries(byMfr)
      .map(([id, v]) => ({ label: manufacturerName(id), value: Math.round(v) }))
      .sort((a, b) => b.value - a.value)

    // Outstanding by aging bucket
    const buckets = ['Not due', '0–30 days', '31–60 days', '61–90 days', '90+ days']
    const colors = { 'Not due': '#69707d', '0–30 days': '#c77700', '31–60 days': '#c77700', '61–90 days': '#d23b3b', '90+ days': '#d23b3b' }
    const agingAgg = {}
    invPos.forEach((r) => {
      if (r.pos.balance <= 0) return
      agingAgg[r.bucket.label] = (agingAgg[r.bucket.label] || 0) + r.pos.balance
    })
    const agingData = buckets.filter((b) => agingAgg[b]).map((b) => ({ label: b, value: Math.round(agingAgg[b]), color: colors[b] }))

    const overdueInvoices = invPos
      .filter((r) => r.days > 0 && r.pos.balance > 0)
      .sort((a, b) => b.days - a.days)
      .slice(0, 6)

    const recentPayments = [...state.payments].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)

    const openOrders = state.orders.filter((o) => orderStatus(o) !== 'Completed').length

    return {
      outstanding, overdue, invoiced, received, earned, settled,
      commByMfr, agingData, overdueInvoices, recentPayments, openOrders,
      collectionPct: invoiced > 0 ? Math.round((received / invoiced) * 100) : 0,
    }
  }, [state, accruals])

  return (
    <Layout title="Dashboard" crumb="Overview">
      <div className="dash-tiles">
        <Tile label="Total Orders" value={state.orders.length} accent="primary" />
        <Tile label="Open Orders" value={m.openOrders} accent="amber" />
        <Tile label="Total Outstanding" value={money(m.outstanding)} />
        <Tile label="Overdue Outstanding" value={money(m.overdue)} accent="red" />
        <Tile label="Commission Earned" value={money(m.earned)} accent="green" />
        <Tile label="Pending Settlement" value={money(m.earned - m.settled)} accent="amber" />
      </div>

      <div className="grid-2 mb">
        <div className="card">
          <div className="card-head"><h2>Commission earned by manufacturer</h2></div>
          <div className="card-pad">
            <HBarChart data={m.commByMfr} format={money} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h2>Collection status</h2></div>
          <div className="card-pad">
            <Donut
              size={150}
              centerLabel={`${m.collectionPct}%`}
              centerSub="collected"
              segments={[
                { label: 'Received', value: m.received, display: money(m.received), color: '#0f9d58' },
                { label: 'Outstanding', value: m.outstanding, display: money(m.outstanding), color: '#e4e7ec' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="card mb">
        <div className="card-head"><h2>Outstanding by aging bucket</h2></div>
        <div className="card-pad">
          <HBarChart data={m.agingData} format={money} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h2>⚠️ Overdue invoices</h2>
            <button className="btn-link" onClick={() => nav('/invoices')}>View all →</button>
          </div>
          {m.overdueInvoices.length === 0 ? (
            <Empty>Nothing overdue. 🎉</Empty>
          ) : (
            <table>
              <thead>
                <tr><th>Invoice</th><th>Customer</th><th className="right">Outstanding</th><th>Aging</th></tr>
              </thead>
              <tbody>
                {m.overdueInvoices.map(({ inv, pos, days, bucket }) => (
                  <tr key={inv.id} className="clickable" onClick={() => nav(`/invoices/${encodeURIComponent(inv.id)}`)}>
                    <td><span className="tag-link">{inv.id}</span></td>
                    <td>{customerName(inv.customerId)}</td>
                    <td className="num">{money(pos.balance)}</td>
                    <td><AgingBadge bucket={bucket} days={days} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Recent payments</h2>
            <button className="btn-link" onClick={() => nav('/commissions')}>Commissions →</button>
          </div>
          {m.recentPayments.length === 0 ? (
            <Empty>No payments yet.</Empty>
          ) : (
            <table>
              <thead>
                <tr><th>Date</th><th>Invoice</th><th>Mode</th><th className="right">Amount</th></tr>
              </thead>
              <tbody>
                {m.recentPayments.map((p) => (
                  <tr key={p.id} className="clickable" onClick={() => nav(`/invoices/${encodeURIComponent(p.invoiceId)}`)}>
                    <td className="muted">{fmtDate(p.date)}</td>
                    <td><span className="tag-link">{p.invoiceId}</span></td>
                    <td>{p.mode}</td>
                    <td className="num">{money(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}
