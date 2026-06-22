// pages/LoginStaff.jsx
// Halaman login untuk Karyawan dan Manajer

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function LoginStaff() {
  const navigate = useNavigate()

  // State form
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Update state saat input berubah
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('') // Reset pesan error saat user mulai mengetik
  }

  // Kirim request login ke backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/api/auth/login/staf', {
        username: form.username,
        password: form.password,
      })

      const { access_token, role, nama, user_id } = response.data

      // Simpan token & info user ke localStorage
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('user_role', role)
      localStorage.setItem('user_nama', nama)
      localStorage.setItem('user_id', user_id)

      // Arahkan ke dashboard sesuai role
      if (role === 'manajer') {
        navigate('/dashboard/manajer')
      } else {
        navigate('/dashboard/karyawan')
      }
    } catch (err) {
      // Tampilkan pesan error dari backend
      const pesan = err.response?.data?.detail || 'Terjadi kesalahan, coba lagi.'
      setError(pesan)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo & Judul */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎬</div>
          <h1 className="text-3xl font-bold text-white">CinemaApp</h1>
          <p className="text-gray-400 mt-1">Portal Staff — Masuk ke Dashboard</p>
        </div>

        {/* Card Form */}
        <div className="bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
          <h2 className="text-xl font-semibold text-white mb-6">Login Staff</h2>

          {/* Pesan Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="Masukkan username"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg
                           px-4 py-2.5 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition"
              />
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Masukkan password"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg
                           px-4 py-2.5 placeholder-gray-500
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           transition"
              />
            </div>

            {/* Tombol Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900
                         text-white font-semibold py-2.5 rounded-lg
                         transition duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Memverifikasi...
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Link ke login customer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Pelanggan?{' '}
          <a href="/login" className="text-blue-400 hover:text-blue-300 transition">
            Login sebagai Customer
          </a>
        </p>
      </div>
    </div>
  )
}