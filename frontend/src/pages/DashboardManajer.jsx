// pages/DashboardManajer.jsx

import { useState, useEffect } from 'react'
import { useNavigate, Routes, Route } from 'react-router-dom'
import SidebarLayout from '../components/SidebarLayout'
import api from '../services/api'
import LaporanManajer from './manajer/LaporanManajer'
import Staff from './manajer/Staff'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const posterSrc = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url        // Cloudinary URL
  return `${API_BASE}${url}`                    // URL lokal lama
}
const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)

const MENU = [
  { to: '/dashboard/manajer',         label: 'Dashboard', icon: '▣', end: true },
  { to: '/dashboard/manajer/laporan', label: 'Laporan',   icon: '📊' },
  { to: '/dashboard/manajer/staff',   label: 'Staff',     icon: '👤' },
]

// ── Kartu Ringkasan ───────────────────────────────────────
function KartuRingkasan({ ringkasan }) {
  const items = [
    { label: 'TOTAL OMZET HARI INI', value: fmtRupiah(ringkasan.total_omzet),              icon: '💰' },
    { label: 'TIKET TERJUAL',        value: ringkasan.jumlah_tiket.toLocaleString('id-ID'), icon: '🎟' },
    { label: 'JUMLAH TRANSAKSI',     value: ringkasan.jumlah_transaksi.toLocaleString('id-ID'), icon: '🧾' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
            {item.icon}
          </div>
          <div className="min-w-0">
            <p className="text-gray-400 text-[10px] tracking-widest font-semibold">{item.label}</p>
            <p className="font-bold text-gray-900 text-lg sm:text-xl truncate">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Bar Chart ─────────────────────────────────────────────
function BarChart({ data }) {
  if (!data?.length) return <p className="text-center text-gray-400 py-10">Belum ada data.</p>
  const max = Math.max(...data.map(d => d.tiket_terjual), 1)
  return (
    <div className="px-4 sm:px-6 pt-6 pb-3">
      <div className="flex items-end justify-between gap-1 sm:gap-3" style={{ height: 180 }}>
        {data.map((d, i) => {
          const h = Math.max((d.tiket_terjual / max) * 180, 6)
          return (
            <div key={d.judul} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-[10px] sm:text-xs font-semibold text-gray-700 mb-1">{d.tiket_terjual}</span>
              <div className={`w-full rounded-t-md ${i === data.length-1 ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}
                   style={{ height: h }} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between gap-1 sm:gap-3 mt-2 pt-2 border-t border-gray-200">
        {data.map(d => (
          <p key={d.judul} className="flex-1 text-center text-gray-500 text-[10px] sm:text-xs truncate">{d.judul}</p>
        ))}
      </div>
    </div>
  )
}

// ── Dashboard Home Manajer ────────────────────────────────
function DashboardHomeManajer() {
  const [ringkasan,    setRingkasan]    = useState(null)
  const [filmTerlaris, setFilmTerlaris] = useState([])
  const [chartData,    setChartData]    = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard-manajer/ringkasan-hari-ini'),
      api.get('/api/dashboard-manajer/film-terlaris-minggu?limit=4'),
      api.get('/api/dashboard-manajer/chart-terlaris?limit=7'),
    ]).then(([r1, r2, r3]) => {
      setRingkasan(r1.data)
      setFilmTerlaris(r2.data)
      setChartData(r3.data)
    }).finally(() => setLoading(false))

    const iv = setInterval(() => {
      api.get('/api/dashboard-manajer/ringkasan-hari-ini').then(r => setRingkasan(r.data))
    }, 60_000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <p className="text-blue-200 text-sm mb-5">
        Area Manajer: <span className="text-white font-semibold">Dashboard</span>
      </p>

      {loading ? (
        <div className="text-center text-blue-200 py-16">Memuat dashboard...</div>
      ) : (
        <>
          {ringkasan && <KartuRingkasan ringkasan={ringkasan} />}

          <h2 className="text-white font-bold text-xl mb-1">Terlaris Minggu Ini</h2>
          <div className="w-40 h-0.5 bg-red-400 mb-5" />

          {/* Grid film — 1 kolom di HP, 2 di tablet, 4 di desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {filmTerlaris.length === 0 ? (
              <div className="col-span-full bg-white/10 rounded-2xl p-10 text-center text-blue-200">
                Belum ada data minggu ini.
              </div>
            ) : (
              filmTerlaris.map((f) => (
                <div key={f.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <div style={{ aspectRatio: '2/3' }}>
                    {f.poster_url
                      ? <img src={posterSrc(f.poster_url)} alt={f.judul} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-4xl">🎬</div>
                    }
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-bold text-gray-900 text-sm uppercase truncate">{f.judul}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 truncate">{f.genre || '-'}</p>
                    <div className="flex justify-between mt-3 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-gray-400 text-[9px] tracking-widest">PENJUALAN</p>
                        <p className="font-bold text-gray-900">{f.tiket_terjual}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-400 text-[9px] tracking-widest">OKUPANSI</p>
                        <p className="font-bold text-gray-900">{f.occupancy}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <BarChart data={chartData} />
          </div>
        </>
      )}
    </div>
  )
}

// ── Layout Utama ──────────────────────────────────────────
export default function DashboardManajer() {
  const navigate = useNavigate()
  const handleLogout = () => { localStorage.clear(); navigate('/staff/login') }

  return (
    <SidebarLayout menuItems={MENU} onLogout={handleLogout}>
      <Routes>
        <Route index          element={<DashboardHomeManajer />} />
        <Route path="laporan" element={<LaporanManajer />} />
        <Route path="staff"   element={<Staff />} />
      </Routes>
    </SidebarLayout>
  )
}