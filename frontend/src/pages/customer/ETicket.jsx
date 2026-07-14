// pages/customer/ETicket.jsx
// E-tiket dengan carousel per kursi (next/prev)

import { useState } from 'react'
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

// ── Kartu Tiket Tunggal ───────────────────────────────────
function KartuTiket({ tiket, pesanan, nomor, total }) {
  return (
    <div className="flex rounded-2xl overflow-hidden shadow-2xl bg-white w-full max-w-lg">

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
        {/* Nomor tiket dari total */}
        <div className="mt-3 bg-white/20 rounded-full px-3 py-1">
          <p className="text-white text-[10px] font-bold">
            {nomor}/{total}
          </p>
        </div>
      </div>

      {/* Sisi kanan — putih */}
      <div className="flex-1 p-4 sm:p-5">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-gray-400 text-[9px] tracking-widest">JUDUL FILM</p>
            <p className="font-black text-base sm:text-lg leading-tight text-gray-900">
              {pesanan.judul_film}
            </p>
          </div>
          <div className="text-right shrink-0 ml-2">
            <p className="text-gray-400 text-[9px] tracking-widest">HALL</p>
            <p className="font-bold text-xs text-gray-800">{pesanan.nama_studio}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <p className="text-gray-400 text-[9px] tracking-widest">TANGGAL</p>
            <p className="font-semibold text-gray-900">{fmtTanggal(pesanan.tanggal)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-[9px] tracking-widest">WAKTU</p>
            <p className="font-semibold text-gray-900">{pesanan.jam_tayang} WIB</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-400 text-[9px] tracking-widest">KURSI</p>
            <p className="font-black text-2xl text-gray-900">{tiket.kursi}</p>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 my-3" />

        <div className="flex items-end justify-between">
          <div>
            <p className="text-gray-400 text-[9px] tracking-widest">ORDER ID</p>
            <p className="font-mono font-bold text-gray-700 text-[10px]">
              {pesanan.kode_booking}
            </p>
          </div>
          <QRCodeSVG
            value={tiket.qr_token}
            size={64}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>
    </div>
  )
}


// ── Halaman Utama E-Tiket ─────────────────────────────────
export default function ETicket() {
  const navigate   = useNavigate()
  const location   = useLocation()
  const { pesanan } = location.state || {}

  const [tiketAktif, setTiketAktif] = useState(0)

  if (!pesanan) { navigate('/'); return null }

  const totalTiket  = pesanan.tiket?.length || 0
  const tiketSekarang = pesanan.tiket?.[tiketAktif]

  const prev = () => setTiketAktif(i => Math.max(0, i - 1))
  const next = () => setTiketAktif(i => Math.min(totalTiket - 1, i + 1))

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1e35] to-[#1a2a4a]
                    flex flex-col items-center py-10 px-4">

      {/* Status sukses */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 rounded-2xl border-2 border-green-400/30
                        bg-green-500/20 flex items-center justify-center
                        text-3xl mb-4">
          ✓
        </div>
        <h1 className="text-white font-black text-2xl sm:text-3xl text-center">
          PEMBAYARAN BERHASIL!
        </h1>
        <p className="text-blue-300 text-xs tracking-widest mt-1 text-center">
          TIKET KAMU SUDAH SIAP
        </p>
        <p className="text-gray-400 text-xs mt-2 text-center">
          📧 Konfirmasi tiket telah dikirim ke email kamu
        </p>
      </div>

      {/* Info ringkasan */}
      <div className="bg-white/10 border border-white/20 rounded-2xl
                      px-5 py-3 mb-6 w-full max-w-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Tiket</span>
          <span className="text-white font-bold">{totalTiket} kursi</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-400">Total Bayar</span>
          <span className="text-blue-400 font-black">{fmtRupiah(pesanan.total_harga)}</span>
        </div>
      </div>

      {/* Carousel tiket */}
      <div className="w-full max-w-lg">

        {/* Kartu tiket aktif */}
        {tiketSekarang && (
          <div className="transition-all duration-300">
            <KartuTiket
              tiket={tiketSekarang}
              pesanan={pesanan}
              nomor={tiketAktif + 1}
              total={totalTiket}
            />
          </div>
        )}

        {/* Kontrol carousel */}
        {totalTiket > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prev}
              disabled={tiketAktif === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         border border-white/20 text-white text-sm font-semibold
                         hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                         transition"
            >
              ← Sebelumnya
            </button>

            {/* Dot indicator */}
            <div className="flex gap-1.5">
              {pesanan.tiket.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTiketAktif(i)}
                  className={`rounded-full transition-all duration-300
                    ${i === tiketAktif
                      ? 'bg-white w-5 h-2'
                      : 'bg-white/40 w-2 h-2'}`}
                />
              ))}
            </div>

            <button
              onClick={next}
              disabled={tiketAktif === totalTiket - 1}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                         border border-white/20 text-white text-sm font-semibold
                         hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed
                         transition"
            >
              Berikutnya →
            </button>
          </div>
        )}

        {/* Daftar kursi semua */}
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {pesanan.tiket.map((t, i) => (
            <button
              key={i}
              onClick={() => setTiketAktif(i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition
                ${i === tiketAktif
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
            >
              {t.kursi}
            </button>
          ))}
        </div>
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
        Tunjukkan QR code kepada petugas bioskop saat masuk studio
      </p>
    </div>
  )
}