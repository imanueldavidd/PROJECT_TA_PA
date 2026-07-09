// pages/DashboardKaryawan.jsx

import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import SidebarLayout from '../components/SidebarLayout'
import api from '../services/api'

import Jadwal  from './karyawan/Jadwal'
import Tiket   from './karyawan/Tiket'
import Film    from './karyawan/Film'
import Laporan from './karyawan/Laporan'
import Banner from './karyawan/Banner'

// ── Menu sidebar karyawan ─────────────────────────────────
const MENU = [
  { to: '/dashboard/karyawan',         label: 'Dashboard', icon: '▣', end: true },
  { to: '/dashboard/karyawan/jadwal',  label: 'Jadwal',    icon: '📅' },
  { to: '/dashboard/karyawan/tiket',   label: 'Tiket',     icon: '🎟' },
  { to: '/dashboard/karyawan/film',    label: 'Film',      icon: '🎬' },
  { to: '/dashboard/karyawan/banner',   label: 'Banner',    icon: '🖼️' },
  { to: '/dashboard/karyawan/laporan', label: 'Laporan',   icon: '📊' },
]

// ── Dashboard Home ────────────────────────────────────────
function DashboardHome() {
  const nama = localStorage.getItem('user_nama') || 'Karyawan'
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/dashboard/karyawan')
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
    const iv = setInterval(() => {
      api.get('/api/dashboard/karyawan').then(r => setData(r.data))
    }, 60_000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <p className="text-blue-200 text-sm mb-6">
        Area Karyawan: <span className="text-white font-semibold">Dashboard</span>
      </p>

      {loading && <div className="text-center text-blue-200 py-16">Memuat...</div>}

      {data && (
        <>
          {/* Film Sedang Tayang */}
          <section className="mb-8">
            <h2 className="text-white font-bold text-lg tracking-widest mb-4">SEDANG TAYANG</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.film_tayang.length === 0 ? (
                <div className="col-span-full bg-white/10 rounded-xl p-8 text-center text-blue-200">
                  Tidak ada film tayang hari ini.
                </div>
              ) : (
                data.film_tayang.map((film) => (
                  <div key={film.id} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
                    {film.poster_url
                      ? <img src={`${import.meta.env.VITE_API_BASE_URL}${film.poster_url}`}
                             alt={film.judul}
                             className="w-16 sm:w-24 h-24 sm:h-36 object-cover rounded-lg shrink-0 shadow"
                             onError={e => e.target.style.display='none'} />
                      : <div className="w-16 sm:w-24 h-24 sm:h-36 bg-gray-200 rounded-lg shrink-0 flex items-center justify-center text-2xl">🎬</div>
                    }
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{film.judul}</h3>
                      <p className="text-gray-500 text-sm mt-1">{film.studio_list}</p>
                      {film.genre && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          {film.genre}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Studio Status */}
          <section>
            <h2 className="text-white font-bold text-lg tracking-widest mb-4">STUDIO STATUS</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {data.studio_status.map((s) => (
                <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="text-gray-600 text-sm font-medium text-center mb-3">{s.nama_studio}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500
                        ${s.sold_out ? 'bg-gray-900' : s.persentase >= 75 ? 'bg-orange-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(s.persentase, 100)}%` }}
                    />
                  </div>
                  {s.sold_out
                    ? <p className="text-center text-red-600 font-bold text-xs tracking-widest">SOLD OUT</p>
                    : <p className="text-center text-gray-500 text-xs">{s.persentase}% ({s.kursi_terpesan}/{s.kapasitas})</p>
                  }
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

// ── Placeholder ───────────────────────────────────────────
function SegeraHadir({ nama }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="bg-white/10 rounded-2xl p-12 text-center text-blue-200">
        <p className="text-4xl mb-3">🚧</p>
        <p className="font-semibold text-lg text-white">{nama}</p>
        <p className="text-sm mt-1">Segera hadir.</p>
      </div>
    </div>
  )
}

// ── Layout Utama ──────────────────────────────────────────
export default function DashboardKaryawan() {
  const navigate = useNavigate()
  const handleLogout = () => { localStorage.clear(); navigate('/staff/login') }

  return (
    <SidebarLayout menuItems={MENU} onLogout={handleLogout}>
      <Routes>
        <Route index          element={<DashboardHome />} />
        <Route path="jadwal"  element={<Jadwal />} />
        <Route path="tiket"   element={<Tiket />} />
        <Route path="film"    element={<Film />} />
        <Route path="banner"  element={<Banner />} />
        <Route path="laporan" element={<Laporan />} />
      </Routes>
    </SidebarLayout>
  )
}