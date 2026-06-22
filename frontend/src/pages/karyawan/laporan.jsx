// pages/karyawan/Laporan.jsx
// Laporan Film Terlaris — carousel kartu + bar chart + tabel paginasi

import { useState, useEffect } from 'react'
import api from '../../services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const posterSrc = (url) => url ? `${API_BASE}${url}` : null

// ── Helper format Rupiah ──────────────────────────────────
const fmtRupiah = (n) =>
  'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)


// ════════════════════════════════════════════════════════
// Komponen: Kartu Film Terlaris (carousel atas)
// ════════════════════════════════════════════════════════
function KartuFilmTerlaris({ film }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Poster */}
      <div className="relative" style={{ aspectRatio: '2/3' }}>
        {film.poster_url ? (
          <img
            src={posterSrc(film.poster_url)}
            alt={film.judul}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300
                          flex items-center justify-center text-4xl">
            🎬
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base uppercase tracking-wide">{film.judul}</h3>
        <p className="text-gray-400 text-sm mt-0.5">{film.genre || '-'}</p>

        <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-gray-400 text-[10px] tracking-widest">PENJUALAN</p>
            <p className="font-bold text-gray-900 text-lg">{film.tiket_terjual.toLocaleString('id-ID')}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-[10px] tracking-widest">OCCUPANCY</p>
            <p className="font-bold text-gray-900 text-lg">{film.occupancy}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Bar Chart Film Terlaris (SVG manual, tanpa library)
// ════════════════════════════════════════════════════════
function BarChartTerlaris({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-400 py-10">Belum ada data penjualan.</p>
  }

  const maxValue   = Math.max(...data.map(d => d.tiket_terjual), 1)
  const chartHeight = 220
  const barWidth     = 100 / data.length   // persentase lebar tiap bar

  return (
    <div className="px-6 pt-8 pb-3">
      <div className="flex items-end justify-between gap-3" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const tinggiPx  = Math.max((d.tiket_terjual / maxValue) * chartHeight, 8)
          const isHighest = i === data.length - 1   // data diurutkan ASC, terakhir = tertinggi

          return (
            <div key={d.judul} className="flex-1 flex flex-col items-center justify-end h-full">
              {/* Nilai di atas bar */}
              <span className="text-xs font-semibold text-gray-700 mb-1.5">
                {d.tiket_terjual}
              </span>

              {/* Bar */}
              <div
                className={`w-full rounded-t-md transition-all duration-500
                  ${isHighest ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}
                style={{ height: `${tinggiPx}px` }}
              />
            </div>
          )
        })}
      </div>

      {/* Label sumbu X */}
      <div className="flex justify-between gap-3 mt-3 border-t border-gray-200 pt-2">
        {data.map((d) => (
          <p key={d.judul} className="flex-1 text-center text-gray-500 text-xs truncate">
            {d.judul}
          </p>
        ))}
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Tabel Ranking dengan Pagination
// ════════════════════════════════════════════════════════
function TabelRanking({ data, page, totalPages, totalFilm, perPage, onGantiPage }) {
  const startItem = (page - 1) * perPage + 1
  const endItem   = Math.min(page * perPage, totalFilm)

  // Generate nomor halaman (maks 5 tombol terlihat)
  const pageNumbers = []
  const maxButton = 5
  let start = Math.max(1, page - 2)
  let end   = Math.min(totalPages, start + maxButton - 1)
  if (end - start < maxButton - 1) start = Math.max(1, end - maxButton + 1)
  for (let i = start; i <= end; i++) pageNumbers.push(i)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      
      {/* 1. KUNCI TAMBAHAN: Pembungkus responsive scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px]"> {/* Memaksa tabel punya lebar minimal 650px saat di layar HP kecil */}

          {/* Header tabel */}
          <div className="grid grid-cols-[100px_1fr_160px_180px] bg-gray-50 px-6 py-3 text-xs font-bold text-gray-500 tracking-widest">
            <span>PERINGKAT</span>
            <span>JUDUL FILM</span>
            <span className="text-right">TIKET TERJUAL</span>
            <span className="text-right">TOTAL PENDAPATAN</span>
          </div>

          {/* Baris data */}
          {data.map((row) => (
            <div
              key={row.peringkat}
              className="grid grid-cols-[100px_1fr_160px_180px] px-6 py-3.5 border-b border-gray-100
                         last:border-0 text-sm hover:bg-gray-50 transition"
            >
              <span className="text-gray-500">#{row.peringkat}</span>
              <span className="font-bold text-gray-900">{row.judul}</span>
              <span className="text-right text-gray-700">{row.tiket_terjual.toLocaleString('id-ID')}</span>
              <span className="text-right text-gray-700">{fmtRupiah(row.total_pendapatan)}</span>
            </div>
          ))}

        </div> {/* 2. Penutup min-w */}
      </div> {/* 3. Penutup overflow-x-auto */}

      {/* Footer: info + pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <p className="text-gray-400 text-xs">
          Menampilkan {startItem}-{endItem} dari {totalFilm} film
        </p>

        <div className="flex items-center gap-1.5">
          {/* Tombol prev */}
          <button
            onClick={() => onGantiPage(page - 1)}
            disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                       text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ‹
          </button>

          {/* Nomor halaman */}
          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => onGantiPage(n)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition
                ${n === page
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {n}
            </button>
          ))}

          {/* Tombol next */}
          <button
            onClick={() => onGantiPage(page + 1)}
            disabled={page >= totalPages}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                       text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// HALAMAN UTAMA — Laporan
// ════════════════════════════════════════════════════════
export default function Laporan() {
  const [filmTerlaris, setFilmTerlaris] = useState([])
  const [chartData,    setChartData]    = useState([])
  const [tabelData,    setTabelData]    = useState(null)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)

  const PER_PAGE = 5

  // ── Fetch kartu carousel + chart (sekali saja) ────────
  useEffect(() => {
    const fetchAwal = async () => {
      try {
        const [resKartu, resChart] = await Promise.all([
          api.get('/api/laporan/film-terlaris?limit=4'),
          api.get('/api/laporan/chart-terlaris?limit=7'),
        ])
        setFilmTerlaris(resKartu.data)
        setChartData(resChart.data)
      } catch (e) {
        console.error('Gagal load laporan', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAwal()
  }, [])

  // ── Fetch tabel (setiap ganti halaman) ────────────────
  useEffect(() => {
    api.get(`/api/laporan/tabel-terlaris?page=${page}&per_page=${PER_PAGE}`)
      .then(r => setTabelData(r.data))
      .catch(() => {})
  }, [page])

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      <h1 className="text-white font-bold text-2xl mb-1">Laporan Film Terlaris</h1>
      <div className="w-44 h-0.5 bg-blue-400 mb-6" />

      {loading ? (
        <div className="text-center text-blue-200 py-16">Memuat laporan...</div>
      ) : (
        <>
          {/* ── Carousel kartu film terlaris ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {filmTerlaris.length === 0 ? (
              <div className="col-span-full bg-white/10 rounded-2xl p-10 text-center text-blue-200">
                Belum ada data penjualan film.
              </div>
            ) : (
              filmTerlaris.map((f) => <KartuFilmTerlaris key={f.id} film={f} />)
            )}
          </div>

          {/* ── Bar chart film terlaris ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 text-sm tracking-widest">FILM TERLARIS</h2>
            </div>
            <BarChartTerlaris data={chartData} />
          </div>

          {/* ── Tabel ranking + pagination ── */}
          {tabelData && (
            <TabelRanking
              data={tabelData.data}
              page={tabelData.page}
              totalPages={tabelData.total_pages}
              totalFilm={tabelData.total_film}
              perPage={tabelData.per_page}
              onGantiPage={setPage}
            />
          )}
        </>
      )}
    </div>
  )
}