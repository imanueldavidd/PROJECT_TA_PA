// pages/karyawan/Tiket.jsx
// Flow: Pilih Jadwal → Pilih Kursi → Metode Bayar → Struk Berhasil

import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import api from '../../services/api'

// ── Helpers ───────────────────────────────────────────────
const fmtRupiah = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(n || 0)

const fmtTanggal = (str) => {
  if (!str) return ''
  const d = new Date(str + 'T00:00:00')
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
}

// ── Warna tombol kursi ────────────────────────────────────
const WARNA = {
  tersedia: 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50 cursor-pointer',
  pilihan:  'bg-blue-600 border-blue-600 text-white shadow-md cursor-pointer',
  penuh:    'bg-gray-400 border-gray-400 text-white cursor-not-allowed opacity-60',
}


// ════════════════════════════════════════════════════════
// STEP 1 — Pilih Jadwal
// ════════════════════════════════════════════════════════
function StepPilihJadwal({ onPilih }) {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/tiket/jadwal-hari-ini')
      .then(r => setList(r.data))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      <p className="text-blue-200 text-sm mb-6">
        Karyawan — <span className="text-white font-semibold">Input Pesanan</span>
      </p>

      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto">
        <h2 className="font-bold text-gray-800 text-xl mb-1">Pilih Jadwal Tayang</h2>
        <p className="text-gray-400 text-sm mb-5">Jadwal tersedia hari ini</p>

        {loading && <p className="text-center text-gray-400 py-8">Memuat jadwal...</p>}

        {!loading && list.length === 0 && (
          <p className="text-center text-gray-400 py-8">Tidak ada jadwal tayang hari ini.</p>
        )}

        <div className="space-y-2">
          {list.map((j) => (
            <button
              key={j.id}
              onClick={() => onPilih(j)}
              className="w-full flex items-center justify-between px-5 py-4
                         border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50
                         rounded-xl text-left transition group"
            >
              <div>
                <p className="font-bold text-gray-800 group-hover:text-blue-700">{j.judul_film}</p>
                <p className="text-gray-500 text-sm mt-0.5">{j.nama_studio} — {j.jam_tayang}</p>
              </div>
              <span className="text-blue-600 font-bold">{fmtRupiah(j.harga_tiket)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// STEP 2 — Pilih Kursi
// ════════════════════════════════════════════════════════
function StepPilihKursi({ jadwal, onKembali, onLanjut }) {
  const [kursiData,    setKursiData]    = useState([])
  const [kursiDipilih, setKursiDipilih] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  useEffect(() => {
    api.get(`/api/tiket/kursi/${jadwal.id}`)
      .then(r => setKursiData(r.data))
      .catch(() => setError('Gagal memuat denah kursi.'))
      .finally(() => setLoading(false))
  }, [jadwal.id])

  const toggleKursi = (kursi) => {
    if (kursi.status === 'penuh') return
    setKursiDipilih(prev =>
      prev.find(k => k.id === kursi.id)
        ? prev.filter(k => k.id !== kursi.id)
        : [...prev, kursi]
    )
  }

  // Kelompokkan per baris (huruf pertama kode kursi)
  const barisMap = kursiData.reduce((acc, k) => {
    const b = k.kode_kursi[0]
    if (!acc[b]) acc[b] = []
    acc[b].push(k)
    return acc
  }, {})
  const barisUrut = Object.keys(barisMap).sort()

  const total = jadwal.harga_tiket * kursiDipilih.length

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-8 pt-4">
        <p className="text-blue-200 text-sm mb-6">
          Karyawan — <span className="text-white font-semibold">Input Pesanan</span>
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          {/* Header + Legenda */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-bold text-gray-800 text-xl border-l-4 border-blue-600 pl-3">
              PILIH KURSI
            </h2>
            <div className="flex items-center gap-5 text-xs text-gray-500">
              {[
                { label: 'TERSEDIA', cls: 'border-gray-300 bg-white' },
                { label: 'PILIHAN',  cls: 'border-blue-600 bg-blue-600' },
                { label: 'PENUH',    cls: 'border-gray-400 bg-gray-400' },
              ].map(({ label, cls }) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded border-2 inline-block ${cls}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Layar bioskop */}
          <div className="text-center mb-6">
            <div className="mx-auto w-64 border-t-4 border-gray-800" />
            <p className="text-gray-400 text-xs tracking-widest mt-1">LAYAR BIOSKOP</p>
          </div>

          {/* Denah kursi */}
          {loading ? (
            <div className="text-center py-10 text-gray-400">Memuat denah kursi...</div>
          ) : (
            <div className="overflow-x-auto">
              {/* min-w aku perbesar sedikit ke 550px agar jalan yang lebar tidak terlipat ke bawah */}
              <div className="inline-block mx-auto min-w-[550px] pb-2 text-center w-full">
                {barisUrut.map((baris) => (
                  <div key={baris} className="flex items-center justify-center gap-1.5 mb-2">
                    {/* Label baris kiri */}
                    <span className="w-5 text-xs text-gray-400 font-bold text-right shrink-0 mr-2">
                      {baris}
                    </span>

                    {/* Tombol kursi */}
                    <div className="flex">
                      {barisMap[baris]
                        .sort((a, b) => parseInt(a.kode_kursi.slice(1)) - parseInt(b.kode_kursi.slice(1)))
                        .map((k) => {
                          const status = k.status === 'penuh' ? 'penuh'
                            : kursiDipilih.find(x => x.id === k.id) ? 'pilihan' : 'tersedia'
                          
                          // 1. Ambil angkanya saja (misal "A2" -> 2)
                          const nomorKursi = parseInt(k.kode_kursi.slice(1));
                          
                          // 2. Beri jarak jalan setelah kursi nomor 2 dan 9
                          const isJalan = nomorKursi === 2 || nomorKursi === 9;

                          return (
                            <button
                              key={k.id}
                              onClick={() => toggleKursi(k)}
                              disabled={k.status === 'penuh'}
                              // 3. Tambahkan logika isJalan ke dalam className margin
                              className={`w-8 h-7 sm:w-10 sm:h-9 rounded-t-lg border-2 text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center
                                ${WARNA[status]} 
                                ${isJalan ? 'mr-8 sm:mr-12' : 'mr-1 sm:mr-1.5'}
                              `}
                            >
                              {/* 4. Tampilkan nomor kursinya saja */}
                              {nomorKursi}
                            </button>
                          )
                        })
                      }
                    </div>

                    {/* Label baris kanan */}
                    <span className="w-5 text-xs text-gray-400 font-bold shrink-0 ml-2">
                      {baris}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

{/* Footer sticky */}
      <div className="sticky bottom-0 bg-gray-900 text-white px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 shadow-2xl">
        
        {/* Kontainer info kursi & total agar tetap bersebelahan di HP */}
        <div className="flex justify-between sm:justify-start gap-8 border-b border-gray-800 pb-3 sm:border-0 sm:pb-0">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Pilihan Kursi</p>
            <p className="font-semibold text-sm mt-0.5">
              {kursiDipilih.length > 0 ? kursiDipilih.map(k => k.kode_kursi).join(', ') : '--'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide">Total Bayar</p>
            <p className="font-bold text-base sm:text-lg text-blue-400 sm:text-white">{fmtRupiah(total)}</p>
          </div>
        </div>

        {/* Spacer transparan — hanya bekerja di layar desktop */}
        <div className="hidden sm:block flex-1" />

        {/* Kontainer Tombol Aksi (Batal & Lanjut) */}
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onKembali}
            className="flex-1 sm:flex-none text-center border border-gray-600 text-gray-300 hover:bg-gray-800 px-4 sm:px-6 py-2.5 rounded-lg text-sm transition"
          >
            KEMBALI
          </button>
          <button
            onClick={() => {
              if (kursiDipilih.length === 0) { setError('Pilih minimal 1 kursi!'); return }
              onLanjut(kursiDipilih)
            }}
            disabled={kursiDipilih.length === 0}
            className="flex-1 sm:flex-none text-center bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-bold px-4 sm:px-8 py-2.5 rounded-lg text-sm transition"
          >
            LANJUTKAN
          </button>
        </div>

      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// STEP 3 — Metode Pembayaran
// ════════════════════════════════════════════════════════
function StepMetodeBayar({ jadwal, kursiDipilih, onKembali, onBerhasil }) {
  const [metode,       setMetode]       = useState('')       // '' | 'cash' | 'qris'
  const [uangDiterima, setUangDiterima] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const total     = jadwal.harga_tiket * kursiDipilih.length
  const kembalian = parseFloat(uangDiterima || 0) - total

  // Format tanggal untuk KOTAK TIKET
  const tanggalFmt = fmtTanggal(jadwal.tanggal)

  // ── Konfirmasi pembayaran ────────────────────────────
  const handleKonfirmasi = async () => {
    if (!metode) { setError('Pilih metode pembayaran!'); return }
    if (metode === 'cash') {
      if (!uangDiterima || parseFloat(uangDiterima) < total) {
        setError('Uang yang diterima kurang dari total tagihan!')
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/api/tiket/pesan', {
        jadwal_id:     jadwal.id,
        kursi_ids:     kursiDipilih.map(k => k.id),
        metode_bayar:  metode,
        uang_diterima: metode === 'cash' ? parseFloat(uangDiterima) : total,
      })
      onBerhasil(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal memproses pembayaran.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#2d4a6b]">
      {/* Header biru tua */}
      <div className="bg-[#1e3550] px-8 py-5 flex items-center gap-4">
        <button onClick={onKembali} className="text-white text-xl hover:opacity-70">←</button>
        <div>
          <h1 className="text-white font-bold text-2xl tracking-wide">METODE PEMBAYARAN</h1>
          <p className="text-blue-300 text-xs tracking-widest mt-0.5">
            TRANSACTION_ID: {jadwal.id}-{kursiDipilih.map(k=>k.kode_kursi).join('')}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">

        {/* ── Panel Kiri: Pilih Metode ── */}
        <div className="flex-1 space-y-5">
          <p className="text-blue-300 text-xs font-bold tracking-widest">STEP 01</p>

          {/* Pilih metode */}
          <div className="bg-white rounded-xl p-5">
            <h3 className="font-bold text-gray-800 text-base mb-4">PILIH METODE PEMBAYARAN</h3>
            <div className="grid grid-cols-2 gap-3">
              {/* QRIS */}
              <button
                onClick={() => { setMetode('qris'); setError('') }}
                className={`relative p-4 rounded-xl border-2 text-left transition
                  ${metode === 'qris'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'}`}
              >
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  INSTANT
                </span>
                <div className="text-2xl mb-1">⬛</div>
                <p className="font-bold text-gray-800">QRIS</p>
                <p className="text-gray-400 text-xs mt-0.5">Universal QR Payment</p>
              </button>

              {/* CASH */}
              <button
                onClick={() => { setMetode('cash'); setError('') }}
                className={`relative p-4 rounded-xl border-2 text-left transition
                  ${metode === 'cash'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'}`}
              >
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  INSTANT
                </span>
                <div className="text-2xl mb-1">💵</div>
                <p className="font-bold text-gray-800">CASH</p>
                <p className="text-gray-400 text-xs mt-0.5">Pembayaran Tunai</p>
              </button>
            </div>
          </div>

          {/* ── Panel QRIS ── */}
          {metode === 'qris' && (
            <div className="bg-white rounded-xl p-5">
              <h3 className="font-bold text-gray-800 text-base mb-4">SCAN UNTUK MEMBAYAR</h3>
              <div className="flex flex-col items-center gap-3">
                {/* QR statis mewakili nominal — di produksi nyata ini dari payment gateway */}
                <div className="border-4 border-gray-800 rounded-xl p-3">
                  <QRCodeSVG
                    value={`QRIS:bioskop:${jadwal.id}:${total}:${Date.now()}`}
                    size={180}
                    level="M"
                    includeMargin
                  />
                </div>
                <p className="text-gray-500 text-sm text-center">
                  Scan QR di atas menggunakan aplikasi pembayaran apapun
                </p>
                <p className="font-bold text-blue-700 text-xl">{fmtRupiah(total)}</p>
              </div>

              {/* Tombol konfirmasi setelah customer scan */}
              <button
                onClick={handleKonfirmasi}
                disabled={loading}
                className="w-full mt-5 bg-gray-800 hover:bg-gray-900 text-white font-bold
                           py-3 rounded-xl tracking-widest text-sm transition disabled:opacity-60"
              >
                {loading ? 'MEMPROSES...' : '✓ KONFIRMASI PEMBAYARAN'}
              </button>
            </div>
          )}

          {/* ── Panel CASH ── */}
          {metode === 'cash' && (
            <div className="bg-white rounded-xl p-5 space-y-4">
              <h3 className="font-bold text-gray-800 text-base">PEMBAYARAN TUNAI</h3>

              {/* Total tagihan */}
              <div className="relative border-2 border-gray-200 rounded-xl p-4">
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  INSTANT
                </span>
                <p className="font-bold text-gray-600 text-sm">TOTAL TAGIHAN</p>
                <p className="font-bold text-gray-900 text-xl mt-1">{fmtRupiah(total)}</p>
              </div>

              {/* Uang diterima */}
              <div className="relative border-2 border-gray-200 rounded-xl p-4">
                <span className="absolute top-2 right-2 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  INSTANT
                </span>
                <p className="font-bold text-gray-600 text-sm mb-2">UANG DITERIMA</p>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-semibold">Rp.</span>
                  <input
                    type="number"
                    value={uangDiterima}
                    onChange={(e) => setUangDiterima(e.target.value)}
                    placeholder="0"
                    min={total}
                    step="1000"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Kembalian */}
              <div className="relative border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <span className="absolute top-2 right-14 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  INSTANT
                </span>
                <div>
                  <p className="font-bold text-gray-600 text-sm">KEMBALIAN</p>
                  <p className={`font-bold text-xl mt-1 ${kembalian < 0 ? 'text-red-500' : 'text-gray-900'}`}>
                    {kembalian >= 0 ? fmtRupiah(kembalian) : '—'}
                  </p>
                </div>
                <span className="text-4xl">💸</span>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              {/* Konfirmasi */}
              <button
                onClick={handleKonfirmasi}
                disabled={loading || kembalian < 0 || !uangDiterima}
                className="w-full bg-gray-800 hover:bg-gray-900 text-white font-bold
                           py-3 rounded-xl tracking-widest text-sm transition disabled:opacity-50"
              >
                {loading ? 'MEMPROSES...' : '✓ KONFIRMASI PEMBAYARAN'}
              </button>
            </div>
          )}

          {error && metode && (
            <p className="text-red-300 text-sm">{error}</p>
          )}
        </div>

        {/* ── Panel Kanan: Kotak Tiket ── */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="bg-white rounded-xl p-5 sticky top-8">
            <h3 className="font-bold text-gray-800 text-base mb-4">KOTAK TIKET</h3>
            <p className="text-gray-400 text-xs tracking-widest mb-3">PAYMENT DETAILS</p>

            {[
              { label: 'TANGGAL', value: tanggalFmt },
              { label: 'JAM',     value: jadwal.jam_tayang },
              { label: 'FILM',    value: jadwal.judul_film },
              { label: 'KURSI',   value: kursiDipilih.map(k => k.kode_kursi).join(', ') },
              { label: 'STUDIO',  value: jadwal.nama_studio },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between py-2 border-b border-gray-100 text-sm">
                <span className="text-gray-400 tracking-wide">{label}</span>
                <span className="font-semibold text-gray-800 text-right max-w-[140px]">{value}</span>
              </div>
            ))}

            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-400 tracking-wide">TOTAL</span>
              <span className="font-bold text-blue-600 text-base">{fmtRupiah(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// STEP 4 — Bukti Pembayaran Berhasil
// ════════════════════════════════════════════════════════
function StepBerhasil({ data, onSelesai }) {
  const tanggalFmt = fmtTanggal(data.tanggal)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#4a6fa5] to-[#2d4a6b] flex flex-col items-center justify-center p-8">

      {/* Ikon centang */}
      <div className="border-2 border-gray-800 rounded-xl p-3 mb-4 bg-white/10">
        <span className="text-2xl">✓</span>
      </div>

      <h1 className="text-white font-bold text-3xl tracking-wide mb-1">PEMBAYARAN BERHASIL!</h1>
      <p className="text-blue-200 text-xs tracking-widest mb-8">
        TRANSAKSI ANDA TELAH DIKONFIRMASI SECARA TEKNIS.
      </p>

      {/* Render satu kartu tiket per kursi */}
      <div className="space-y-4 w-full max-w-xl">
        {data.tiket.map((t, i) => (
          <div key={i} className="flex flex-col sm:flex-row rounded-2xl overflow-hidden shadow-2xl bg-white">

            {/* Sisi kiri — panel biru gelap (logo/info bioskop) */}
            <div className="bg-[#1e3550] w-full sm:w-44 shrink-0 flex flex-col items-center justify-center p-4 sm:p-6 text-white">
              <div className="text-4xl mb-2">🎬</div>
              <p className="font-black text-lg leading-tight text-center tracking-wide">
                {data.nama_studio}
              </p>
              <p className="text-blue-300 text-[10px] mt-1 text-center">
                NIKMATI PENGALAMAN MENONTON TERBAIK
              </p>
            </div>

            {/* Sisi kanan — detail tiket */}
            <div className="flex-1 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-gray-400 text-[10px] tracking-widest">JUDUL FILM</p>
                  <p className="font-black text-gray-900 text-lg leading-tight">{data.judul_film}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] tracking-widest">HALL</p>
                  <p className="font-bold text-gray-800 text-sm">{data.nama_studio}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                <div>
                  <p className="text-gray-400 text-[10px] tracking-widest">TANGGAL</p>
                  <p className="font-semibold text-gray-800">{tanggalFmt}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] tracking-widest">WAKTU</p>
                  <p className="font-semibold text-gray-800">{data.jam_tayang} WIB</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] tracking-widest">KURSI</p>
                  <p className="font-bold text-gray-900 text-base">{t.kursi}</p>
                </div>
              </div>

              {/* Garis putus pemisah */}
              <div className="border-t border-dashed border-gray-200 my-3" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-gray-400 text-[10px] tracking-widest">ORDER ID</p>
                  <p className="font-mono font-bold text-gray-700 text-sm">{data.kode_booking}</p>
                </div>
                {/* QR Code tiket */}
                <QRCodeSVG
                  value={t.qr_token}
                  size={72}
                  level="M"
                  includeMargin={false}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tombol bawah */}
      <div className="flex gap-4 mt-8 w-full max-w-xl">
        <button
          onClick={() => window.print()}
          className="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm tracking-wide transition"
        >
          ↓ DOWNLOAD E-TIKET
        </button>
        <button
          onClick={onSelesai}
          className="flex-1 border-2 border-white/40 text-white hover:bg-white/10
                     font-bold py-3 rounded-xl text-sm tracking-wide transition"
        >
          🏠 KEMBALI KE BERANDA
        </button>
      </div>

      <p className="text-blue-200/60 text-xs text-center mt-6 max-w-sm">
        TUNJUKKAN KODE QR INI KEPADA PETUGAS BIOSKOP ATAU GUNAKAN KIOS MANDIRI
        UNTUK MENCETAK TIKET FISIK JIKA DIPERLUKAN.
      </p>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// KOMPONEN UTAMA — orkestrasi semua step
// ════════════════════════════════════════════════════════
export default function Tiket() {
  const [step,         setStep]         = useState('jadwal')
  const [jadwalPilih,  setJadwalPilih]  = useState(null)
  const [kursiDipilih, setKursiDipilih] = useState([])
  const [hasilPesanan, setHasilPesanan] = useState(null)

  const reset = () => {
    setStep('jadwal')
    setJadwalPilih(null)
    setKursiDipilih([])
    setHasilPesanan(null)
  }

  // Step: pilih-jadwal
  if (step === 'jadwal') {
    return (
      <StepPilihJadwal
        onPilih={(j) => { setJadwalPilih(j); setStep('kursi') }}
      />
    )
  }

  // Step: pilih-kursi
  if (step === 'kursi') {
    return (
      <StepPilihKursi
        jadwal={jadwalPilih}
        onKembali={() => setStep('jadwal')}
        onLanjut={(kursi) => { setKursiDipilih(kursi); setStep('bayar') }}
      />
    )
  }

  // Step: metode bayar
  if (step === 'bayar') {
    return (
      <StepMetodeBayar
        jadwal={jadwalPilih}
        kursiDipilih={kursiDipilih}
        onKembali={() => setStep('kursi')}
        onBerhasil={(data) => { setHasilPesanan(data); setStep('berhasil') }}
      />
    )
  }

  // Step: berhasil
  if (step === 'berhasil') {
    return (
      <StepBerhasil
        data={hasilPesanan}
        onSelesai={reset}
      />
    )
  }
}