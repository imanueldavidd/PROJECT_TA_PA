// pages/customer/Pembayaran.jsx
// Konfirmasi + bayar via Midtrans Snap

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import customerApi from '../../services/customerApi'

const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember']

const fmtTanggal = (str) => {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export default function Pembayaran() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { film, jadwal, kursiDipilih, jadwalId } = location.state || {}

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const total = (jadwal?.harga_tiket || 0) * (kursiDipilih?.length || 0)

  // Guard — kalau langsung akses URL ini tanpa state
  if (!film || !jadwal || !kursiDipilih) {
    navigate('/')
    return null
  }

  const handleBayar = async () => {
    setLoading(true)
    setError('')

    try {
      // 1. Minta Snap token dari backend
      const res = await customerApi.post('/api/customer/snap-token', {
        jadwal_id: jadwalId,
        kursi_ids: kursiDipilih.map(k => k.id),
      })

      const { snap_token, order_id } = res.data

      // 2. Buka popup Midtrans Snap
      window.snap.pay(snap_token, {
        onSuccess: async (result) => {
          try {
            // 3. Konfirmasi ke backend → simpan pemesanan + generate QR
            const konfirmasi = await customerApi.post('/api/customer/booking/konfirmasi', {
              jadwal_id: jadwalId,
              kursi_ids: kursiDipilih.map(k => k.id),
              order_id:  order_id,
            })
            // 4. Redirect ke halaman e-tiket
            navigate('/etiket', { state: { pesanan: konfirmasi.data } })
          } catch {
            setError('Pembayaran berhasil tapi gagal konfirmasi. Hubungi staff.')
          }
        },
        onPending: () => {
          setError('Pembayaran pending. Selesaikan pembayaran untuk mendapatkan tiket.')
        },
        onError: () => {
          setError('Pembayaran gagal. Silakan coba lagi.')
          setLoading(false)
        },
        onClose: () => {
          setError('Popup ditutup. Klik bayar lagi untuk melanjutkan.')
          setLoading(false)
        },
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal membuka halaman pembayaran.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] text-white">

      {/* Header */}
      <div className="bg-[#0f1e35] px-4 sm:px-8 py-5 border-b border-white/10">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition">←</button>
          <div>
            <h1 className="font-bold text-base sm:text-lg">Konfirmasi Pesanan</h1>
            <p className="text-gray-400 text-xs mt-0.5">Periksa detail sebelum membayar</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-4">

        {/* Ringkasan pesanan */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="bg-white/5 px-5 py-3 border-b border-white/10">
            <p className="text-xs font-bold text-gray-400 tracking-widest">RINGKASAN PESANAN</p>
          </div>
          <div className="p-5 space-y-3">
            {[
              { label: 'Film',    value: film.judul },
              { label: 'Studio',  value: jadwal.nama_studio },
              { label: 'Tanggal', value: fmtTanggal(jadwal.tanggal) },
              { label: 'Jam',     value: `${jadwal.jam_tayang} WIB` },
              { label: 'Kursi',   value: kursiDipilih.map(k => k.kode_kursi).join(', ') },
              { label: 'Jumlah',  value: `${kursiDipilih.length} tiket` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-right max-w-[200px]">{value}</span>
              </div>
            ))}
            <div className="border-t border-white/10 pt-3 flex justify-between">
              <span className="font-bold">Total Pembayaran</span>
              <span className="font-black text-blue-400 text-xl">{fmtRupiah(total)}</span>
            </div>
          </div>
        </div>

        {/* Info metode pembayaran */}
        <div className="bg-blue-900/30 border border-blue-700/40 rounded-2xl p-5">
          <p className="font-semibold text-blue-300 text-sm mb-3">
            💳 Metode Pembayaran Tersedia
          </p>
          <div className="flex flex-wrap gap-2">
            {['GoPay','OVO','DANA','ShopeePay','Transfer Bank','Kartu Kredit','Alfamart','Indomaret'].map(m => (
              <span key={m}
                className="bg-blue-900/50 text-blue-300 text-xs px-2.5 py-1
                           rounded-full border border-blue-700/50">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/40 border border-red-700/50
                          rounded-2xl text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Tombol bayar */}
        <button
          onClick={handleBayar}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                     text-white font-black py-4 rounded-2xl text-lg transition
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <><span className="animate-spin">⏳</span> Membuka pembayaran...</>
          ) : (
            `💳 Bayar ${fmtRupiah(total)}`
          )}
        </button>

        <p className="text-gray-500 text-xs text-center">
          Pembayaran diproses dengan aman oleh Midtrans 🔒
        </p>
      </div>
    </div>
  )
}