// pages/customer/DetailFilm.jsx
// Detail film + pilih tanggal + pilih jam tayang + trailer YouTube (modal)

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import RatingFilm from '../../components/RatingFilm'

const API_BASE = import.meta.env.VITE_API_BASE_URL

const posterSrc = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

// ── Helper ────────────────────────────────────────────────
const HARI  = ['Min','Sen','Sel','Rab','Kam','Jum','Sab']
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

const fmtTanggal = (str) => {
  const d = new Date(str + 'T00:00:00')
  return {
    hari:    HARI[d.getDay()],
    tgl:     d.getDate(),
    bulan:   BULAN[d.getMonth()],
    lengkap: `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
  }
}

// Helper ekstrak YouTube ID
const getYoutubeId = (url) => {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// ── Modal Trailer ─────────────────────────────────────────
function ModalTrailer({ trailerUrl, onClose }) {
  const videoId = getYoutubeId(trailerUrl)
  if (!videoId) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-3xl font-bold
                     hover:text-gray-300 transition"
        >
          ✕
        </button>
        <div className="relative w-full rounded-2xl overflow-hidden bg-black"
             style={{ aspectRatio: '16/9' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`}
            title="Trailer Film"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      </div>
    </div>
  )
}

export default function DetailFilm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isLogin  = !!localStorage.getItem('customer_token')

  const [film,         setFilm]         = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [tanggalAktif, setTanggalAktif] = useState(null)
  const [jamAktif,     setJamAktif]     = useState(null)
  const [showTrailer,  setShowTrailer]  = useState(false)

  useEffect(() => {
    axios.get(`${API_BASE}/api/customer/films/${id}`)
      .then(r => {
        setFilm(r.data)
        if (r.data.jadwal?.length > 0) {
          setTanggalAktif(r.data.jadwal[0].tanggal)
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const jadwalPerTanggal = film?.jadwal?.reduce((acc, j) => {
    if (!acc[j.tanggal]) acc[j.tanggal] = []
    acc[j.tanggal].push(j)
    return acc
  }, {}) ?? {}

  const tanggalList = Object.keys(jadwalPerTanggal).sort()
  const jamList = tanggalAktif ? (jadwalPerTanggal[tanggalAktif] || []) : []
  const jadwalDipilih = jamAktif ? jamList.find(j => j.id === jamAktif) : null

  const handlePilihKursi = () => {
    if (!isLogin) { navigate('/login'); return }
    if (!jadwalDipilih) return
    navigate(`/pilih-kursi/${jadwalDipilih.id}`, {
      state: { film, jadwal: jadwalDipilih }
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#1a2a4a] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!film) return null

  return (
    <div className="min-h-screen bg-[#1a2a4a] text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#1a2a4a]/95 backdrop-blur
                      border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')}
            className="text-gray-400 hover:text-white transition text-sm flex items-center gap-1">
            ← Beranda
          </button>
          <span className="text-gray-600">|</span>
          <Link to="/" className="font-black text-white">🎬 BIOSKOP 7</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── Kiri: Poster + Info Film ── */}
          <div className="flex flex-row lg:flex-col gap-4 lg:gap-0 lg:w-72 shrink-0">

            {/* Poster + tombol trailer */}
            <div className="w-28 sm:w-36 lg:w-full shrink-0 relative">
              {film.poster_url ? (
                <img src={posterSrc(film.poster_url)} alt={film.judul}
                    className="w-full rounded-2xl shadow-2xl"
                    style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
              ) : (
                <div className="w-full rounded-2xl bg-gray-800 flex items-center
                                justify-center text-5xl"
                    style={{ aspectRatio: '2/3' }}>🎬</div>
              )}

              {film.trailer_url && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="absolute bottom-3 left-1/2 -translate-x-1/2
                            bg-white/90 hover:bg-white text-gray-900 font-bold
                            text-xs px-4 py-2 rounded-full flex items-center gap-1.5
                            shadow-lg transition"
                >
                  ▶ Lihat Trailer
                </button>
              )}
            </div>

            {/* Info film (mobile: di samping poster) */}
            <div className="flex-1 lg:mt-4">
              <h1 className="font-black text-lg sm:text-xl lg:text-2xl leading-tight">
                {film.judul}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{film.genre}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {film.rating && (
                  <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-lg">
                    {film.rating}
                  </span>
                )}
                {film.durasi_menit && (
                  <span className="bg-white/10 text-gray-300 text-xs px-2 py-1 rounded-lg">
                    ⏱ {film.durasi_menit} mnt
                  </span>
                )}
              </div>

              {/* Sinopsis desktop */}
              {film.sinopsis && (
                <div className="hidden lg:block mt-4">
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-1">SINOPSIS</p>
                  <p className="text-gray-300 text-sm leading-relaxed line-clamp-6">{film.sinopsis}</p>
                </div>
              )}

              {/* Sinopsis mobile */}
              {film.sinopsis && (
                <div className="lg:hidden mb-4 bg-white/5 rounded-2xl p-4">
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">SINOPSIS</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{film.sinopsis}</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Kanan: Pilih Jadwal ── */}
          <div className="flex-1">

            {/* Sinopsis mobile (duplikat sengaja disembunyikan di lg agar tidak dobel) */}
            {film.sinopsis && (
              <div className="lg:hidden mb-6 bg-white/5 rounded-2xl p-4 hidden">
                <p className="text-xs text-gray-400 font-bold tracking-widest mb-2">SINOPSIS</p>
                <p className="text-gray-300 text-sm leading-relaxed">{film.sinopsis}</p>
              </div>
            )}

            {film.status === 'segera' || tanggalList.length === 0 ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-yellow-500/30 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-yellow-500 text-yellow-900 text-xs font-bold
                                     px-2.5 py-1 rounded-full">
                      SEGERA TAYANG
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {film.sinopsis || 'Informasi film ini akan segera tersedia.'}
                  </p>
                  {film.genre && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {film.genre.split(',').map(g => (
                        <span key={g}
                          className="bg-white/10 text-gray-300 text-xs px-2.5 py-1 rounded-lg">
                          {g.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  {film.durasi_menit && (
                    <p className="text-gray-400 text-sm mt-3">
                      ⏱ Durasi: {film.durasi_menit} menit
                    </p>
                  )}
                </div>

                <div className="bg-white/5 rounded-2xl p-5 text-center">
                  <p className="text-3xl mb-2">🕐</p>
                  <p className="font-bold text-white mb-1">Belum Bisa Dipesan</p>
                  <p className="text-gray-400 text-sm">
                    Jadwal tayang belum tersedia. Pantau terus!
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 border border-white/20 text-gray-300
                               hover:bg-white/10 px-6 py-2.5 rounded-xl text-sm transition"
                  >
                    ← Kembali ke Beranda
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xs text-gray-400 font-bold tracking-widest mb-3">
                    1. PILIH TANGGAL & WAKTU
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {tanggalList.map((tgl) => {
                      const info   = fmtTanggal(tgl)
                      const aktif  = tgl === tanggalAktif
                      return (
                        <button
                          key={tgl}
                          onClick={() => { setTanggalAktif(tgl); setJamAktif(null) }}
                          className={`flex flex-col items-center px-4 py-3 rounded-xl
                                     border-2 transition shrink-0 min-w-[60px]
                            ${aktif
                              ? 'border-blue-500 bg-blue-600 text-white'
                              : 'border-white/20 bg-white/5 text-gray-300 hover:border-blue-400'}`}
                        >
                          <span className="text-xs font-medium">{info.hari}</span>
                          <span className="text-xl font-black leading-tight">{info.tgl}</span>
                          <span className="text-xs">{info.bulan}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {tanggalAktif && (
                  <div className="mb-6">
                    <div className="flex flex-wrap gap-2">
                      {jamList.map((j) => {
                        const habis = j.kursi_tersedia === 0
                        const aktif = j.id === jamAktif
                        return (
                          <button
                            key={j.id}
                            onClick={() => !habis && setJamAktif(j.id)}
                            disabled={habis}
                            className={`px-5 py-2.5 rounded-xl border-2 text-sm font-bold
                                        transition
                              ${habis
                                ? 'border-gray-700 bg-gray-800/50 text-gray-600 cursor-not-allowed'
                                : aktif
                                ? 'border-blue-500 bg-blue-600 text-white'
                                : 'border-white/20 bg-white/5 text-gray-300 hover:border-blue-400'
                              }`}
                          >
                            {j.jam_tayang}
                            {habis && <span className="block text-[10px] text-red-500">Habis</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {jadwalDipilih && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-4
                                  flex flex-col sm:flex-row sm:items-center
                                  justify-between gap-4">
                    <div className="text-sm text-gray-300">
                      <p className="font-bold text-white">
                        {fmtTanggal(tanggalAktif).lengkap} • {jadwalDipilih.jam_tayang}
                      </p>
                      <p className="text-gray-400 mt-0.5">
                        {jadwalDipilih.nama_studio} • 
                        <span className="text-blue-400 font-semibold ml-1">
                          Rp {jadwalDipilih.harga_tiket.toLocaleString('id-ID')} / kursi
                        </span>
                      </p>
                      <p className="text-green-400 text-xs mt-0.5">
                        {jadwalDipilih.kursi_tersedia} kursi tersedia
                      </p>
                    </div>

                    <button
                      onClick={handlePilihKursi}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold
                                 px-6 py-3 rounded-xl text-sm transition
                                 flex items-center gap-2 justify-center shrink-0"
                    >
                      PILIH KURSI →
                    </button>
                  </div>
                )}

                {tanggalAktif && !jamAktif && (
                  <p className="text-gray-500 text-sm mt-2">
                    ↑ Pilih jam tayang untuk melanjutkan
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating & Ulasan Film */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <hr className="border-white/10 mb-8" />
        <RatingFilm filmId={parseInt(id)} />
      </div>

      {/* Modal Trailer */}
      {showTrailer && (
        <ModalTrailer
          trailerUrl={film.trailer_url}
          onClose={() => setShowTrailer(false)}
        />
      )}

    </div>
  )
}