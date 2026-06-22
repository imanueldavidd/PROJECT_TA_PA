// pages/manajer/LaporanManajer.jsx
// Laporan Film Terlaris untuk Manajer — dengan filter Bulan & Tahun

import { useState, useEffect } from 'react'
import api from '../../services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL
const posterSrc = (url) => url ? `${API_BASE}${url}` : null

const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]


// ════════════════════════════════════════════════════════
// Komponen: Filter Bulan & Tahun
// ════════════════════════════════════════════════════════
function FilterPeriode({ bulan, tahun, onBulan, onTahun, onTerapkan }) {
  const tahunSekarang = new Date().getFullYear()
  const daftarTahun   = Array.from({ length: 6 }, (_, i) => tahunSekarang - i)  // 6 tahun terakhir

  return (
    <div className="flex items-center gap-2">
      {/* Dropdown Bulan */}
      <select
        value={bulan}
        onChange={(e) => onBulan(parseInt(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {NAMA_BULAN.map((nama, idx) => (
          <option key={idx} value={idx + 1}>{nama}</option>
        ))}
      </select>

      {/* Dropdown Tahun */}
      <select
        value={tahun}
        onChange={(e) => onTahun(parseInt(e.target.value))}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {daftarTahun.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Tombol Terapkan */}
      <button
        onClick={onTerapkan}
        className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2 rounded-lg text-sm tracking-wide transition"
      >
        TERAPKAN
      </button>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Kartu Film Terlaris
// ════════════════════════════════════════════════════════
function KartuFilmTerlaris({ film }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative" style={{ aspectRatio: '2/3' }}>
        {film.poster_url ? (
          <img src={posterSrc(film.poster_url)} alt={film.judul} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-4xl">
            🎬
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base uppercase tracking-wide">{film.judul}</h3>
        <p className="text-gray-400 text-sm mt-0.5">{film.genre || '-'}</p>
        <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
          <div>
            <p className="text-gray-400 text-[10px] tracking-widest">PENJUALAN</p>
            <p className="font-bold text-gray-900 text-lg">{film.tiket_terjual.toLocaleString('id-ID')}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-[10px] tracking-widest">OKUPANSI</p>
            <p className="font-bold text-gray-900 text-lg">{film.occupancy}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Bar Chart
// ════════════════════════════════════════════════════════
function BarChartTerlaris({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-center text-gray-400 py-10">Belum ada data penjualan pada periode ini.</p>
  }

  const maxValue    = Math.max(...data.map(d => d.tiket_terjual), 1)
  const chartHeight = 220

  return (
    <div className="px-6 pt-8 pb-3">
      <div className="flex items-end justify-between gap-3" style={{ height: chartHeight }}>
        {data.map((d, i) => {
          const tinggiPx  = Math.max((d.tiket_terjual / maxValue) * chartHeight, 8)
          const isHighest = i === data.length - 1

          return (
            <div key={d.judul} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="text-xs font-semibold text-gray-700 mb-1.5">{d.tiket_terjual}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-500 ${isHighest ? 'bg-[#1e3a5f]' : 'bg-gray-200'}`}
                style={{ height: `${tinggiPx}px` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between gap-3 mt-3 border-t border-gray-200 pt-2">
        {data.map((d) => (
          <p key={d.judul} className="flex-1 text-center text-gray-500 text-xs truncate">{d.judul}</p>
        ))}
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Tabel Ranking + Pagination
// ════════════════════════════════════════════════════════
function TabelRanking({ data, page, totalPages, totalFilm, perPage, onGantiPage }) {
  const startItem = totalFilm === 0 ? 0 : (page - 1) * perPage + 1
  const endItem   = Math.min(page * perPage, totalFilm)

  const pageNumbers = []
  const maxButton = 5
  let start = Math.max(1, page - 2)
  let end   = Math.min(totalPages, start + maxButton - 1)
  if (end - start < maxButton - 1) start = Math.max(1, end - maxButton + 1)
  for (let i = start; i <= end; i++) pageNumbers.push(i)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      
      {/* ── BUNGKUS SCROLL HORIZONTAL DI SINI ── */}
      <div className="overflow-x-auto">
        <div className="min-w-[650px]">

          {/* Header Tabel */}
          <div className="grid grid-cols-[100px_1fr_160px_180px] bg-gray-50 px-6 py-3 text-xs font-bold text-gray-500 tracking-widest">
            <span>PERINGKAT</span>
            <span>JUDUL FILM</span>
            <span className="text-right">TIKET TERJUAL</span>
            <span className="text-right">TOTAL PENDAPATAN</span>
          </div>

          {/* Baris Data */}
          {data.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data pada periode ini.</div>
          ) : (
            data.map((row) => (
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
            ))
          )}

        </div>
      </div>

      <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
        <p className="text-gray-400 text-xs">
          Menampilkan {startItem}-{endItem} dari {totalFilm} film
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onGantiPage(page - 1)}
            disabled={page <= 1}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                       text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            ‹
          </button>

          {pageNumbers.map((n) => (
            <button
              key={n}
              onClick={() => onGantiPage(n)}
              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition
                ${n === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {n}
            </button>
          ))}

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
// HALAMAN UTAMA — Laporan Manajer
// ════════════════════════════════════════════════════════
export default function LaporanManajer() {
  const sekarang = new Date()

  // State filter — yang sedang dipilih di dropdown (belum diterapkan)
  const [bulanPilih, setBulanPilih] = useState(sekarang.getMonth() + 1)
  const [tahunPilih, setTahunPilih] = useState(sekarang.getFullYear())

  // State filter — yang sudah "diterapkan" dan dipakai untuk fetch data
  const [filterAktif, setFilterAktif] = useState({
    bulan: sekarang.getMonth() + 1,
    tahun: sekarang.getFullYear(),
  })

  const [filmTerlaris, setFilmTerlaris] = useState([])
  const [chartData,    setChartData]    = useState([])
  const [tabelData,    setTabelData]    = useState(null)
  const [page,         setPage]         = useState(1)
  const [loading,      setLoading]      = useState(true)

  const PER_PAGE = 5

  // ── Fetch carousel + chart setiap filterAktif berubah ──
  useEffect(() => {
    const fetchAwal = async () => {
      setLoading(true)
      try {
        const { bulan, tahun } = filterAktif
        const [resKartu, resChart] = await Promise.all([
          api.get(`/api/laporan/film-terlaris-periode?bulan=${bulan}&tahun=${tahun}&limit=4`),
          api.get(`/api/laporan/chart-terlaris-periode?bulan=${bulan}&tahun=${tahun}&limit=7`),
        ])
        setFilmTerlaris(resKartu.data)
        setChartData(resChart.data)
      } catch (e) {
        console.error('Gagal load laporan manajer', e)
      } finally {
        setLoading(false)
      }
    }
    fetchAwal()
    setPage(1)  // reset ke halaman 1 setiap ganti filter
  }, [filterAktif])

  // ── Fetch tabel setiap filterAktif atau page berubah ──
  useEffect(() => {
    const { bulan, tahun } = filterAktif
    api.get(`/api/laporan/tabel-terlaris-periode?bulan=${bulan}&tahun=${tahun}&page=${page}&per_page=${PER_PAGE}`)
      .then(r => setTabelData(r.data))
      .catch(() => {})
  }, [filterAktif, page])

  // ── Terapkan filter baru ──────────────────────────────
  const handleTerapkan = () => {
    setFilterAktif({ bulan: bulanPilih, tahun: tahunPilih })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      {/* Header + Filter */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-2xl mb-1">Laporan Film Terlaris</h1>
          <div className="w-44 h-0.5 bg-blue-400" />
        </div>

        <FilterPeriode
          bulan={bulanPilih}
          tahun={tahunPilih}
          onBulan={setBulanPilih}
          onTahun={setTahunPilih}
          onTerapkan={handleTerapkan}
        />
      </div>

      {loading ? (
        <div className="text-center text-blue-200 py-16">Memuat laporan...</div>
      ) : (
        <>
          {/* Carousel kartu film terlaris */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {filmTerlaris.length === 0 ? (
              <div className="col-span-full bg-white/10 rounded-2xl p-10 text-center text-blue-200">
                Belum ada data penjualan pada periode {NAMA_BULAN[filterAktif.bulan - 1]} {filterAktif.tahun}.
              </div>
            ) : (
              filmTerlaris.map((f) => <KartuFilmTerlaris key={f.id} film={f} />)
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
              <h2 className="font-bold text-gray-700 text-sm tracking-widest">FILM TERLARIS</h2>
            </div>
            <BarChartTerlaris data={chartData} />
          </div>

          {/* Tabel ranking + pagination */}
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