// pages/customer/LandingPage.jsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE  = import.meta.env.VITE_API_BASE_URL
const posterSrc = (url) => {
  if (!url) return null
  if (url.startsWith('http')) return url        // Cloudinary URL
  return `${API_BASE}${url}`                    // URL lokal lama
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

// Modal Trailer
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
// ════════════════════════════════════════════════════════
// Navbar
// ════════════════════════════════════════════════════════
function Navbar({ isLogin, nama, onLogout }) {
  const [scrolled,    setScrolled]    = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate    = useNavigate()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
      ${scrolled ? 'bg-[#1a2a4a]/95 backdrop-blur shadow-lg' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-xl sm:text-2xl">🎬</span>
          <span className="font-black text-white text-base sm:text-lg tracking-tight">BIOSKOP 7</span>
        </Link>

        {/* Auth area */}
        {isLogin ? (
          /* Avatar + dropdown */
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center
                         text-white font-bold text-sm hover:bg-blue-700 transition"
            >
              {nama?.[0]?.toUpperCase() || '👤'}
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 bg-white rounded-xl shadow-2xl
                              border border-gray-100 w-44 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Masuk sebagai</p>
                  <p className="font-bold text-gray-800 text-sm truncate">{nama}</p>
                </div>
                <Link to="/profil"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                             hover:bg-gray-50 transition">
                  👤 Data Diri
                </Link>
                <Link to="/riwayat"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700
                             hover:bg-gray-50 transition">
                  🎟 Riwayat Tiket
                </Link>
                <button
                  onClick={() => { setDropdownOpen(false); onLogout() }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500
                             hover:bg-red-50 transition border-t border-gray-100">
                  🚪 LogOut
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Tombol Login */
          <Link to="/login"
            className="bg-white text-gray-900 font-bold px-5 py-2 rounded-lg
                       text-sm hover:bg-gray-100 transition tracking-wide">
            LOGIN
          </Link>
        )}
      </div>
    </nav>
  )
}


// ════════════════════════════════════════════════════════
// Hero Banner — auto-slide dengan preview poster.
function HeroBanner({ bannerList, onKlikFilm }) {
  const [aktif, setAktif] = useState(0)
  const intervalRef = useRef(null)

  // Ambil maksimal 5 data banner dari API publik
  const dataBanner = bannerList.slice(0, 5)

  const mulaiInterval = () => {
    clearInterval(intervalRef.current)
    if (dataBanner.length < 2) return
    intervalRef.current = setInterval(() => {
      setAktif(prev => (prev + 1) % dataBanner.length)
    }, 5000)
  }

  useEffect(() => {
    setAktif(0)
    mulaiInterval()
    return () => clearInterval(intervalRef.current)
  }, [dataBanner.length])

  const ganti = (idx) => {
    setAktif(idx)
    mulaiInterval()
  }

  if (dataBanner.length === 0) return null
  const itemAktif = dataBanner[aktif]

  return (
    <div className="relative h-[75vh] sm:h-[85vh] overflow-hidden bg-gray-950">

      {/* Background slides */}
      {dataBanner.map((b, i) => (
        <div key={b.id}
          className={`absolute inset-0 transition-opacity duration-1000
            ${i === aktif ? 'opacity-100' : 'opacity-0'}`}>
          {b.gambar_url // Membaca properti banner dari API Claude (gambar_url / poster_url sesuaikan backend)
            ? <img src={posterSrc(b.gambar_url)} alt={b.judul || 'Banner'}
                   className="w-full h-full object-cover object-top scale-110" />
            : <div className="w-full h-full bg-gray-900" />
          }
          {/* Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0d1929]/95 via-[#0d1929]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-[#0d1929]/30" />
        </div>
      ))}

      {/* Konten */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                      flex flex-col lg:flex-row items-center justify-center lg:justify-between
                      gap-6 pt-20">

        {/* Teks kiri */}
        <div className="max-w-sm sm:max-w-lg text-center lg:text-left">
          <span className="inline-block bg-white text-gray-900 font-black text-xs
                           px-3 py-1.5 rounded-lg tracking-widest mb-4">
            BIOSKOP 7
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-3 uppercase">
            {itemAktif.judul || 'BARU RILIS'}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base mb-5 line-clamp-2">
            {itemAktif.sinopsis || 'Film-film terbaru pilihan terbaik untuk teman waktu nontonmu.'}
          </p>
          <button
            onClick={() => onKlikFilm(itemAktif.film_id || itemAktif.id)}
            className="flex items-center gap-2 bg-white/10 backdrop-blur
                       border border-white/30 text-white font-bold
                       px-5 py-3 rounded-xl text-sm hover:bg-white/20 transition
                       mx-auto lg:mx-0"
          >
            📅 SAKSIKAN SEKARANG
            <span className="text-xs font-normal text-gray-300">DI BIOSKOP 7</span>
          </button>
        </div>

        {/* Panel poster kanan */}
        <div className="relative shrink-0">
          <div className="flex items-center gap-3 mb-3 justify-center">
            <div className="h-px flex-1 bg-white/30 max-w-[60px]" />
            <span className="text-white font-bold text-xs tracking-widest">HIGHLIGHTS</span>
            <div className="h-px flex-1 bg-white/30 max-w-[60px]" />
          </div>

          {/* Grid 3 poster preview */}
          <div className="flex gap-2 sm:gap-3">
            {dataBanner.slice(0, 3).map((b, i) => (
              <div key={b.id}
                onClick={() => ganti(i)}
                className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300
                  ${i === aktif ? 'ring-2 ring-white scale-105' : 'opacity-70 hover:opacity-90'}`}
                style={{ width: 110, aspectRatio: '2/3' }}
              >
                {b.gambar_url
                  ? <img src={posterSrc(b.gambar_url)} alt={b.judul}
                         className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-2xl">🎬</div>
                }
              </div>
            ))}
          </div>

          {/* Nama film di bawah poster */}
          <div className="flex gap-2 sm:gap-3 mt-2">
            {dataBanner.slice(0, 3).map((b) => (
              <div key={b.id} style={{ width: 110 }} className="text-center">
                <p className="text-white text-[10px] font-bold leading-tight truncate">{b.judul}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dot indicator */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
        {dataBanner.map((_, i) => (
          <button key={i} onClick={() => ganti(i)}
            className={`rounded-full transition-all duration-300
              ${i === aktif ? 'bg-white w-5 h-2' : 'bg-white/40 w-2 h-2'}`}
          />
        ))}
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Kartu Film
// ════════════════════════════════════════════════════════
function KartuFilm({ film, onClick, onTrailer, segera }) {
  return (
    <div
      onClick={onClick}
      className={`group rounded-xl overflow-hidden transition-all duration-300
        cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50`}
    >
      <div className="relative bg-gray-800" style={{ aspectRatio: '2/3' }}>
        {film.poster_url
          ? <img src={posterSrc(film.poster_url)} alt={film.judul}
                 className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-4xl">🎬</div>
        }

        {/* Badge TAYANG / SEGERA */}
        <span className={`absolute top-2 left-2 text-[10px] font-bold
                         px-2 py-0.5 rounded-full
          ${segera
            ? 'bg-yellow-500 text-yellow-900'
            : 'bg-red-500 text-white'}`}>
          {segera ? 'SEGERA' : 'TAYANG'}
        </span>

        {/* Rating badge */}
        {film.rating && (
          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur
                           text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            {film.rating}
          </span>
        )}

        {/* Overlay hover */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                        transition-opacity flex flex-col items-center justify-end gap-2 p-3">

          {/* Tombol Trailer — muncul kalau ada trailer_url */}
          {film.trailer_url && (
            <button
              onClick={(e) => { e.stopPropagation(); onTrailer(film.trailer_url) }}
              className="w-full bg-white/90 hover:bg-white text-gray-900
                         text-xs font-bold py-2 rounded-lg text-center
                         flex items-center justify-center gap-1.5 transition"
            >
              ▶ Lihat Trailer
            </button>
          )}

          <span className={`w-full text-white text-xs font-bold py-2 rounded-lg text-center
            ${segera ? 'bg-yellow-600' : 'bg-blue-600'}`}>
            {segera ? 'Lihat Detail' : 'Pesan Tiket'}
          </span>
        </div>
      </div>
        <div className="bg-gray-900 px-3 py-2">
          <h3 className="font-bold text-xs sm:text-sm text-white truncate">
            {film.judul}
          </h3>
          {film.genre && (
            <p className="text-gray-400 text-xs truncate mt-0.5">{film.genre}</p>
          )}
        </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Halaman Utama
// ════════════════════════════════════════════════════════
export default function LandingPage() {
  const navigate = useNavigate()
  const isLogin  = !!localStorage.getItem('customer_token')
  const nama     = localStorage.getItem('customer_nama') || ''
  const [trailerAktif, setTrailerAktif] = useState(null) // url trailer yang lagi dibuka

  const [filmTayang, setFilmTayang] = useState([])
  const [filmSegera, setFilmSegera] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [bannerList, setBannerList] = useState([])

  useEffect(() => {
    Promise.all([
      axios.get(`${API_BASE}/api/banner/publik`),
      axios.get(`${API_BASE}/api/customer/films?status_film=tayang`),
      axios.get(`${API_BASE}/api/customer/films?status_film=segera`),
    ]).then(([r0, r1, r2]) => {       // ← pakai r0, r1, r2 — konsisten
      setBannerList(r0.data)
      setFilmTayang(r1.data)
      setFilmSegera(r2.data)
    }).catch(err => {
      console.error("Gagal memuat data:", err)
    }).finally(() => setLoading(false))
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_nama')
    localStorage.removeItem('customer_id')
    window.location.reload()
  }

  const handleKlikFilm = (id) => navigate(`/film/${id}`)

  // Filter search
  const filtered = (list) => list.filter(f =>
    f.judul.toLowerCase().includes(search.toLowerCase()) ||
    (f.genre || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#1a2a4a] text-white">
      <Navbar isLogin={isLogin} nama={nama} onLogout={handleLogout} />

      {/* Hero */}
      {!loading && filmTayang.length > 0 && (
        <HeroBanner bannerList={bannerList} onKlikFilm={handleKlikFilm} />
      )}

      {/* Konten */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

        {/* Search */}
        <div className="relative mb-8">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari film..."
          className="w-full bg-white/10 backdrop-blur border border-white/20 text-white
                     rounded-2xl pl-11 pr-10 py-3 placeholder-gray-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-blue-400 border-t-transparent
                            rounded-full animate-spin mb-3" />
            <p className="text-gray-400">Memuat film...</p>
          </div>
        ) : (
          <>
            {/* SEDANG TAYANG */}
            {filtered(filmTayang).length > 0 && (
              <section className="mb-10 sm:mb-12">
                <h2 className="text-sm font-black text-gray-300 tracking-widest mb-4">
                  {search ? 'HASIL PENCARIAN' : 'SEDANG TAYANG'}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filtered(filmTayang).map(f => (
                    <KartuFilm
                      key={f.id}
                      film={f}
                      onClick={() => handleKlikFilm(f.id)}
                      onTrailer={(url) => setTrailerAktif(url)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* SEGERA TAYANG */}
            {filtered(filmSegera).length > 0 && (
              <section className="mb-10 sm:mb-12">
                <h2 className="text-sm font-black text-gray-300 tracking-widest mb-4">
                  SEGERA TAYANG
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {filtered(filmSegera).map(f => (
                    <KartuFilm
                      key={f.id}
                      film={f}
                      segera
                      onClick={() => handleKlikFilm(f.id)}
                      onTrailer={(url) => setTrailerAktif(url)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {!loading && filmTayang.length === 0 && filmSegera.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">🎬</p>
              <p className="text-gray-400">Belum ada film tersedia.</p>
            </div>
          )}
        </>
      )}
    </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-4">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xl">🎬</span>
            <span className="font-black text-white">BIOSKOP 7</span>
          </div>
          <p className="text-gray-500 text-xs">Nikmati pengalaman menonton terbaik © 2026</p>
        </div>
      </footer>
      {/* Modal Trailer */}
      {trailerAktif && (
        <ModalTrailer
          trailerUrl={trailerAktif}
          onClose={() => setTrailerAktif(null)}
        />
      )}
    </div>
  )
}