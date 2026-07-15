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

// ModalTambahJadwal — versi update dengan periode tayang
function ModalTambahJadwal({ studioId, namaStudio, filmList, onClose, onSimpan }) {
  const hariIni = () => new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    film_id:         '',
    jam_tayang:      '',
    harga_tiket:     50000,
    tanggal_mulai:   hariIni(),
    tanggal_selesai: hariIni(),
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!form.film_id || !form.jam_tayang) {
      setError('Film dan jam tayang wajib diisi!')
      return
    }
    if (form.tanggal_selesai < form.tanggal_mulai) {
      setError('Tanggal selesai tidak boleh sebelum tanggal mulai!')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/jadwal/', {
        film_id:         parseInt(form.film_id),
        studio_id:       studioId,
        tanggal_mulai:   form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        jam_tayang:      form.jam_tayang + ':00',
        harga_tiket:     parseFloat(form.harga_tiket),
      })
      onSimpan()
      onClose()
    } catch (err) {
  console.log(err)
  console.log(err.response)
  console.log(err.response?.data)

  setError(
    err.response?.data?.detail ||
    JSON.stringify(err.response?.data) ||
    'Gagal menambah jadwal.'
  )
} finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Tambah Jadwal</h3>
        <p className="text-gray-500 text-sm mb-5">{namaStudio}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Film */}
          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">FILM</label>
            <select name="film_id" value={form.film_id}
              onChange={e => setForm({...form, film_id: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">-- Pilih Film --</option>
              {filmList.map(f => (
                <option key={f.id} value={f.id}>{f.judul} ({f.durasi_menit} mnt)</option>
              ))}
            </select>
          </div>

          {/* Jam Tayang */}
          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">JAM TAYANG</label>
            <input type="time" value={form.jam_tayang}
              onChange={e => setForm({...form, jam_tayang: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Periode Tayang */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                TANGGAL MULAI
              </label>
              <input type="date" value={form.tanggal_mulai}
                onChange={e => setForm({...form, tanggal_mulai: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                TANGGAL SELESAI
              </label>
              <input type="date" value={form.tanggal_selesai}
                min={form.tanggal_mulai}
                onChange={e => setForm({...form, tanggal_selesai: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Info durasi tayang */}
          {form.tanggal_mulai && form.tanggal_selesai && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-blue-600 text-xs">
                📅 Tayang selama{' '}
                <strong>
                  {Math.ceil(
                    (new Date(form.tanggal_selesai) - new Date(form.tanggal_mulai))
                    / (1000 * 60 * 60 * 24)
                  ) + 1} hari
                </strong>
                {' '}({form.tanggal_mulai} s/d {form.tanggal_selesai})
              </p>
            </div>
          )}

          {/* Harga */}
          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
              HARGA TIKET (Rp)
            </label>
            <input type="number" value={form.harga_tiket} min="0" step="5000"
              onChange={e => setForm({...form, harga_tiket: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg
                       py-2.5 text-sm hover:bg-gray-50 transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg
                       py-2.5 text-sm font-semibold transition disabled:opacity-60">
            {loading ? 'Menyimpan...' : 'Simpan Jadwal'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal untuk edit periode jadwal (perpanjang/perpendek)
function ModalEditJadwal({ jadwal, onClose, onSimpan }) {
  const [form, setForm] = useState({
    tanggal_mulai:   jadwal.tanggal_mulai,
    tanggal_selesai: jadwal.tanggal_selesai,
    jam_tayang:      jadwal.jam_tayang,
    harga_tiket:     jadwal.harga_tiket,
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (form.tanggal_selesai < form.tanggal_mulai) {
      setError('Tanggal selesai tidak boleh sebelum tanggal mulai!')
      return
    }
    setLoading(true)
    try {
      await api.put(`/api/jadwal/${jadwal.id}`, {
        tanggal_mulai:   form.tanggal_mulai,
        tanggal_selesai: form.tanggal_selesai,
        jam_tayang:      form.jam_tayang,
        harga_tiket:     parseFloat(form.harga_tiket),
      })
      onSimpan()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengupdate jadwal.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Edit Jadwal</h3>
        <p className="text-gray-500 text-sm mb-5">{jadwal.judul_film} — {jadwal.nama_studio}</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">JAM TAYANG</label>
            <input type="time" value={form.jam_tayang?.slice(0, 5)}
              onChange={e => setForm({...form, jam_tayang: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                TANGGAL MULAI
              </label>
              <input type="date" value={form.tanggal_mulai}
                onChange={e => setForm({...form, tanggal_mulai: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                TANGGAL SELESAI
              </label>
              <input type="date" value={form.tanggal_selesai}
                min={form.tanggal_mulai}
                onChange={e => setForm({...form, tanggal_selesai: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {form.tanggal_mulai && form.tanggal_selesai && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-blue-600 text-xs">
                📅 Tayang selama{' '}
                <strong>
                  {Math.ceil(
                    (new Date(form.tanggal_selesai) - new Date(form.tanggal_mulai))
                    / (1000 * 60 * 60 * 24)
                  ) + 1} hari
                </strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
              HARGA TIKET (Rp)
            </label>
            <input type="number" value={form.harga_tiket} min="0" step="5000"
              onChange={e => setForm({...form, harga_tiket: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg
                       py-2.5 text-sm hover:bg-gray-50 transition">
            Batal
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-lg
                       py-2.5 text-sm font-semibold transition disabled:opacity-60">
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SlotJadwal({ jadwal, onHapus, onEdit }) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)

  return (
    <div className="relative group">
      <div className="bg-gray-200 hover:bg-gray-300 rounded-lg px-3 py-2 cursor-pointer transition min-w-[130px]">
        <p className="font-semibold text-gray-800 text-sm">{jadwal.judul_film}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {fmtJam(jadwal.jam_tayang)} – {fmtJam(jadwal.jam_selesai)}
        </p>
        <p className="text-gray-400 text-xs">
          s/d {jadwal.tanggal_selesai}
        </p>
      </div>

      {/* Tombol edit & hapus saat hover */}
      <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
        <button onClick={() => onEdit(jadwal)}
          className="bg-blue-500 text-white rounded-full w-5 h-5 text-xs
                     flex items-center justify-center shadow" title="Edit jadwal">
          ✏
        </button>
        <button onClick={() => setKonfirmHapus(true)}
          className="bg-red-500 text-white rounded-full w-5 h-5 text-xs
                     flex items-center justify-center shadow" title="Hapus jadwal">
          ✕
        </button>
      </div>

      {konfirmHapus && (
        <div className="absolute top-0 left-0 z-10 bg-white border border-red-300
                        rounded-xl shadow-xl p-3 w-52">
          <p className="text-gray-700 text-xs mb-2">
            Hapus jadwal <strong>{jadwal.judul_film}</strong>?
          </p>
          <div className="flex gap-2">
            <button onClick={() => setKonfirmHapus(false)}
              className="flex-1 text-xs border rounded px-2 py-1 hover:bg-gray-50">
              Batal
            </button>
            <button onClick={() => { setKonfirmHapus(false); onHapus(jadwal.id) }}
              className="flex-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1">
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