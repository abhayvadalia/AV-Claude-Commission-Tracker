import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import Customers from './pages/masters/Customers.jsx'
import Manufacturers from './pages/masters/Manufacturers.jsx'
import Items from './pages/masters/Items.jsx'
import OrderList from './pages/orders/OrderList.jsx'
import NewOrder from './pages/orders/NewOrder.jsx'
import OrderDetail from './pages/orders/OrderDetail.jsx'
import FulfilOrder from './pages/orders/FulfilOrder.jsx'
import InvoiceList from './pages/payments/InvoiceList.jsx'
import AddInvoice from './pages/payments/AddInvoice.jsx'
import InvoiceDetail from './pages/payments/InvoiceDetail.jsx'
import CommissionList from './pages/commissions/CommissionList.jsx'
import CommissionDetail from './pages/commissions/CommissionDetail.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />

      <Route path="/masters" element={<Navigate to="/masters/customers" replace />} />
      <Route path="/masters/customers" element={<Customers />} />
      <Route path="/masters/manufacturers" element={<Manufacturers />} />
      <Route path="/masters/items" element={<Items />} />

      <Route path="/orders" element={<OrderList />} />
      <Route path="/orders/new" element={<NewOrder />} />
      <Route path="/orders/:id/fulfil" element={<FulfilOrder />} />
      <Route path="/orders/:id" element={<OrderDetail />} />

      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/invoices/new" element={<AddInvoice />} />
      <Route path="/invoices/:id" element={<InvoiceDetail />} />

      <Route path="/commissions" element={<CommissionList />} />
      <Route path="/commissions/:id" element={<CommissionDetail />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
