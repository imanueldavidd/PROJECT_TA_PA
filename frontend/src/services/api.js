// services/api.js
// Konfigurasi terpusat untuk Axios — semua request API lewat sini

import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor: otomatis sisipkan JWT token ke setiap request (jika ada)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Kalau token expired → otomatis redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.clear()
      window.location.href = '/staff/login'
    }
    return Promise.reject(err)
  }
)

export default api