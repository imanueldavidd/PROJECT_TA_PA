// pages/customer/RiwayatPesanan.jsx
// Riwayat pemesanan tiket customer

import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import customerApi from '../../services/customerApi'

const API_BASE  = import.meta.env.VITE_API_BASE_URL
const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun',
               'Jul','Agu','Sep','Okt','Nov','Des']

const fmtTgl = (str) => {
  if (!str) return ''
  const d = new Date(str)
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

// ── Komponen: Modal Detail Tiket ──────────────────────────
function ModalDetailTiket({ pesanan, onTutup }) {
  const BULAN_PANJANG = ['Januari','Februari','Maret','April','Mei','Juni',
                          'Juli','Agustus','September','Oktober','November','Desember']
  const fmtTglPanjang = (str) => {
    if (!str) return ''
    const d = new Date(str + 'T00:00:00')
    return `${d.getDate()} ${BULAN_PANJANG[d.getMonth()]} ${d.getFullYear()}`
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center
                    justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a2a4a] rounded-2xl w-full max-w-lg my-4">

        {/* Header modal */}
        <div className="flex items-center justify-between px-5 py-4
                        border-b border-white/10">
          <h3 className="text-white font-bold">Detail Tiket</h3>
          <button
            onClick={onTutup}
            className="text-gray-400 hover:text-white transition text-xl"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* E-tiket per kursi */}
          {pesanan.tiket_detail?.map((t, i) => (
            <div key={i} className="flex rounded-2xl overflow-hidden shadow-xl">

              {/* Sisi kiri */}
              <div className="bg-[#0f1e35] w-28 shrink-0 flex flex-col
                              items-center justify-center p-3 text-white text-center">
                <span className="text-2xl mb-1">🎬</span>
                <p className="font-black text-xs leading-tight">{pesanan.nama_studio}</p>
                <p className="text-blue-300 text-[9px] mt-1">BIOSKOP 7</p>
              </div>

              {/* Sisi kanan */}
              <div className="flex-1 bg-white p-4 text-gray-900">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-gray-400 text-[9px] tracking-widest">FILM</p>
                    <p className="font-black text-sm leading-tight">{pesanan.judul_film}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-gray-400 text-[9px] tracking-widest">HALL</p>
                    <p className="font-bold text-xs">{pesanan.nama_studio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-xs mb-3">
                  <div>
                    <p className="text-gray-400 text-[9px] tracking-widest">TANGGAL</p>
                    <p className="font-semibold text-xs">{fmtTglPanjang(pesanan.tanggal)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] tracking-widest">WAKTU</p>
                    <p className="font-semibold">{pesanan.jam_tayang} WIB</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[9px] tracking-widest">KURSI</p>
                    <p className="font-black text-base">{t.kode_kursi}</p>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-200 my-2" />

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-gray-400 text-[9px] tracking-widest">ORDER ID</p>
                    <p className="font-mono font-bold text-gray-700 text-[10px]">
                      {pesanan.kode_booking}
                    </p>
                  </div>
                  <QRCodeSVG
                    value={t.qr_token}
                    size={56}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={onTutup}
            className="w-full border border-white/20 text-gray-300
                       hover:bg-white/10 py-3 rounded-xl text-sm transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}


// ── Halaman Utama Riwayat ─────────────────────────────────
export default function RiwayatPesanan() {
  const navigate  = useNavigate()
  const nama      = localStorage.getItem('customer_nama') || ''
  const isLogin   = !!localStorage.getItem('customer_token')

  const [data,          setData]          = useState([])
  const [loading,       setLoading]       = useState(true)
  const [modalPesanan,  setModalPesanan]  = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  useEffect(() => {
    if (!isLogin) { navigate('/login'); return }
    customerApi.get('/api/customer/riwayat')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Ambil detail tiket (QR) saat buka modal
  const handleLihatDetail = async (pesanan) => {
    setLoadingDetail(true)
    try {
      const res = await customerApi.get(`/api/customer/riwayat/${pesanan.id}`)
      setModalPesanan(res.data)
    } catch {
      // Kalau endpoint detail belum ada, pakai data yang ada
      setModalPesanan({ ...pesanan, tiket_detail: [] })
    } finally {
      setLoadingDetail(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] text-white">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0f1e35]/95 backdrop-blur
                      border-b border-white/10 px-4 sm:px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition">←</button>
            <Link to="/" className="font-black text-white">🎬 BIOSKOP 7</Link>
          </div>
          <span className="text-gray-400 text-sm hidden sm:block">
            Hei, <strong className="text-white">{nama}</strong>
          </span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-2xl font-black mb-2">Pesanan Saya</h1>
        <p className="text-gray-400 text-sm mb-6">Riwayat tiket yang pernah kamu beli</p>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-10 h-10 border-4 border-blue-400
                            border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-400">Memuat riwayat...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎟</p>
            <p className="text-white font-bold text-lg mb-1">Belum ada pesanan</p>
            <p className="text-gray-400 text-sm mb-6">
              Yuk pesan tiket film favoritmu!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold
                         px-8 py-3 rounded-xl transition"
            >
              Pesan Tiket Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((p) => (
              <div key={p.id}
                className="bg-white/5 border border-white/10 rounded-2xl
                           overflow-hidden hover:border-white/20 transition">

                <div className="flex gap-4 p-4">
                  {/* Poster kecil */}
                  <div className="w-14 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-800">
                    {p.poster_url ? (
                      <img src={`${API_BASE}${p.poster_url}`} alt={p.judul_film}
                           className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎬
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base truncate">
                        {p.judul_film}
                      </h3>
                      {/* Badge status */}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                       shrink-0 whitespace-nowrap
                        ${p.status_bayar === 'lunas'
                          ? 'bg-green-900/60 text-green-400 border border-green-700/50'
                          : 'bg-gray-700 text-gray-400'}`}>
                        {p.status_bayar === 'lunas' ? '✓ LUNAS' : p.status_bayar.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-400 text-xs mt-1">
                      {p.nama_studio} • {fmtTgl(p.tanggal)} • {p.jam_tayang}
                    </p>

                    <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                      <div>
                        <p className="text-gray-500 text-xs">{p.jumlah_tiket} tiket</p>
                        <p className="text-blue-400 font-bold text-sm">
                          {fmtRupiah(p.total_harga)}
                        </p>
                      </div>
                      <p className="text-gray-600 text-xs font-mono">{p.kode_booking}</p>
                    </div>
                  </div>
                </div>

                {/* Tombol lihat tiket */}
                {p.status_bayar === 'lunas' && (
                  <div className="border-t border-white/5 px-4 py-3">
                    <button
                      onClick={() => handleLihatDetail(p)}
                      disabled={loadingDetail}
                      className="w-full sm:w-auto bg-blue-600/20 hover:bg-blue-600/40
                                 border border-blue-500/30 text-blue-300 font-semibold
                                 px-5 py-2 rounded-xl text-xs transition
                                 disabled:opacity-60"
                    >
                      {loadingDetail ? '⏳ Memuat...' : '🎟 Lihat E-Tiket'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal detail tiket */}
      {modalPesanan && (
        <ModalDetailTiket
          pesanan={modalPesanan}
          onTutup={() => setModalPesanan(null)}
        />
      )}
    </div>
  )
}