// components/SidebarLayout.jsx
// Layout sidebar responsif — hamburger menu di mobile/tablet

import { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export default function SidebarLayout({ menuItems, onLogout, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Tutup sidebar otomatis setiap navigasi (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
     ${isActive
       ? 'bg-blue-700 text-white'
       : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`

  return (
    <div className="flex min-h-screen bg-[#2d4a6b] font-sans">

      {/* Overlay gelap saat sidebar buka di mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-40
        h-screen w-60 lg:w-52 shrink-0
        bg-gray-900 flex flex-col justify-between py-6 px-3
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div>
          {/* Tombol tutup — hanya di mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-5 ml-1 transition"
          >
            ✕ Tutup
          </button>

          {/* Menu navigasi */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end ?? false}
                className={linkClass}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Tombol logout */}
        <button
          onClick={onLogout}
          className="w-full bg-gray-950 hover:bg-black text-white font-bold py-2.5 rounded-lg text-sm transition"
        >
          Logout
        </button>
      </aside>

      {/* ── Area Konten ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Topbar mobile — hamburger + judul halaman aktif */}
        <div className="lg:hidden sticky top-0 z-20 flex items-center gap-3 bg-gray-900/95 backdrop-blur px-4 py-3 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-white text-2xl leading-none"
            aria-label="Buka menu"
          >
            ☰
          </button>
          <span className="text-white text-sm font-semibold truncate">
            {menuItems.find(m => location.pathname.startsWith(m.to) && (m.end ? location.pathname === m.to : true))?.label ?? 'Menu'}
          </span>
        </div>

        {/* Konten halaman */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}