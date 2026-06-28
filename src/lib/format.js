// Formatting + date helpers for the prototype.
// Currency assumed consistent (INR) per the requirements doc.

export const money = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export const money2 = (n) =>
  '₹' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const pct = (n) => `${(Number(n) || 0).toLocaleString('en-IN')}%`

export const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const today = () => new Date('2026-06-28T00:00:00') // fixed "today" for stable seeded aging

export const daysBetween = (fromIso, toDate) => {
  const a = new Date(fromIso)
  const b = toDate instanceof Date ? toDate : new Date(toDate)
  return Math.round((b - a) / 86400000)
}

export const addDays = (iso, days) => {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
