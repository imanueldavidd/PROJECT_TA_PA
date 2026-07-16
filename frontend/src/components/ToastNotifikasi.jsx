// components/ToastNotifikasi.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'

export default function ToastNotifikasi() {
  const [toasts, setToasts] = useState([])
  const sudahNotif = useRef(new Set())

  const cekJadwal = useCallback(async () => {
    try {
      const hariIni = new Date().toISOString().split('T')[0]
      const res = await api.get(`/api/jadwal/?tanggal=${hariIni}`)
      const sekarang = new Date()

      res.data.forEach(j => {
        if (!j.jam_selesai) return

        const [jam, menit] = j.jam_selesai.split(':').map(Number)
        const waktuSelesai = new Date()
        waktuSelesai.setHours(jam, menit, 0, 0)

        const sisaMenit = Math.round((waktuSelesai - sekarang) / 60000)

        const cekDanTampilkan = (ambang, label) => {
          const key = `${j.id}-${ambang}`
          if (sisaMenit <= ambang && sisaMenit > ambang - 5 && !sudahNotif.current.has(key)) {
            sudahNotif.current.add(key)
            const id = Date.now() + Math.random()
            setToasts(prev => [...prev, {
              id,
              pesan: `🎬 ${j.judul_film} (${j.nama_studio}) akan selesai dalam ${label}`
            }])
            setTimeout(() => {
              setToasts(prev => prev.filter(t => t.id !== id))
            }, 8000)
          }
        }

        cekDanTampilkan(30, '~30 menit')
        cekDanTampilkan(15, '~15 menit')
      })
    } catch (e) {
      console.error('Gagal cek jadwal untuk notifikasi', e)
    }
  }, [])

  useEffect(() => {
    cekJadwal()
    const interval = setInterval(cekJadwal, 60000)
    return () => clearInterval(interval)
  }, [cekJadwal])

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id}
          className="bg-white border-l-4 border-orange-500 shadow-xl rounded-lg
                     px-4 py-3 text-sm text-gray-800">
          {t.pesan}
        </div>
      ))}
    </div>
  )
}