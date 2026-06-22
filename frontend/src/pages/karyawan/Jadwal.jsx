// pages/karyawan/Jadwal.jsx
// Halaman Kelola Jadwal Tayang — tampilan timeline per studio

import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'

// ── Helper: format "HH:MM:SS" → "HH:MM" ─────────────────
const fmtJam = (t) => (t ? String(t).slice(0, 5) : '')

// ── Helper: tanggal hari ini format YYYY-MM-DD ────────────
const hariIni = () => new Date().toISOString().split('T')[0]

// ── Helper: format tanggal → "23 Juli, 2026" ─────────────
const fmtTanggal = (str) => {
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Modal Tambah Jadwal ───────────────────────────────────
function ModalTambahJadwal({ studioId, namaStudio, filmList, tanggal, onClose, onSimpan }) {
  const [form, setForm] = useState({
    film_id: '',
    jam_tayang: '',
    harga_tiket: 50000,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.film_id || !form.jam_tayang) {
      setError('Film dan jam tayang wajib diisi!')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/jadwal/', {
        film_id:     parseInt(form.film_id),
        studio_id:   studioId,
        tanggal:     tanggal,
        jam_tayang:  form.jam_tayang + ':00',
        harga_tiket: parseFloat(form.harga_tiket),
      })
      onSimpan()  // refresh data
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah jadwal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Overlay
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Tambah Jadwal</h3>
        <p className="text-gray-500 text-sm mb-5">{namaStudio} — {fmtTanggal(tanggal)}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Pilih Film */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Film</label>
            <select
              name="film_id"
              value={form.film_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Film --</option>
              {filmList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.judul} ({f.durasi_menit} mnt)
                </option>
              ))}
            </select>
          </div>

          {/* Jam Tayang */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Tayang</label>
            <input
              type="time"
              name="jam_tayang"
              value={form.jam_tayang}
              onChange={handleChange}
              min="10:00"
              max="23:59"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Harga */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga Tiket (Rp)</label>
            <input
              type="number"
              name="harga_tiket"
              value={form.harga_tiket}
              onChange={handleChange}
              min="0"
              step="5000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tombol */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2 text-sm hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg py-2 text-sm font-semibold transition disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Komponen: Slot Jadwal (blok di baris timeline) ────────
function SlotJadwal({ jadwal, onHapus }) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)

  return (
    <div className="relative group">
      <div className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 cursor-pointer transition min-w-[130px]">
        <p className="font-semibold text-gray-800 text-sm leading-tight">{jadwal.judul_film}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {fmtJam(jadwal.jam_tayang)} – {fmtJam(jadwal.jam_selesai)}
        </p>
      </div>

      {/* Tombol hapus — muncul saat hover */}
      <button
        onClick={() => setKonfirmHapus(true)}
        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs
                   items-center justify-center hidden group-hover:flex shadow transition"
        title="Hapus jadwal"
      >
        ✕
      </button>

      {/* Konfirmasi hapus inline */}
      {konfirmHapus && (
        <div className="absolute top-0 left-0 z-10 bg-white border border-red-300 rounded-xl shadow-xl p-3 w-52">
          <p className="text-gray-700 text-xs mb-2">Hapus jadwal <strong>{jadwal.judul_film}</strong>?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setKonfirmHapus(false)}
              className="flex-1 text-xs border rounded px-2 py-1 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              onClick={() => { setKonfirmHapus(false); onHapus(jadwal.id) }}
              className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1"
            >
              Hapus
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Halaman Utama Jadwal ──────────────────────────────────
export default function Jadwal() {
  const [tanggal,    setTanggal]    = useState(hariIni())
  const [filmFilter, setFilmFilter] = useState('')     // '' = semua
  const [studioFilter, setStudioFilter] = useState('') // '' = semua

  const [filmList,   setFilmList]   = useState([])
  const [studioList, setStudioList] = useState([])
  const [jadwalData, setJadwalData] = useState([])

  const [loading,  setLoading]  = useState(false)
  const [notif,    setNotif]    = useState('')     // pesan sukses/error

  // Modal state
  const [modal, setModal] = useState(null) // { studioId, namaStudio } | null

  // ── Fetch dropdown data (sekali saja) ─────────────────
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const [resFilm, resStudio] = await Promise.all([
          api.get('/api/jadwal/film-list'),
          api.get('/api/jadwal/studio-list'),
        ])
        setFilmList(resFilm.data)
        setStudioList(resStudio.data)
      } catch (e) {
        console.error('Gagal load master data', e)
      }
    }
    fetchMaster()
  }, [])

  // ── Fetch jadwal (diulang setiap filter berubah) ──────
  const fetchJadwal = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tanggal })
      if (filmFilter)   params.append('film_id',   filmFilter)
      if (studioFilter) params.append('studio_id', studioFilter)

      const res = await api.get(`/api/jadwal/?${params}`)
      setJadwalData(res.data)
    } catch (e) {
      setNotif('❌ Gagal memuat jadwal.')
    } finally {
      setLoading(false)
    }
  }, [tanggal, filmFilter, studioFilter])

  useEffect(() => { fetchJadwal() }, [fetchJadwal])

  // ── Hapus jadwal ──────────────────────────────────────
  const handleHapus = async (jadwalId) => {
    try {
      await api.delete(`/api/jadwal/${jadwalId}`)
      setNotif('✅ Jadwal berhasil dihapus.')
      fetchJadwal()
    } catch (err) {
      setNotif('❌ ' + (err.response?.data?.detail || 'Gagal menghapus.'))
    }
    setTimeout(() => setNotif(''), 3000)
  }

  // ── Kelompokkan jadwal per studio ─────────────────────
  // studioList yang tampil = semua (atau yang difilter)
  const studioTampil = studioFilter
    ? studioList.filter((s) => s.id === parseInt(studioFilter))
    : studioList

  const jadwalPerStudio = (studioId) =>
    jadwalData.filter((j) => j.studio_id === studioId)

  // ── Render ─────────────────────────────────────────────
    return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">

      {/* Breadcrumb */}
      <p className="text-blue-200 text-sm mb-6">
        Area Karyawan: <span className="text-white font-semibold">Kelola Jadwal Tayang</span>
      </p>

      {/* Card konten */}
      <div className="bg-white rounded-2xl shadow-lg p-6">

        {/* ── Baris atas: Tombol Simpan + Filter ── */}
        <div className="flex flex-wrap items-center gap-3 mb-6">

          {/* Notifikasi */}
          {notif && (
            <span className={`text-sm px-3 py-1.5 rounded-lg
              ${notif.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {notif}
            </span>
          )}

          <div className="ml-auto flex flex-wrap gap-3 items-center">
            {/* Filter: Pilih Film */}
            <select
              value={filmFilter}
              onChange={(e) => setFilmFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">PILIH FILM</option>
              {filmList.map((f) => (
                <option key={f.id} value={f.id}>{f.judul}</option>
              ))}
            </select>

            {/* Filter: Studio */}
            <select
              value={studioFilter}
              onChange={(e) => setStudioFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">SEMUA STUDIO</option>
              {studioList.map((s) => (
                <option key={s.id} value={s.id}>{s.nama_studio}</option>
              ))}
            </select>

            {/* Filter: Tanggal */}
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700">
              <span>📅</span>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="focus:outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* ── Tabel Timeline ── */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Memuat jadwal...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 text-sm font-semibold rounded-tl-lg w-32">
                    Studio
                  </th>
                  <th className="text-center px-4 py-3 text-sm font-semibold rounded-tr-lg">
                    WAKTU (10:00 – 24:00)
                  </th>
                </tr>
              </thead>
              <tbody>
                {studioTampil.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-10 text-gray-400">
                      Tidak ada studio.
                    </td>
                  </tr>
                ) : (
                  studioTampil.map((studio, idx) => {
                    const slots = jadwalPerStudio(studio.id)
                    const isLast = idx === studioTampil.length - 1

                    return (
                      <tr
                        key={studio.id}
                        className={`border-b border-gray-200 ${isLast ? '' : ''}`}
                      >
                        {/* Nama Studio */}
                        <td className="px-4 py-4 font-bold text-gray-800 text-sm align-top w-32">
                          {studio.nama_studio}
                        </td>

                        {/* Slot jadwal + tombol tambah */}
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2 items-center">
                            {/* Render setiap slot jadwal */}
                            {slots.map((j) => (
                              <SlotJadwal
                                key={j.id}
                                jadwal={j}
                                onHapus={handleHapus}
                              />
                            ))}

                            {/* Tombol tambah jadwal baru */}
                            <button
                              onClick={() => setModal({
                                studioId:   studio.id,
                                namaStudio: studio.nama_studio
                              })}
                              className="flex items-center justify-center gap-1
                                         border-2 border-dashed border-gray-300
                                         text-gray-400 hover:border-blue-400 hover:text-blue-500
                                         rounded-lg px-4 py-2 text-sm transition min-w-[100px]"
                            >
                              + Tambah
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Jadwal */}
      {modal && (
        <ModalTambahJadwal
          studioId={modal.studioId}
          namaStudio={modal.namaStudio}
          filmList={filmList}
          tanggal={tanggal}
          onClose={() => setModal(null)}
          onSimpan={() => {
            setNotif('✅ Jadwal berhasil ditambahkan!')
            setTimeout(() => setNotif(''), 3000)
            fetchJadwal()
          }}
        />
      )}
    </div>
  )
}