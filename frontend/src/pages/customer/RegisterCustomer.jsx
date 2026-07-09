// pages/customer/RegisterCustomer.jsx
// 2 step: Isi form → Verifikasi OTP

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// ── Step 1: Form Registrasi ───────────────────────────────
function FormRegister({ onSukses }) {
  const [form,    setForm]    = useState({ nama: '', email: '', password: '', password2: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password2) {
      setError('Konfirmasi password tidak cocok!')
      return
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter!')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_BASE}/api/customer/auth/register`, {
        nama:      form.nama,
        email:     form.email,
        password:  form.password,
        password2: form.password2,
      })
      onSukses(form.email, form.nama)
    } catch (err) {
      setError(err.response?.data?.detail || 'Registrasi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Nama pengguna */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Nama Pengguna</label>
        <input
          type="text" required
          value={form.nama}
          onChange={e => setForm({...form, nama: e.target.value})}
          placeholder="Nama yang akan ditampilkan"
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl
                     px-4 py-3 placeholder-gray-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">
          Email <span className="text-gray-500 text-xs">(untuk terima kode OTP)</span>
        </label>
        <input
          type="email" required
          value={form.email}
          onChange={e => setForm({...form, email: e.target.value})}
          placeholder="email@kamu.com"
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl
                     px-4 py-3 placeholder-gray-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'} required
            value={form.password}
            onChange={e => setForm({...form, password: e.target.value})}
            placeholder="Minimal 6 karakter"
            className="w-full bg-white/10 border border-white/20 text-white rounded-xl
                       px-4 py-3 pr-12 placeholder-gray-400 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition">
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Konfirmasi password */}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Konfirmasi Password</label>
        <input
          type="password" required
          value={form.password2}
          onChange={e => setForm({...form, password2: e.target.value})}
          placeholder="Ketik ulang password"
          className={`w-full bg-white/10 border text-white rounded-xl
                     px-4 py-3 placeholder-gray-400 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-400 transition
                     ${form.password2 && form.password !== form.password2
                       ? 'border-red-500/60' : 'border-white/20'}`}
        />
        {form.password2 && form.password !== form.password2 && (
          <p className="text-red-400 text-xs mt-1">Password tidak cocok</p>
        )}
      </div>

      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                   text-white font-bold py-3 rounded-xl text-sm transition mt-2
                   flex items-center justify-center gap-2">
        {loading ? (
          <><span className="animate-spin">⏳</span> Mendaftar...</>
        ) : 'Daftar & Kirim OTP'}
      </button>
    </form>
  )
}


// ── Step 2: Verifikasi OTP ────────────────────────────────
function VerifikasiOTP({ email, nama, onBerhasil }) {
  const [otp,        setOtp]        = useState(['', '', '', '', '', ''])
  const [loading,    setLoading]    = useState(false)
  const [loadingResend, setLoadingResend] = useState(false)
  const [error,      setError]      = useState('')
  const [notifResend, setNotifResend] = useState('')
  const [countdown,  setCountdown]  = useState(60)

  // Countdown untuk kirim ulang
  useState(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Handle input OTP — auto fokus ke kotak berikutnya
  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return  // hanya angka
    const newOtp = [...otp]
    newOtp[idx] = val.slice(-1)     // ambil 1 karakter terakhir
    setOtp(newOtp)
    setError('')

    // Auto fokus ke kotak berikutnya
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleKeyDown = (idx, e) => {
    // Backspace → fokus ke kotak sebelumnya
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const handleVerifikasi = async () => {
    const kodeOtp = otp.join('')
    if (kodeOtp.length < 6) { setError('Masukkan 6 digit kode OTP!'); return }

    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_BASE}/api/customer/auth/verifikasi-otp`, {
        email, otp: kodeOtp
      })
      onBerhasil()
    } catch (err) {
      setError(err.response?.data?.detail || 'Kode OTP salah atau kadaluarsa.')
      setOtp(['', '', '', '', '', ''])
      document.getElementById('otp-0')?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleKirimUlang = async () => {
    setLoadingResend(true)
    try {
      await axios.post(`${API_BASE}/api/customer/auth/kirim-ulang-otp`, { email, otp: '000000' })
      setNotifResend('✅ Kode OTP baru telah dikirim!')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => setNotifResend(''), 3000)
    } catch {
      setNotifResend('❌ Gagal mengirim ulang OTP.')
    } finally {
      setLoadingResend(false)
    }
  }

  return (
    <div>
      {/* Info email */}
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 mb-6">
        <p className="text-blue-300 text-sm">
          Kode OTP telah dikirim ke
        </p>
        <p className="text-white font-bold text-sm mt-0.5">{email}</p>
        <p className="text-gray-400 text-xs mt-1">Cek folder inbox atau spam</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}

      {notifResend && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-sm">
          {notifResend}
        </div>
      )}

      {/* Input OTP 6 kotak */}
      <div className="flex justify-center gap-2 sm:gap-3 mb-6">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            id={`otp-${idx}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleOtpChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(idx, e)}
            className={`w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-black
                       border-2 rounded-xl transition
                       bg-white/10 text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-400
                       ${digit ? 'border-blue-400' : 'border-white/20'}`}
            autoFocus={idx === 0}
          />
        ))}
      </div>

      {/* Tombol verifikasi */}
      <button
        onClick={handleVerifikasi}
        disabled={loading || otp.join('').length < 6}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                   text-white font-bold py-3 rounded-xl text-sm transition
                   flex items-center justify-center gap-2"
      >
        {loading ? (
          <><span className="animate-spin">⏳</span> Memverifikasi...</>
        ) : '✓ Verifikasi OTP'}
      </button>

      {/* Kirim ulang OTP */}
      <div className="text-center mt-4">
        {countdown > 0 ? (
          <p className="text-gray-500 text-sm">
            Kirim ulang OTP dalam <span className="text-gray-300 font-semibold">{countdown}s</span>
          </p>
        ) : (
          <button
            onClick={handleKirimUlang}
            disabled={loadingResend}
            className="text-blue-400 hover:text-blue-300 text-sm transition disabled:opacity-60"
          >
            {loadingResend ? 'Mengirim...' : '🔄 Kirim ulang OTP'}
          </button>
        )}
      </div>
    </div>
  )
}


// ── Halaman Utama Register ────────────────────────────────
export default function RegisterCustomer() {
  const navigate = useNavigate()
  const [step,  setStep]  = useState('form')   // 'form' | 'otp' | 'sukses'
  const [email, setEmail] = useState('')
  const [nama,  setNama]  = useState('')

  if (step === 'sukses') {
    return (
      <div className="min-h-screen bg-[#1a2a4a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-white font-black text-2xl mb-2">Akun Berhasil Dibuat!</h2>
          <p className="text-gray-400 mb-6">Selamat datang di Bioskop 7, {nama}!</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold
                       px-8 py-3 rounded-xl transition"
          >
            Login Sekarang
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🎬</span>
            <span className="font-black text-white text-2xl tracking-tight">BIOSKOP 7</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">
            {step === 'form' ? 'Buat akun baru' : 'Verifikasi email'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {['Daftar', 'Verifikasi OTP'].map((label, i) => {
            const aktif   = (i === 0 && step === 'form') || (i === 1 && step === 'otp')
            const selesai = i === 0 && step === 'otp'
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition
                  ${selesai ? 'bg-green-500 text-white' : aktif ? 'bg-blue-500 text-white' : 'bg-white/20 text-gray-400'}`}>
                  {selesai ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${aktif ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
                {i < 1 && <div className="w-8 h-px bg-white/20" />}
              </div>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20
                        rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-6">
            {step === 'form' ? 'Buat Akun' : 'Masukkan Kode OTP'}
          </h2>

          {step === 'form' && (
            <FormRegister
              onSukses={(e, n) => {
                setEmail(e)
                setNama(n)
                setStep('otp')
              }}
            />
          )}

          {step === 'otp' && (
            <VerifikasiOTP
              email={email}
              nama={nama}
              onBerhasil={() => setStep('sukses')}
            />
          )}
        </div>

        {/* Link login */}
        <p className="text-center text-gray-500 text-sm mt-4">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}