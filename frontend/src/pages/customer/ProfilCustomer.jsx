// pages/customer/ProfilCustomer.jsx
// Halaman profil & edit data diri customer

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import customerApi from '../../services/customerApi'

export default function ProfilCustomer() {
  const navigate = useNavigate()
  const isLogin  = !!localStorage.getItem('customer_token')

  const [profil,   setProfil]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form,     setForm]     = useState({ nama: '', no_telepon: '' })
  const [saving,   setSaving]   = useState(false)
  const [notif,    setNotif]    = useState('')

  useEffect(() => {
    if (!isLogin) { navigate('/login'); return }
    customerApi.get('/api/customer/profil')
      .then(r => {
        setProfil(r.data)
        setForm({ nama: r.data.nama, no_telepon: r.data.no_telepon || '' })
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [])

  const handleSimpan = async () => {
    if (!form.nama.trim()) { setNotif('❌ Nama tidak boleh kosong!'); return }
    setSaving(true)
    try {
      await customerApi.put('/api/customer/profil', {
        nama:       form.nama,
        no_telepon: form.no_telepon,
      })
      // Update localStorage nama
      localStorage.setItem('customer_nama', form.nama)
      setProfil(prev => ({ ...prev, nama: form.nama, no_telepon: form.no_telepon }))
      setEditMode(false)
      setNotif('✅ Profil berhasil diperbarui!')
      setTimeout(() => setNotif(''), 3000)
    } catch (err) {
      setNotif('❌ ' + (err.response?.data?.detail || 'Gagal menyimpan.'))
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_nama')
    localStorage.removeItem('customer_id')
    navigate('/')
  }

  const fmtTglDaftar = (str) => {
    if (!str) return ''
    const d = new Date(str)
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0f1e35]/95 backdrop-blur
                      border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition">←</button>
            <Link to="/" className="font-black text-white">🎬 BIOSKOP 7</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-black mb-6">Data Diri</h1>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-blue-400
                            border-t-transparent rounded-full animate-spin" />
          </div>
        ) : profil && (
          <>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center
                              justify-center text-3xl font-black text-white mb-3">
                {profil.nama?.[0]?.toUpperCase() || '?'}
              </div>
              <p className="font-bold text-lg">{profil.nama}</p>
              <p className="text-gray-400 text-sm">{profil.email}</p>
            </div>

            {/* Notifikasi */}
            {notif && (
              <div className={`mb-4 p-3 rounded-xl text-sm
                ${notif.startsWith('✅')
                  ? 'bg-green-900/40 border border-green-700/50 text-green-300'
                  : 'bg-red-900/40 border border-red-700/50 text-red-300'}`}>
                {notif}
              </div>
            )}

            {/* Card profil */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-4">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <p className="font-bold text-sm">Informasi Akun</p>
                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-blue-400 hover:text-blue-300 text-sm transition"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Nama */}
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">
                    NAMA PENGGUNA
                  </p>
                  {editMode ? (
                    <input
                      value={form.nama}
                      onChange={e => setForm({...form, nama: e.target.value})}
                      className="w-full bg-white/10 border border-white/20 text-white
                                 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <p className="text-white font-semibold">{profil.nama}</p>
                  )}
                </div>

                {/* Email — tidak bisa diubah */}
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">
                    EMAIL
                  </p>
                  <p className="text-gray-300">{profil.email}</p>
                  <p className="text-gray-600 text-xs mt-0.5">Email tidak bisa diubah</p>
                </div>

                {/* No telepon */}
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">
                    NO. TELEPON
                  </p>
                  {editMode ? (
                    <input
                      value={form.no_telepon}
                      onChange={e => setForm({...form, no_telepon: e.target.value})}
                      placeholder="08xxxxxxxxxx"
                      type="tel"
                      className="w-full bg-white/10 border border-white/20 text-white
                                 rounded-xl px-4 py-2.5 text-sm focus:outline-none
                                 focus:ring-2 focus:ring-blue-400 transition"
                    />
                  ) : (
                    <p className="text-white font-semibold">
                      {profil.no_telepon || (
                        <span className="text-gray-500 italic">Belum diisi</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Tanggal daftar */}
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">
                    BERGABUNG SEJAK
                  </p>
                  <p className="text-gray-300 text-sm">{fmtTglDaftar(profil.dibuat_pada)}</p>
                </div>

                {/* Tombol edit */}
                {editMode && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditMode(false)
                        setForm({ nama: profil.nama, no_telepon: profil.no_telepon || '' })
                      }}
                      className="flex-1 border border-white/20 text-gray-300
                                 hover:bg-white/10 py-2.5 rounded-xl text-sm transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSimpan}
                      disabled={saving}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                                 text-white font-bold py-2.5 rounded-xl text-sm transition"
                    >
                      {saving ? 'Menyimpan...' : 'Simpan'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Menu tambahan */}
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-6">
              <Link to="/riwayat"
                className="flex items-center justify-between px-5 py-4
                           border-b border-white/10 hover:bg-white/5 transition">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎟</span>
                  <span className="text-sm font-medium">Riwayat Tiket</span>
                </div>
                <span className="text-gray-500">→</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between px-5 py-4
                           hover:bg-red-900/20 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚪</span>
                  <span className="text-sm font-medium text-red-400">Logout</span>
                </div>
                <span className="text-gray-500">→</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}