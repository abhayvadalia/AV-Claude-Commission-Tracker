// Sanity check for the commission engine against seeded data.
// Run with:  node verify.mjs
import { seed } from './src/data/seed.js'
import { computeAccruals, invoicePosition, orderStatus } from './src/lib/commission.js'

const s = seed()
console.log('Invoice positions:')
for (const inv of s.invoices) {
  const p = invoicePosition(s, inv)
  console.log(` ${inv.id}  amt ${p.amount}  paid ${p.paid}  bal ${p.balance}  ${p.status}`)
}
console.log('\nOrder statuses:')
for (const o of s.orders) console.log(` ${o.id}  ${orderStatus(o)}`)

const acc = computeAccruals(s)
let total = 0
console.log(`\nCommission accruals (${acc.length}):`)
for (const a of acc) {
  total += a.earned
  console.log(` ${a.id}  basis ${a.basisAmount.toFixed(2)}  ${a.commissionType} ${a.commissionValue}  => ${a.earned.toFixed(2)}  [${a.status}]`)
}
console.log(`\nTotal commission earned: ${total.toFixed(2)}`)
