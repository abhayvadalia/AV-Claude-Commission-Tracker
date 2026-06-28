import { NavLink } from 'react-router-dom'

export default function Layout({ title, crumb, actions, children }) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          Fabric Commission Tracker
          <small>Distributor console · v0.1</small>
        </div>
        <nav className="nav">
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
        <main className="content">{children}</main>
      </div>
    </div>
  )
}
