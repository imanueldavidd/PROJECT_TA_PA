// pages/customer/ETicket.jsx
// E-tiket setelah pembayaran berhasil

import { useNavigate, useLocation } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)
const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
               'Juli','Agustus','September','Oktober','November','Desember']

const fmtTanggal = (str) => {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export default function ETicket() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { pesanan } = location.state || {}

  if (!pesanan) { navigate('/'); return null }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1e35] to-[#1a2a4a]
                    flex flex-col items-center py-12 px-4">

      {/* Status sukses */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-2xl border-2 border-white/20
                        bg-green-500/20 flex items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h1 className="text-white font-black text-2xl sm:text-3xl">PEMBAYARAN BERHASIL!</h1>
        <p className="text-blue-300 text-xs tracking-widest mt-1">
          TIKET KAMU SUDAH SIAP
        </p>
      </div>

      {/* Kartu tiket per kursi */}
      <div className="space-y-4 w-full max-w-lg">
        {pesanan.tiket?.map((t, i) => (
          <div key={i} className="flex rounded-2xl overflow-hidden shadow-2xl">

            {/* Sisi kiri — biru gelap */}
            <div className="bg-[#0f1e35] w-32 sm:w-40 shrink-0
                            flex flex-col items-center justify-center
                            p-4 text-white text-center">
              <span className="text-3xl mb-2">🎬</span>
              <p className="font-black text-xs sm:text-sm leading-tight">
                {pesanan.nama_studio}
              </p>
              <p className="text-blue-300 text-[9px] mt-1 uppercase tracking-wide">
                Bioskop 7
              </p>
            </div>

            {/* Sisi kanan — putih */}
            <div className="flex-1 bg-white p-4 sm:p-5 text-gray-900">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-[9px] tracking-widest">JUDUL FILM</p>
                  <p className="font-black text-base sm:text-lg leading-tight">
                    {pesanan.judul_film}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-gray-400 text-[9px] tracking-widest">HALL</p>
                  <p className="font-bold text-xs">{pesanan.nama_studio}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
                <div>
                  <p className="text-gray-400 text-[9px] tracking-widest">TANGGAL</p>
                  <p className="font-semibold">{fmtTanggal(pesanan.tanggal)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] tracking-widest">WAKTU</p>
                  <p className="font-semibold">{pesanan.jam_tayang} WIB</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[9px] tracking-widest">KURSI</p>
                  <p className="font-black text-lg text-gray-900">{t.kursi}</p>
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 my-3" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-gray-400 text-[9px] tracking-widest">ORDER ID</p>
                  <p className="font-mono font-bold text-gray-700 text-xs">
                    {pesanan.kode_booking}
                  </p>
                </div>
                <QRCodeSVG
                  value={t.qr_token}
                  size={60}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol aksi */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-lg">
        <button
          onClick={() => navigate('/riwayat')}
          className="flex-1 bg-white text-gray-900 font-bold py-3 rounded-xl
                     text-sm transition hover:bg-gray-100"
        >
          📋 Lihat Semua Pesanan
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 border-2 border-white/30 text-white font-bold
                     py-3 rounded-xl text-sm transition hover:bg-white/10"
        >
          🏠 Kembali ke Beranda
        </button>
      </div>

      <p className="text-blue-200/40 text-xs text-center mt-6 max-w-xs">
        Tunjukkan QR code ini kepada petugas bioskop saat masuk studio
      </p>
    </div>
  )
}