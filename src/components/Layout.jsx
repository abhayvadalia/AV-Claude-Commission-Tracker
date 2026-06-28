import { NavLink } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE, APP_VERSION, APP_STAGE, VENDOR, BUILD_DATE } from '../lib/version.js'

export default function Layout({ title, crumb, actions, wide, children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          {APP_NAME}
          <small>{APP_TAGLINE}</small>
        </div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            📊 Dashboard
          </NavLink>
          <div className="nav-section">Modules</div>
          <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
            📦 Orders
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => (isActive ? 'active' : '')}>
            🧾 Payments
          </NavLink>
          <NavLink to="/commissions" className={({ isActive }) => (isActive ? 'active' : '')}>
            💰 Commissions
          </NavLink>
          <div className="nav-section">Masters</div>
          <NavLink to="/masters/customers" className={({ isActive }) => (isActive ? 'active' : '')}>
            👤 Customers
          </NavLink>
          <NavLink to="/masters/manufacturers" className={({ isActive }) => (isActive ? 'active' : '')}>
            🏭 Manufacturers
          </NavLink>
          <NavLink to="/masters/items" className={({ isActive }) => (isActive ? 'active' : '')}>
            🧵 Items
          </NavLink>
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            {crumb && <div className="crumb">{crumb}</div>}
            <h1>{title}</h1>
          </div>
          <div className="flex">{actions}</div>
        </header>
        <main className={`content${wide ? ' wide' : ''}`}>{children}</main>
        <footer className="footer">
          <span>{APP_NAME} · v{APP_VERSION} ({APP_STAGE}) · {BUILD_DATE}</span>
          <span className="footnote">Prototype by {VENDOR}</span>
        </footer>
      </div>
    </div>
  )
}
