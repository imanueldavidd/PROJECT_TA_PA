// pages/karyawan/Film.jsx
// Kelola Film — grid poster + form tambah/edit

import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// ── Helper: URL poster ────────────────────────────────────
const posterSrc = (url) => url ? `${API_BASE}${url}` : null

// ── Rating options ────────────────────────────────────────
const RATING_OPTIONS = ['SU (Semua Umur)', 'G', 'PG', 'PG-13', 'R', '17+', '21+']
const STATUS_OPTIONS  = ['segera', 'tayang']


// ════════════════════════════════════════════════════════
// Komponen: Form Tambah / Edit Film
// ════════════════════════════════════════════════════════
function FormFilm({ filmEdit, onBatal, onSimpan }) {
  const isEdit = !!filmEdit

  const [form, setForm] = useState({
    judul:        filmEdit?.judul        || '',
    sinopsis:     filmEdit?.sinopsis     || '',
    durasi_menit: filmEdit?.durasi_menit || 120,
    rating:       filmEdit?.rating       || 'SU (Semua Umur)',
    genre:        filmEdit?.genre        || '',
    bahasa:       filmEdit?.bahasa       || 'Indonesia',
    aktor:        filmEdit?.aktor        || '',
    status_film:  filmEdit?.status       || 'segera',
  })

  const [posterFile,    setPosterFile]    = useState(null)   // File object
  const [posterPreview, setPosterPreview] = useState(        // preview URL
    filmEdit?.poster_url ? posterSrc(filmEdit.poster_url) : null
  )
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const fileInputRef = useRef()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handlePosterChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB!')
      return
    }
    setPosterFile(file)
    setPosterPreview(URL.createObjectURL(file))
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.judul.trim()) { setError('Judul film wajib diisi!'); return }

    setLoading(true)
    setError('')

    // Gunakan FormData karena ada file upload
    const fd = new FormData()
    fd.append('judul',        form.judul)
    fd.append('sinopsis',     form.sinopsis)
    fd.append('durasi_menit', form.durasi_menit)
    fd.append('rating',       form.rating)
    fd.append('genre',        form.genre)
    fd.append('bahasa',       form.bahasa)
    fd.append('aktor',        form.aktor)
    fd.append('status_film',  form.status_film)
    if (posterFile) fd.append('poster', posterFile)

    try {
  if (isEdit) {
    await api.put(`/api/film/${filmEdit.id}`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  } else {
    // FIXED CORRECTION: Hapus tanda slash (/) setelah kata film
    await api.post('/api/film', fd, { 
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
  onSimpan()
} catch (err) {

      setError(err.response?.data?.detail || 'Gagal menyimpan film.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      <p className="text-blue-200 text-sm mb-6">
        Area Karyawan: <span className="text-white font-semibold">
          {isEdit ? 'Edit Film' : 'Tambah Film Baru'}
        </span>
      </p>

      <div className="bg-white rounded-2xl shadow-lg">
        {/* Header form */}
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-xl">
            {isEdit ? `Edit: ${filmEdit.judul}` : 'Tambah Film Baru'}
          </h2>
        </div>

        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* ── Kolom kiri: form input ── */}
          <div className="flex-1 space-y-4">
            <div className="w-full lg:w-64 shrink-0"></div>

            {/* Judul */}
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                JUDUL FILM
              </label>
              <input
                name="judul"
                value={form.judul}
                onChange={handleChange}
                placeholder="Masukkan judul film"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Sinopsis */}
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                DESKRIPSI FILM
              </label>
              <textarea
                name="sinopsis"
                value={form.sinopsis}
                onChange={handleChange}
                placeholder="Masukkan sinopsis film"
                rows={5}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>

            {/* Durasi + Rating */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                  DURASI
                </label>
                <div className="relative">
                  <input
                    name="durasi_menit"
                    type="number"
                    value={form.durasi_menit}
                    onChange={handleChange}
                    min="1"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                               focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition pr-14"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                    menit
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                  RATING PENONTON
                </label>
                <select
                  name="rating"
                  value={form.rating}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  {RATING_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {/* Genre + Bahasa */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                  GENRE
                </label>
                <input
                  name="genre"
                  value={form.genre}
                  onChange={handleChange}
                  placeholder="Masukkan Genre"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                  BAHASA
                </label>
                <input
                  name="bahasa"
                  value={form.bahasa}
                  onChange={handleChange}
                  placeholder="Masukkan"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Aktor */}
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                AKTOR
              </label>
              <input
                name="aktor"
                value={form.aktor}
                onChange={handleChange}
                placeholder="Masukkan Nama Aktor"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            {/* Status (hanya tampil saat edit) */}
            {isEdit && (
              <div>
                <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                  STATUS TAYANG
                </label>
                <select
                  name="status_film"
                  value={form.status_film}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* ── Kolom kanan: upload poster ── */}
          <div className="w-64 shrink-0">
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-3">
              UPLOAD POSTER FILM
            </label>

            {/* Area upload */}
            <div
              onClick={() => fileInputRef.current.click()}
              className="border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer
                         hover:border-blue-400 transition overflow-hidden"
              style={{ aspectRatio: '2/3' }}
            >
              {posterPreview ? (
                <img
                  src={posterPreview}
                  alt="Preview poster"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
                  <span className="text-3xl mb-2">📄</span>
                  <p className="text-sm font-medium text-gray-600">Klik untuk unggah poster</p>
                  <p className="text-xs mt-1">Format: JPG, PNG (Max 5MB)</p>
                </div>
              )}
            </div>

            {/* Input file tersembunyi */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handlePosterChange}
              className="hidden"
            />

            {/* Keterangan ganti poster */}
            {posterPreview && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Klik poster untuk ganti
              </p>
            )}
          </div>
        </div>

        {/* Footer form: tombol aksi */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onBatal}
            className="border border-gray-300 text-gray-600 hover:bg-gray-50
                       px-6 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            BATAL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gray-900 hover:bg-black text-white font-bold
                       px-8 py-2.5 rounded-xl text-sm tracking-wide transition disabled:opacity-60"
          >
            {loading ? 'MENYIMPAN...' : 'SIMPAN'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Kartu Film (di grid)
// ════════════════════════════════════════════════════════
function KartuFilm({ film, onEdit, onHapus }) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition group">
      {/* Poster */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
        {film.poster_url ? (
          <img
            src={posterSrc(film.poster_url)}
            alt={film.judul}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300
                          flex items-center justify-center text-4xl">
            🎬
          </div>
        )}

        {/* Badge status */}
        <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full
          ${film.status === 'tayang'
            ? 'bg-green-500 text-white'
            : 'bg-yellow-400 text-yellow-900'}`}>
          {film.status === 'tayang' ? 'TAYANG' : 'SEGERA'}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm leading-tight truncate">{film.judul}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          ID: {film.kode_id} • {film.durasi_menit} MIN
        </p>

        {/* Tombol EDIT / HAPUS */}
        <div className="flex justify-between mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => onEdit(film)}
            className="text-blue-600 hover:text-blue-800 text-xs font-bold tracking-wide transition"
          >
            EDIT
          </button>

          {konfirmHapus ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Yakin?</span>
              <button
                onClick={() => { setKonfirmHapus(false); onHapus(film.id) }}
                className="text-red-600 text-xs font-bold"
              >
                YA
              </button>
              <button
                onClick={() => setKonfirmHapus(false)}
                className="text-gray-400 text-xs"
              >
                BATAL
              </button>
            </div>
          ) : (
            <button
              onClick={() => setKonfirmHapus(true)}
              className="text-red-500 hover:text-red-700 text-xs font-bold tracking-wide transition"
            >
              HAPUS
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Kartu Tambah Film Baru
// ════════════════════════════════════════════════════════
function KartuTambah({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-dashed border-gray-300
                 hover:border-blue-400 hover:bg-blue-50 transition flex flex-col
                 items-center justify-center gap-3 group"
      style={{ aspectRatio: '2/3' }}
    >
      <div className="w-12 h-12 rounded-full border-2 border-gray-300 group-hover:border-blue-400
                      flex items-center justify-center text-2xl text-gray-400 group-hover:text-blue-500 transition">
        +
      </div>
      <p className="text-gray-500 group-hover:text-blue-600 font-semibold text-sm transition">
        Tambah Film Baru
      </p>
    </button>
  )
}


// ════════════════════════════════════════════════════════
// HALAMAN UTAMA — Film
// ════════════════════════════════════════════════════════
export default function Film() {
  const [view,      setView]      = useState('grid')   // 'grid' | 'form'
  const [filmEdit,  setFilmEdit]  = useState(null)     // null = tambah baru
  const [filmList,  setFilmList]  = useState([])
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)
  const [notif,     setNotif]     = useState('')

  // ── Fetch daftar film ──────────────────────────────────
  const fetchFilm = async (q = '') => {
  setLoading(true)
  try {
    // FIXED CORRECTION: Mengatur params agar tidak memicu double slash di URL utama
    const url = q ? `/api/film?q=${encodeURIComponent(q)}` : '/api/film'
    const res = await api.get(url)
    setFilmList(res.data)
  } catch {
    setNotif('❌ Gagal memuat daftar film.')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchFilm() }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchFilm(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ── Hapus film ─────────────────────────────────────────
  const handleHapus = async (id) => {
    try {
      await api.delete(`/api/film/${id}`)
      setNotif('✅ Film berhasil dihapus.')
      fetchFilm(search)
    } catch (err) {
      setNotif('❌ ' + (err.response?.data?.detail || 'Gagal menghapus.'))
    }
    setTimeout(() => setNotif(''), 4000)
  }

  // ── Buka form tambah ───────────────────────────────────
  const handleTambah = () => {
    setFilmEdit(null)
    setView('form')
  }

  // ── Buka form edit ─────────────────────────────────────
  const handleEdit = (film) => {
    setFilmEdit(film)
    setView('form')
  }

  // ── Setelah simpan form ────────────────────────────────
  const handleSimpan = () => {
    setNotif(`✅ Film berhasil ${filmEdit ? 'diperbarui' : 'ditambahkan'}!`)
    setTimeout(() => setNotif(''), 4000)
    setView('grid')
    setFilmEdit(null)
    fetchFilm(search)
  }

  // ── Tampilkan form ─────────────────────────────────────
  if (view === 'form') {
    return (
      <FormFilm
        filmEdit={filmEdit}
        onBatal={() => { setView('grid'); setFilmEdit(null) }}
        onSimpan={handleSimpan}
      />
    )
  }

  // ── Tampilkan grid ─────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      <p className="text-blue-200 text-sm mb-6">
        Area Karyawan: <span className="text-white font-semibold">Kelola Film</span>
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6">

        {/* Search bar */}
        <div className="relative mb-6">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari film berdasarkan Judul atau Genre"
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-gray-50
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>

        {/* Notifikasi */}
        {notif && (
          <div className={`mb-4 p-3 rounded-xl text-sm
            ${notif.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200'
                                     : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {notif}
          </div>
        )}

        {/* Grid film */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">Memuat film...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filmList.map((f) => (
              <KartuFilm
                key={f.id}
                film={f}
                onEdit={handleEdit}
                onHapus={handleHapus}
              />
            ))}

            {/* Tombol tambah selalu di akhir grid */}
            <KartuTambah onClick={handleTambah} />
          </div>
        )}

        {/* Empty state (kalau search tidak ketemu) */}
        {!loading && filmList.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <p className="text-2xl mb-2">🎬</p>
            <p>Tidak ada film ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  )
}