// pages/customer/LoginCustomer.jsx

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL

export default function LoginCustomer() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password) {
      setError('Semua field wajib diisi!')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post(`${API_BASE}/api/customer/auth/login`, {
        username: form.username,
        password: form.password,
      })
      localStorage.setItem('customer_token', res.data.access_token)
      localStorage.setItem('customer_nama',  res.data.nama)
      localStorage.setItem('customer_id',    res.data.user_id)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a2a4a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🎬</span>
            <span className="font-black text-white text-2xl tracking-tight">BIOSKOP 7</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Masuk ke akunmu</p>
        </div>

        {/* Card */}
        <div className="bg-white/10 backdrop-blur border border-white/20
                        rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-white font-bold text-xl mb-6">Login</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40
                            text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm text-gray-300 mb-1.5">
                Nama Pengguna / Email
              </label>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                placeholder="Masukkan nama pengguna atau email"
                required
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
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/10 border border-white/20 text-white rounded-xl
                             px-4 py-3 pr-12 placeholder-gray-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-white transition text-sm"
                >
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-gray-300">Password</label>
                <Link to="/lupa-password" className="text-xs text-blue-400 hover:text-blue-300 transition">
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                {/* ...input password tetap sama... */}
              </div>
            </div>

            {/* Tombol login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60
                         text-white font-bold py-3 rounded-xl text-sm
                         transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="animate-spin">⏳</span> Masuk...</>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Link daftar */}
          <p className="text-center text-gray-400 text-sm mt-6">
            Belum punya akun?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold transition">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}