// components/RatingFilm.jsx
// Komponen rating bintang + ulasan — tampil di DetailFilm

import { useState, useEffect } from 'react'
import customerApi from '../services/customerApi'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// ── Komponen: Bintang interaktif ─────────────────────────
function InputBintang({ nilai, onChange, readonly = false }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => !readonly && onChange(b)}
          onMouseEnter={() => !readonly && setHover(b)}
          onMouseLeave={() => !readonly && setHover(0)}
          disabled={readonly}
          className={`text-2xl sm:text-3xl transition-transform
            ${!readonly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
            ${b <= (hover || nilai) ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Komponen: Bar distribusi rating ──────────────────────
function BarDistribusi({ label, jumlah, total }) {
  const persen = total > 0 ? (jumlah / total) * 100 : 0
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-700 rounded-full h-2">
        <div
          className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
          style={{ width: `${persen}%` }}
        />
      </div>
      <span className="text-gray-400 w-5 text-right">{jumlah}</span>
    </div>
  )
}


// ── Komponen Utama ────────────────────────────────────────
export default function RatingFilm({ filmId }) {
  const isLogin    = !!localStorage.getItem('customer_token')

  const [ratingData,  setRatingData]  = useState(null)
  const [cekData,     setCekData]     = useState(null)
  const [loading,     setLoading]     = useState(true)

  // Form rating
  const [bintang,     setBintang]     = useState(0)
  const [ulasan,      setUlasan]      = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [notif,       setNotif]       = useState('')
  const [showForm,    setShowForm]    = useState(false)

  const fetchRating = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/customer/films/${filmId}/rating`)
      setRatingData(res.data)
    } catch { }
  }

  const fetchCekRating = async () => {
    if (!isLogin) return
    try {
      const res = await customerApi.get(`/api/customer/films/${filmId}/cek-rating`)
      setCekData(res.data)
      // Pre-fill form kalau sudah pernah rating
      if (res.data.rating_saya) {
        setBintang(res.data.rating_saya.bintang)
        setUlasan(res.data.rating_saya.ulasan || '')
      }
    } catch { }
  }

  useEffect(() => {
    Promise.all([fetchRating(), fetchCekRating()])
      .finally(() => setLoading(false))
  }, [filmId])

  const handleSubmit = async () => {
    if (bintang === 0) { setNotif('❌ Pilih bintang terlebih dahulu!'); return }

    setSubmitting(true)
    setNotif('')
    try {
      await customerApi.post(`/api/customer/films/${filmId}/rating`, {
        bintang,
        ulasan,
      })
      setNotif('✅ Rating berhasil disimpan!')
      setShowForm(false)
      await Promise.all([fetchRating(), fetchCekRating()])
      setTimeout(() => setNotif(''), 3000)
    } catch (err) {
      setNotif('❌ ' + (err.response?.data?.detail || 'Gagal menyimpan rating.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleHapus = async () => {
    try {
      await customerApi.delete(`/api/customer/films/${filmId}/rating`)
      setBintang(0)
      setUlasan('')
      setShowForm(false)
      setNotif('✅ Rating berhasil dihapus.')
      await Promise.all([fetchRating(), fetchCekRating()])
      setTimeout(() => setNotif(''), 3000)
    } catch {
      setNotif('❌ Gagal menghapus rating.')
    }
  }

  if (loading) return null

  const stats = ratingData?.statistik
  const isRounded = (n) => Math.round(n) === n

  return (
    <div className="mt-8 border-t border-white/10 pt-8">
      <h3 className="font-bold text-lg text-white mb-5">Rating & Ulasan</h3>

      {/* ── Statistik Rating ── */}
      {stats && stats.total > 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-8">

            {/* Rata-rata besar */}
            <div className="text-center shrink-0">
              <p className="text-5xl font-black text-yellow-400">
                {stats.rata_rata.toFixed(1)}
              </p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(b => (
                  <span key={b}
                    className={`text-lg ${b <= Math.round(stats.rata_rata)
                      ? 'text-yellow-400' : 'text-gray-600'}`}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-gray-400 text-xs mt-1">
                {stats.total} ulasan
              </p>
            </div>

            {/* Bar distribusi */}
            <div className="flex-1 space-y-1.5">
              {[5,4,3,2,1].map(b => (
                <BarDistribusi
                  key={b}
                  label={`${b} ★`}
                  jumlah={stats[`bintang_${b}`]}
                  total={stats.total}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5
                        text-center text-gray-400">
          <p className="text-2xl mb-1">⭐</p>
          <p className="text-sm">Belum ada rating untuk film ini.</p>
        </div>
      )}

      {/* ── Notifikasi ── */}
      {notif && (
        <div className={`mb-4 p-3 rounded-xl text-sm
          ${notif.startsWith('✅')
            ? 'bg-green-900/40 border border-green-700/50 text-green-300'
            : 'bg-red-900/40 border border-red-700/50 text-red-300'}`}>
          {notif}
        </div>
      )}

      {/* ── Tombol / Form Rating ── */}
      {isLogin && cekData && (
        <div className="mb-6">
          {cekData.boleh_rating ? (
            <>
              {/* Sudah punya rating — tampilkan & beri opsi edit */}
              {cekData.sudah_rating && !showForm && (
                <div className="bg-yellow-900/20 border border-yellow-700/40
                                rounded-2xl p-4 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-yellow-300 text-sm font-semibold">
                      Rating kamu
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowForm(true)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={handleHapus}
                        className="text-xs text-red-400 hover:text-red-300 transition"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                  <InputBintang nilai={bintang} onChange={() => {}} readonly />
                  {ulasan && (
                    <p className="text-gray-300 text-sm mt-2 italic">"{ulasan}"</p>
                  )}
                </div>
              )}

              {/* Form rating */}
              {(!cekData.sudah_rating || showForm) && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <p className="text-white font-semibold text-sm mb-3">
                    {cekData.sudah_rating ? 'Edit Rating Kamu' : 'Beri Rating Film Ini'}
                  </p>

                  <div className="mb-3">
                    <InputBintang nilai={bintang} onChange={setBintang} />
                    {bintang > 0 && (
                      <p className="text-yellow-400 text-xs mt-1">
                        {['', 'Sangat Buruk', 'Buruk', 'Cukup', 'Bagus', 'Luar Biasa!'][bintang]}
                      </p>
                    )}
                  </div>

                  <textarea
                    value={ulasan}
                    onChange={e => setUlasan(e.target.value)}
                    placeholder="Tulis ulasanmu (opsional)..."
                    rows={3}
                    maxLength={500}
                    className="w-full bg-white/10 border border-white/20 text-white
                               rounded-xl px-4 py-3 placeholder-gray-400 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-400
                               transition resize-none mb-3"
                  />

                  <div className="flex gap-2">
                    {cekData.sudah_rating && (
                      <button
                        onClick={() => setShowForm(false)}
                        className="flex-1 sm:flex-none border border-white/20 text-gray-300
                                   hover:bg-white/10 px-4 py-2 rounded-xl text-sm transition"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || bintang === 0}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50
                                 text-gray-900 font-bold py-2 rounded-xl text-sm transition"
                    >
                      {submitting ? 'Menyimpan...' : '★ Simpan Rating'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Belum nonton — tampilkan info */
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4
                            text-center text-gray-400 text-sm">
              <p className="text-xl mb-1">🎟</p>
              <p>Tonton film ini terlebih dahulu untuk memberikan rating.</p>
            </div>
          )}
        </div>
      )}

      {/* Kalau belum login */}
      {!isLogin && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4
                        text-center text-gray-400 text-sm mb-5">
          <p>
            <a href="/login" className="text-blue-400 hover:text-blue-300">Login</a>
            {' '}untuk memberikan rating film ini.
          </p>
        </div>
      )}

      {/* ── Daftar Ulasan ── */}
      {ratingData?.ulasan?.length > 0 && (
        <div className="space-y-3">
          <p className="text-gray-400 text-xs font-bold tracking-widest">ULASAN PENONTON</p>
          {ratingData.ulasan.map((u, i) => (
            <div key={i}
              className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center
                                  justify-center text-xs font-bold text-white">
                    {u.nama_pengguna?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-white text-sm font-semibold">
                    {u.nama_pengguna}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(b => (
                    <span key={b}
                      className={`text-sm ${b <= u.bintang
                        ? 'text-yellow-400' : 'text-gray-600'}`}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-gray-300 text-sm italic">"{u.ulasan}"</p>
              <p className="text-gray-600 text-xs mt-1">
                {new Date(u.dibuat_pada).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}