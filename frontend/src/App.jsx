// App.jsx
// Pengaturan routing seluruh aplikasi

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginStaff from './pages/LoginStaff'
import DashboardKaryawan from './pages/DashboardKaryawan'
import DashboardManajer from './pages/DashboardManajer'

// Guard sederhana — cek apakah sudah login
function PrivateRoute({ children, allowedRole }) {
  const token = localStorage.getItem('access_token')
  const role  = localStorage.getItem('user_role')

  if (!token) return <Navigate to="/staff/login" replace />
  if (allowedRole && role !== allowedRole) return <Navigate to="/staff/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root ke halaman login staff */}
        <Route path="/" element={<Navigate to="/staff/login" replace />} />

        {/* Halaman login staff (karyawan & manajer) */}
        <Route path="/staff/login" element={<LoginStaff />} />

        {/* Dashboard Karyawan — hanya bisa diakses role 'karyawan' */}
        <Route
          path="/dashboard/karyawan/*"
          element={
            <PrivateRoute allowedRole="karyawan">
              <DashboardKaryawan />
            </PrivateRoute>
          }
        />

        {/* Dashboard Manajer — hanya bisa diakses role 'manajer' */}
        <Route
          path="/dashboard/manajer/*"
          element={
            <PrivateRoute allowedRole="manajer">
              <DashboardManajer />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}