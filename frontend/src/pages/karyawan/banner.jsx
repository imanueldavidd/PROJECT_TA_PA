// pages/karyawan/Banner.jsx
// Kelola banner landing page — upload, atur urutan, aktif/nonaktif, hapus

import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function Banner() {
  const [bannerList, setBannerList] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [notif,      setNotif]      = useState('')

  // State form upload baru
  const [formBaru,      setFormBaru]      = useState({ judul: '', urutan: 0 })
  const [fileBaru,      setFileBaru]      = useState(null)
  const [previewBaru,   setPreviewBaru]   = useState(null)
  const [loadingUpload, setLoadingUpload] = useState(false)

  const fileInputRef = useRef()

  // ── Fetch daftar banner ──────────────────────────────
  const fetchBanner = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/banner/')
      setBannerList(res.data)
    } catch {
      setNotif('❌ Gagal memuat banner.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBanner() }, [])

  const tampilNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3500)
  }

  // ── Upload banner baru ───────────────────────────────
  const handleUpload = async () => {
    if (!fileBaru) { setNotif('❌ Pilih gambar terlebih dahulu!'); return }
    setLoadingUpload(true)
    const fd = new FormData()
    fd.append('judul',   formBaru.judul)
    fd.append('urutan',  formBaru.urutan)
    fd.append('gambar',  fileBaru)
    try {
      await api.post('/api/banner/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      tampilNotif('✅ Banner berhasil ditambahkan!')
      setFormBaru({ judul: '', urutan: 0 })
      setFileBaru(null)
      setPreviewBaru(null)
      fetchBanner()
    } catch (err) {
      tampilNotif('❌ ' + (err.response?.data?.detail || 'Gagal upload.'))
    } finally {
      setLoadingUpload(false)
    }
  }

  // ── Toggle aktif/nonaktif ────────────────────────────
  const handleToggle = async (id) => {
    try {
      await api.patch(`/api/banner/${id}/toggle`)
      fetchBanner()
    } catch {
      tampilNotif('❌ Gagal mengubah status banner.')
    }
  }

  // ── Hapus banner ─────────────────────────────────────
  const handleHapus = async (id) => {
    try {
      await api.delete(`/api/banner/${id}`)
      tampilNotif('✅ Banner berhasil dihapus.')
      fetchBanner()
    } catch {
      tampilNotif('❌ Gagal menghapus banner.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <p className="text-blue-200 text-sm mb-6">
        Area Karyawan: <span className="text-white font-semibold">Kelola Banner</span>
      </p>

      {/* Notifikasi */}
      {notif && (
        <div className={`mb-4 p-3 rounded-xl text-sm
          ${notif.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {notif}
        </div>
      )}

      {/* ── Form Upload Banner Baru ── */}
      <div className="bg-white rounded-2xl shadow-lg p-5 sm:p-6 mb-6">
        <h2 className="font-bold text-gray-800 text-lg mb-4">Upload Banner Baru</h2>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Preview + input file */}
          <div
            onClick={() => fileInputRef.current.click()}
            className="w-full lg:w-72 shrink-0 border-2 border-dashed border-gray-300
                       rounded-2xl cursor-pointer hover:border-blue-400 transition overflow-hidden
                       flex items-center justify-center bg-gray-50"
            style={{ minHeight: 160 }}
          >
            {previewBaru ? (
              <img src={previewBaru} alt="Preview"
                   className="w-full h-full object-cover rounded-2xl max-h-48" />
            ) : (
              <div className="text-center p-6">
                <p className="text-3xl mb-2">🖼️</p>
                <p className="text-sm text-gray-500 font-medium">Klik untuk upload gambar</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — Rasio bebas</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files[0]
              if (f) {
                setFileBaru(f)
                setPreviewBaru(URL.createObjectURL(f))
              }
            }}
          />

          {/* Form input */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                JUDUL / KETERANGAN (Opsional)
              </label>
              <input
                value={formBaru.judul}
                onChange={e => setFormBaru({ ...formBaru, judul: e.target.value })}
                placeholder="Contoh: Promo Lebaran 2026"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">
                URUTAN TAMPIL
              </label>
              <input
                type="number" min="0"
                value={formBaru.urutan}
                onChange={e => setFormBaru({ ...formBaru, urutan: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              <p className="text-xs text-gray-400 mt-1">0 = tampil pertama, 1 = kedua, dst.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleUpload}
                disabled={loadingUpload || !fileBaru}
                className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-2.5
                           rounded-xl text-sm transition disabled:opacity-50"
              >
                {loadingUpload ? 'Mengupload...' : '+ Tambah Banner'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Daftar Banner ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-lg">
            Daftar Banner ({bannerList.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat banner...</div>
        ) : bannerList.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">🖼️</p>
            <p>Belum ada banner. Upload banner pertamamu!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bannerList.map((b) => (
              <BannerItem
                key={b.id}
                banner={b}
                onToggle={handleToggle}
                onHapus={handleHapus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


// ── Komponen: Baris Banner ────────────────────────────────
function BannerItem({ banner, onToggle, onHapus }) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)
  const API_BASE = import.meta.env.VITE_API_BASE_URL

  return (
    <div className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-gray-50 transition">
      {/* Thumbnail */}
      <div className="w-24 h-14 rounded-lg overflow-hidden shrink-0 bg-gray-100">
        <img
          src={`${API_BASE}${banner.gambar_url}`}
          alt={banner.judul || 'Banner'}
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm truncate">
          {banner.judul || <span className="text-gray-400 italic">Tanpa judul</span>}
        </p>
        <p className="text-gray-400 text-xs mt-0.5">Urutan: {banner.urutan}</p>
      </div>

      {/* Status badge */}
      <button
        onClick={() => onToggle(banner.id)}
        className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full transition
          ${banner.is_aktif
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
      >
        {banner.is_aktif ? '● AKTIF' : '○ NONAKTIF'}
      </button>

      {/* Tombol hapus */}
      {konfirmHapus ? (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => { setKonfirmHapus(false); onHapus(banner.id) }}
            className="text-red-600 text-xs font-bold hover:text-red-800">
            YA
          </button>
          <button onClick={() => setKonfirmHapus(false)}
            className="text-gray-400 text-xs">
            BATAL
          </button>
        </div>
      ) : (
        <button onClick={() => setKonfirmHapus(true)}
          className="shrink-0 text-red-400 hover:text-red-600 text-xs font-bold transition">
          HAPUS
        </button>
      )}
    </div>
  )
}