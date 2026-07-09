import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Staff
import LoginStaff        from './pages/LoginStaff'
import DashboardKaryawan from './pages/DashboardKaryawan'
import DashboardManajer  from './pages/DashboardManajer'

// Customer
import LandingPage from './pages/customer/LandingPage'
import LoginCustomer    from './pages/customer/LoginCustomer'
import RegisterCustomer from './pages/customer/RegisterCustomer'
import DetailFilm       from './pages/customer/DetailFilm'
import PilihKursi       from './pages/customer/PilihKursi'
import Pembayaran       from './pages/customer/Pembayaran'
import ETicket          from './pages/customer/ETicket'
import RiwayatPesanan   from './pages/customer/RiwayatPesanan'
import ProfilCustomer  from './pages/customer/ProfilCustomer'
import LupaPassword from './pages/customer/LupaPassword'

function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token')
  const role  = localStorage.getItem('user_role')
  if (!token) return <Navigate to="/staff/login" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to="/staff/login" replace />
  return children
}

function CustomerRoute({ children }) {
  const token = localStorage.getItem('customer_token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<LoginCustomer />} />
        <Route path="/register" element={<RegisterCustomer />} />
        <Route path="/film/:id" element={<DetailFilm />} />
        <Route path="/lupa-password" element={<LupaPassword />} />

        {/* ── Customer (perlu login) ── */}
        <Route path="/pilih-kursi/:jadwalId" element={
          <CustomerRoute><PilihKursi /></CustomerRoute>
        } />
        <Route path="/pembayaran" element={
          <CustomerRoute><Pembayaran /></CustomerRoute>
        } />
        <Route path="/etiket" element={
          <CustomerRoute><ETicket /></CustomerRoute>
        } />
        <Route path="/riwayat" element={
        <CustomerRoute><RiwayatPesanan /></CustomerRoute>
        } />
        <Route path="/profil" element={
          <CustomerRoute><ProfilCustomer /></CustomerRoute>
        } />
        {/* Staff */}
        <Route path="/staff/login" element={<LoginStaff />} />
        <Route path="/dashboard/karyawan/*" element={
          <PrivateRoute allowedRole="karyawan"><DashboardKaryawan /></PrivateRoute>
        } />
        <Route path="/dashboard/manajer/*" element={
          <PrivateRoute allowedRole="manajer"><DashboardManajer /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}