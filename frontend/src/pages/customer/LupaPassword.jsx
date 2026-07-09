// src/pages/customer/LupaPassword.jsx
import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

// ==========================================
// STEP 1: INPUT EMAIL
// ==========================================
function FormEmail({ onSukses }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await axios.post(`${API_BASE}/api/customer/auth/lupa-password`, { email })
      onSukses(email)
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mengirim OTP.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-400 text-sm">
        Masukkan email yang terdaftar. Kami akan mengirimkan kode OTP untuk memverifikasi akun kamu.
      </p>
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Email</label>
        <input 
          type="email" 
          required 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          placeholder="email@kamu.com" 
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition" 
        />
      </div>
      <button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition flex items-center justify-center gap-2"
      >
        {loading ? 'Mengirim...' : 'Kirim Kode OTP'}
      </button>
    </form>
  )
}

// ==========================================
// STEP 2: VERIFIKASI OTP ONLY (Maks 60s)
// ==========================================
function FormOTP({ email, onSuksesOtp }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [countdown, setCountdown] = useState(60)
  const [loadingResend, setLoadingResend] = useState(false)
  const [notifResend, setNotifResend] = useState('')
  const [error, setError] = useState('')

  // Efek untuk timer 60 detik
  useEffect(() => {
    if (countdown === 0) return
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return
    const newOtp = [...otp]
    newOtp[idx] = val.slice(-1)
    setOtp(newOtp)
    setError('')
    
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus()
    }
  }

  const handleKirimUlang = async () => {
    setLoadingResend(true)
    try {
      await axios.post(`${API_BASE}/api/customer/auth/kirim-ulang-otp-reset`, { email })
      setNotifResend('✅ Kode OTP baru telah dikirim!')
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      setTimeout(() => setNotifResend(''), 3000)
    } catch {
      setError('Gagal mengirim ulang OTP.')
    } finally {
      setLoadingResend(false)
    }
  }

  const handleVerifikasiOtp = () => {
    const kodeOtp = otp.join('')
    if (kodeOtp.length < 6) {
      setError('Masukkan 6 digit kode OTP secara lengkap!')
      return
    }
    // Karena verifikasi & simpan password di backend dijadikan satu endpoint, 
    // kita simpan dulu kode OTP-nya ke state parent untuk ditembak di step 3
    onSuksesOtp(kodeOtp)
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
        <p className="text-blue-300 text-sm">Kode OTP telah dikirim ke</p>
        <p className="text-white font-bold text-sm mt-0.5">{email}</p>
      </div>

      {error && <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm">{error}</div>}
      {notifResend && <div className="p-3 bg-green-500/20 border border-green-500/40 text-green-300 rounded-xl text-sm">{notifResend}</div>}

      <div className="flex justify-center gap-2">
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
            className={`w-11 h-13 text-center text-lg font-black border-2 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-400 transition ${digit ? 'border-blue-400' : 'border-white/20'}`}
            autoFocus={idx === 0}
          />
        ))}
      </div>

      <button 
        onClick={handleVerifikasiOtp}
        disabled={otp.join('').length < 6}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition"
      >
        Verifikasi OTP
      </button>

      <div className="text-center">
        {countdown > 0 ? (
          <p className="text-gray-500 text-sm">Kirim ulang dalam <span className="text-gray-300 font-semibold">{countdown}s</span></p>
        ) : (
          <button onClick={handleKirimUlang} disabled={loadingResend} className="text-blue-400 hover:text-blue-300 text-sm transition">
            {loadingResend ? 'Mengirim...' : '🔄 Kirim ulang OTP'}
          </button>
        )}
      </div>
    </div>
  )
}

// ==========================================
// STEP 3: BUAT PASSWORD BARU
// ==========================================
function FormPasswordBaru({ email, otpCode, onBerhasil }) {
  const [passwordBaru, setPasswordBaru] = useState('')
  const [passwordBaru2, setPasswordBaru2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (passwordBaru.length < 6) {
      setError('Password minimal 6 karakter!')
      return
    }
    if (passwordBaru !== passwordBaru2) {
      setError('Konfirmasi password tidak cocok!')
      return
    }

    setLoading(true)
    setError('')
    try {
      // Menembak endpoint ke backend mengintegrasikan email, otp, dan password baru
      await axios.post(`${API_BASE}/api/customer/auth/reset-password`, {
        email,
        otp: otpCode,
        password_baru: passwordBaru
      })
      onBerhasil()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal mereset password. Kemungkinan OTP kedaluwarsa.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-gray-400 text-sm">OTP Terverifikasi! Silakan buat password baru kamu.</p>
      {error && <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-sm">{error}</div>}
      
      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Password Baru</label>
        <div className="relative">
          <input 
            type={showPw ? 'text' : 'password'} 
            value={passwordBaru} 
            onChange={e => setPasswordBaru(e.target.value)} 
            placeholder="Minimal 6 karakter" 
            className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
            {showPw ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-1.5">Konfirmasi Password</label>
        <input 
          type="password" 
          value={passwordBaru2} 
          onChange={e => setPasswordBaru2(e.target.value)} 
          placeholder="Ulangi password baru" 
          className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl text-sm transition">
        {loading ? 'Menyimpan...' : '✓ Simpan Password Baru'}
      </button>
    </form>
  )
}

// ==========================================
// HALAMAN UTAMA (MANAJER STEP)
// ==========================================
export default function LupaPassword() {
  const [step, setStep] = useState(1) // 1: Email, 2: OTP, 3: Password Baru
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0b111e] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-white text-center mb-1">Reset Password</h2>
        <p className="text-center text-gray-500 text-xs mb-6">BIOSKOP 7</p>

        {step === 1 && (
          <FormEmail 
            onSukses={(emailInput) => {
              setEmail(emailInput)
              setStep(2)
            }} 
          />
        )}

        {step === 2 && (
          <FormOTP 
            email={email} 
            onSuksesOtp={(kode) => {
              setOtpCode(kode)
              setStep(3)
            }} 
          />
        )}

        {step === 3 && (
          <FormPasswordBaru 
            email={email} 
            otpCode={otpCode} 
            onBerhasil={() => {
              alert('Password Anda berhasil diperbarui! Silakan login kembali.')
              navigate('/login')
            }} 
          />
        )}

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-gray-400 hover:text-white transition">
            ← Kembali ke halaman Login
          </Link>
        </div>
      </div>
    </div>
  )
}