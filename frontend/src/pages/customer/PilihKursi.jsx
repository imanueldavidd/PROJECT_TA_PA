// pages/customer/PilihKursi.jsx
// Denah kursi interaktif

import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const API_BASE  = import.meta.env.VITE_API_BASE_URL
const fmtRupiah = (n) => 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0)

const WARNA = {
  tersedia: 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:bg-blue-50 cursor-pointer',
  pilihan:  'bg-blue-600 border-blue-600 text-white shadow cursor-pointer',
  penuh:    'bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed opacity-60',
}

export default function PilihKursi() {
  const { jadwalId } = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const { film, jadwal } = location.state || {}

  const [kursiData,    setKursiData]    = useState([])
  const [kursiDipilih, setKursiDipilih] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  useEffect(() => {
    if (!film || !jadwal) { navigate('/'); return }
    axios.get(`${API_BASE}/api/customer/kursi/${jadwalId}`)
      .then(r => setKursiData(r.data))
      .catch(() => setError('Gagal memuat denah kursi.'))
      .finally(() => setLoading(false))
  }, [jadwalId])

  const toggleKursi = (kursi) => {
    if (kursi.status === 'penuh') return
    setKursiDipilih(prev =>
      prev.find(k => k.id === kursi.id)
        ? prev.filter(k => k.id !== kursi.id)
        : [...prev, kursi]
    )
    setError('')
  }

  // Kelompokkan per baris
  const barisMap  = kursiData.reduce((acc, k) => {
    const b = k.kode_kursi[0]
    if (!acc[b]) acc[b] = []
    acc[b].push(k)
    return acc
  }, {})
  const barisUrut = Object.keys(barisMap).sort()

  const total = (jadwal?.harga_tiket || 0) * kursiDipilih.length

  const handleLanjut = () => {
    if (kursiDipilih.length === 0) { setError('Pilih minimal 1 kursi!'); return }
    navigate('/pembayaran', {
      state: { film, jadwal, kursiDipilih, jadwalId: parseInt(jadwalId) }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-[#1a2a4a] text-white px-4 sm:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white transition">← Kembali</button>
          <div>
            <p className="font-bold text-sm sm:text-base">{film?.judul}</p>
            <p className="text-gray-400 text-xs">
              {jadwal?.nama_studio} • {jadwal?.jam_tayang} •
              Rp {jadwal?.harga_tiket?.toLocaleString('id-ID')}/kursi
            </p>
          </div>
        </div>
      </div>

      {/* Konten */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-6">

        {/* Judul + Legenda */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="font-black text-gray-800 text-xl border-l-4 border-blue-600 pl-3">
            PILIH KURSI
          </h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            {[
              { label: 'TERSEDIA', cls: 'bg-white border-gray-300' },
              { label: 'DIPILIH',  cls: 'bg-blue-600 border-blue-600' },
              { label: 'PENUH',    cls: 'bg-gray-600 border-gray-600' },
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
          <div className="mx-auto w-48 sm:w-72 border-t-4 border-gray-400 rounded-sm" />
          <p className="text-gray-400 text-xs tracking-widest mt-1">LAYAR BIOSKOP</p>
        </div>

        {/* Denah kursi */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat kursi...</div>
        ) : (
          <div className="overflow-x-auto pb-2">
            <div className="inline-block mx-auto">
              {barisUrut.map((baris) => (
                <div key={baris} className="flex items-center gap-1 sm:gap-1.5 mb-1 sm:mb-1.5">
                  <span className="w-5 text-xs text-gray-400 text-right shrink-0">{baris}</span>
                  <div className="flex gap-1 sm:gap-1.5">
                    {barisMap[baris]
                      .sort((a, b) => parseInt(a.kode_kursi.slice(1)) - parseInt(b.kode_kursi.slice(1)))
                      .map(k => {
                        const status = k.status === 'penuh' ? 'penuh'
                          : kursiDipilih.find(x => x.id === k.id) ? 'pilihan' : 'tersedia'
                        return (
                          <button key={k.id} onClick={() => toggleKursi(k)}
                            disabled={k.status === 'penuh'}
                            className={`w-8 h-7 sm:w-10 sm:h-9 rounded border-2
                                       text-[9px] sm:text-xs font-bold transition-all
                                       ${WARNA[status]}`}>
                            {k.kode_kursi}
                          </button>
                        )
                      })
                    }
                  </div>
                  <span className="w-5 text-xs text-gray-400 shrink-0">{baris}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}
      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-0 bg-[#1a2a4a] text-white
                      px-4 sm:px-8 py-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
          <div className="flex justify-between sm:contents gap-8">
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Pilihan Kursi</p>
              <p className="font-semibold text-sm mt-0.5">
                {kursiDipilih.length > 0
                  ? kursiDipilih.map(k => k.kode_kursi).join(', ')
                  : '--'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide">Total Harga</p>
              <p className="font-black text-lg text-blue-400 mt-0.5">{fmtRupiah(total)}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-gray-400 text-xs uppercase tracking-wide">Studio</p>
              <p className="font-semibold text-sm mt-0.5">{jadwal?.nama_studio}</p>
            </div>
          </div>
          <div className="sm:flex-1" />
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={() => { setKursiDipilih([]); setError('') }}
              disabled={kursiDipilih.length === 0}
              className="flex-1 sm:flex-none border border-white/30 text-gray-300
                         hover:bg-white/10 px-4 py-2.5 rounded-xl text-sm
                         transition disabled:opacity-40"
            >
              BATALKAN KURSI
            </button>
            <button
              onClick={handleLanjut}
              disabled={kursiDipilih.length === 0}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700
                         disabled:opacity-50 text-white font-bold
                         px-6 py-2.5 rounded-xl text-sm transition"
            >
              LANJUTKAN PEMBAYARAN →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}