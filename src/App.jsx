import { Routes, Route, Navigate } from 'react-router-dom'
import OrderList from './pages/orders/OrderList.jsx'
import NewOrder from './pages/orders/NewOrder.jsx'
import OrderDetail from './pages/orders/OrderDetail.jsx'
import InvoiceList from './pages/payments/InvoiceList.jsx'
import AddInvoice from './pages/payments/AddInvoice.jsx'
import InvoiceDetail from './pages/payments/InvoiceDetail.jsx'
import CommissionList from './pages/commissions/CommissionList.jsx'
import CommissionDetail from './pages/commissions/CommissionDetail.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/orders" replace />} />

      <Route path="/orders" element={<OrderList />} />
      <Route path="/orders/new" element={<NewOrder />} />
      <Route path="/orders/:id" element={<OrderDetail />} />

      <Route path="/invoices" element={<InvoiceList />} />
      <Route path="/invoices/new" element={<AddInvoice />} />
      <Route path="/invoices/:id" element={<InvoiceDetail />} />

      <Route path="/commissions" element={<CommissionList />} />
      <Route path="/commissions/:id" element={<CommissionDetail />} />

      <Route path="*" element={<Navigate to="/orders" replace />} />
    </Routes>
  )
}
