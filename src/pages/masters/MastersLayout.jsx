import { NavLink } from 'react-router-dom'
import Layout from '../../components/Layout.jsx'

export default function MastersLayout({ title, actions, children }) {
  return (
    <Layout title="Masters" crumb="Reference data" actions={actions}>
      <div className="master-tabs">
        <NavLink to="/masters/customers" className={({ isActive }) => (isActive ? 'active' : '')}>Customers</NavLink>
        <NavLink to="/masters/manufacturers" className={({ isActive }) => (isActive ? 'active' : '')}>Manufacturers</NavLink>
        <NavLink to="/masters/items" className={({ isActive }) => (isActive ? 'active' : '')}>Items</NavLink>
      </div>
      {children}
    </Layout>
  )
}
