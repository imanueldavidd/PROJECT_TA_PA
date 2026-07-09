// services/customerApi.js
import axios from 'axios'

const customerApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

customerApi.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('customer_token')
      localStorage.removeItem('customer_nama')
      localStorage.removeItem('customer_id')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default customerApi