// pages/manajer/staff.jsx
// Kelola Akun Staff — tabel + tambah + edit role/status + reset password

import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'

// ════════════════════════════════════════════════════════
// Modal: Tambah Staff Baru
// ════════════════════════════════════════════════════════
function ModalTambahStaff({ onClose, onSimpan }) {
  const [form, setForm] = useState({ nama: '', username: '', password: '', role: 'karyawan' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async () => {
    if (!form.nama.trim() || !form.username.trim() || !form.password) {
      setError('Semua field wajib diisi!')
      return
    }
    if (form.password.length < 6) {
      setError('Password minimal 6 karakter!')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/staff/', form)
      onSimpan()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal menambah staff.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-gray-800 text-lg mb-5">Tambah Staff Baru</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">NAMA LENGKAP</label>
            <input
              name="nama" value={form.nama} onChange={handleChange}
              placeholder="Masukkan nama lengkap"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">USERNAME</label>
            <input
              name="username" value={form.username} onChange={handleChange}
              placeholder="Username untuk login"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">PASSWORD</label>
            <input
              name="password" type="password" value={form.password} onChange={handleChange}
              placeholder="Minimal 6 karakter"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">ROLE</label>
            <select
              name="role" value={form.role} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="karyawan">Karyawan</option>
              <option value="manajer">Manajer</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2.5 text-sm font-bold transition disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Tambah Staff'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Modal: Reset Password
// ════════════════════════════════════════════════════════
function ModalResetPassword({ staff, onClose, onSukses }) {
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async () => {
    if (password.length < 6) { setError('Password minimal 6 karakter!'); return }
    setLoading(true)
    try {
      await api.post(`/api/staff/${staff.id}/reset-password`, { password_baru: password })
      onSukses()
    } catch (err) {
      setError(err.response?.data?.detail || 'Gagal reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Reset Password</h3>
        <p className="text-gray-500 text-sm mb-5">{staff.nama} ({staff.kode_id})</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <label className="block text-xs font-bold text-gray-500 tracking-widest mb-1">PASSWORD BARU</label>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError('') }}
          placeholder="Minimal 6 karakter"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-gray-900 hover:bg-black text-white rounded-lg py-2.5 text-sm font-bold transition disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Reset Password'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// Komponen: Baris Staff (dengan dropdown role + toggle status)
// ════════════════════════════════════════════════════════
function BarisStaff({ staff, onUbahRole, onUbahStatus, onResetPassword, onHapus }) {
  const [konfirmHapus, setKonfirmHapus] = useState(false)

  return (
    <div className="grid grid-cols-[1fr_140px_160px_140px_180px] items-center px-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition">

      {/* Nama Pengguna */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
          👤
        </div>
        <span className="font-bold text-gray-900 text-sm">{staff.nama}</span>
      </div>

      {/* ID */}
      <span className="text-gray-400 text-sm font-mono">{staff.kode_id}</span>

      {/* Dropdown Role */}
      <select
        value={staff.role}
        onChange={(e) => onUbahRole(staff.id, e.target.value)}
        className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white
                   focus:outline-none focus:ring-2 focus:ring-blue-500 w-fit"
      >
        <option value="karyawan">Karyawan</option>
        <option value="manajer">Manajer</option>
      </select>

      {/* Status badge (clickable untuk toggle) */}
      <button
        onClick={() => onUbahStatus(staff.id, !staff.is_aktif)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide w-fit transition
          ${staff.is_aktif
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${staff.is_aktif ? 'bg-green-600' : 'bg-gray-400'}`} />
        {staff.is_aktif ? 'ACTIVE' : 'INACTIVE'}
      </button>

      {/* Aksi */}
      <div className="flex items-center gap-3 justify-end text-xs font-bold">
        <button
          onClick={() => onResetPassword(staff)}
          className="text-blue-600 hover:text-blue-800 transition"
        >
          RESET PW
        </button>

        {konfirmHapus ? (
          <div className="flex items-center gap-2">
            <button onClick={() => { setKonfirmHapus(false); onHapus(staff.id) }} className="text-red-600">YA</button>
            <button onClick={() => setKonfirmHapus(false)} className="text-gray-400">BATAL</button>
          </div>
        ) : (
          <button
            onClick={() => setKonfirmHapus(true)}
            className="text-red-500 hover:text-red-700 transition"
          >
            HAPUS
          </button>
        )}
      </div>
    </div>
  )
}


// ════════════════════════════════════════════════════════
// HALAMAN UTAMA — Kelola Staff
// ════════════════════════════════════════════════════════
export default function Staff() {
  const [search,   setSearch]   = useState('')
  const [page,     setPage]     = useState(1)
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [notif,    setNotif]    = useState('')

  const [modalTambah, setModalTambah] = useState(false)
  const [modalReset,  setModalReset]  = useState(null)  // staff object | null

  const PER_PAGE = 4

  // ── Fetch data staff ──────────────────────────────────
  const fetchStaff = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, per_page: PER_PAGE })
      if (search) params.append('q', search)
      const res = await api.get(`/api/staff/?${params}`)
      setData(res.data)
    } catch {
      setNotif('❌ Gagal memuat data staff.')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchStaff() }, [fetchStaff])

  // Reset ke halaman 1 setiap kali search berubah
  useEffect(() => { setPage(1) }, [search])

  const tampilkanNotif = (msg) => {
    setNotif(msg)
    setTimeout(() => setNotif(''), 3500)
  }

  // ── Handler aksi ───────────────────────────────────────
  const handleUbahRole = async (id, role) => {
    try {
      await api.patch(`/api/staff/${id}/role`, { role })
      tampilkanNotif('✅ Role berhasil diperbarui.')
      fetchStaff()
    } catch (err) {
      tampilkanNotif('❌ ' + (err.response?.data?.detail || 'Gagal mengubah role.'))
      fetchStaff()  // refresh untuk kembalikan dropdown ke nilai asli
    }
  }

  const handleUbahStatus = async (id, isAktif) => {
    try {
      await api.patch(`/api/staff/${id}/status`, { is_aktif: isAktif })
      tampilkanNotif('✅ Status berhasil diperbarui.')
      fetchStaff()
    } catch (err) {
      tampilkanNotif('❌ ' + (err.response?.data?.detail || 'Gagal mengubah status.'))
    }
  }

  const handleHapus = async (id) => {
    try {
      await api.delete(`/api/staff/${id}`)
      tampilkanNotif('✅ Staff berhasil dihapus.')
      fetchStaff()
    } catch (err) {
      tampilkanNotif('❌ ' + (err.response?.data?.detail || 'Gagal menghapus staff.'))
    }
  }

  // Pagination buttons
  const pageNumbers = []
  if (data) {
    const maxButton = 5
    let start = Math.max(1, page - 2)
    let end   = Math.min(data.total_pages, start + maxButton - 1)
    if (end - start < maxButton - 1) start = Math.max(1, end - maxButton + 1)
    for (let i = start; i <= end; i++) pageNumbers.push(i)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-4">
      <p className="text-blue-200 text-sm mb-6">
        Area Manajer: <span className="text-white font-semibold">Kelola User</span>
      </p>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">

        {/* Header: search + filter + tambah */}
        <div className="bg-[#4a6fa5] px-6 py-4 flex items-center gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama atau ID..."
              className="w-full bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          <button
            onClick={() => setModalTambah(true)}
            className="bg-gray-900 hover:bg-black text-white font-bold px-5 py-2.5 rounded-lg text-sm tracking-wide transition shrink-0"
          >
            + TAMBAH STAFF
          </button>
        </div>

        {/* Notifikasi */}
        {notif && (
          <div className={`px-6 py-2.5 text-sm border-b
            ${notif.startsWith('✅') ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
            {notif}
          </div>
        )}

        {/* 👇 SESUDAH: TAMBAHKAN PEMBUNGKUS SCROLL DI SINI */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]"> {/* Menjaga tabel punya ruang minimal saat di layar kecil */}
            
            {/* Header tabel */}
            <div className="grid grid-cols-[1fr_140px_160px_140px_180px] px-6 py-3 bg-gray-50 text-xs font-bold text-gray-500 tracking-widest">
              <span>NAMA PENGGUNA</span>
              <span>ID</span>
              <span>PERAN</span>
              <span>STATUS</span>
              <span className="text-right">AKSI</span>
            </div>

        {/* Body tabel */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Memuat data staff...</div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Tidak ada staff ditemukan.</div>
        ) : (
          data?.data.map((s) => (
            <BarisStaff
              key={s.id}
              staff={s}
              onUbahRole={handleUbahRole}
              onUbahStatus={handleUbahStatus}
              onResetPassword={setModalReset}
              onHapus={handleHapus}
            />
          ))
        )}
        
      </div>
    </div>

        {/* Footer: info + pagination */}
        {data && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-gray-500 text-sm">
              Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, data.total)} of {data.total} entries
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                           text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                ‹
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition
                    ${n === page ? 'bg-gray-900 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                disabled={page >= data.total_pages}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200
                           text-gray-500 hover:bg-gray-100 disabled:opacity-40 transition"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Tambah Staff */}
      {modalTambah && (
        <ModalTambahStaff
          onClose={() => setModalTambah(false)}
          onSimpan={() => {
            setModalTambah(false)
            tampilkanNotif('✅ Staff baru berhasil ditambahkan!')
            fetchStaff()
          }}
        />
      )}

      {/* Modal Reset Password */}
      {modalReset && (
        <ModalResetPassword
          staff={modalReset}
          onClose={() => setModalReset(null)}
          onSukses={() => {
            setModalReset(null)
            tampilkanNotif('✅ Password berhasil direset!')
          }}
        />
      )}
    </div>
  )
}