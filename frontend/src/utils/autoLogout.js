// utils/autoLogout.js
// Auto logout setelah tidak aktif — berbeda durasi per role

const DURASI = {
  customer: 60 * 60 * 1000,      // 1 jam
  staff:    8  * 60 * 60 * 1000, // 8 jam
}

let timer = null

export function mulaiAutoLogout(role = 'customer') {
  hapusAutoLogout()

  const durasi = DURASI[role] || DURASI.customer

  // Reset timer setiap ada aktivitas user
  const resetTimer = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      lakukanLogout(role)
    }, durasi)
  }

  // Event yang dianggap "aktif"
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
  events.forEach(e => window.addEventListener(e, resetTimer))

  // Simpan reference untuk dibersihkan nanti
  window._autoLogoutEvents = events
  window._autoLogoutReset  = resetTimer

  // Mulai timer pertama
  resetTimer()
}

export function hapusAutoLogout() {
  clearTimeout(timer)
  if (window._autoLogoutEvents && window._autoLogoutReset) {
    window._autoLogoutEvents.forEach(e =>
      window.removeEventListener(e, window._autoLogoutReset)
    )
  }
}

function lakukanLogout(role) {
  if (role === 'customer') {
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_nama')
    localStorage.removeItem('customer_id')
    window.location.href = '/login?reason=timeout'
  } else {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_nama')
    localStorage.removeItem('user_id')
    window.location.href = '/staff/login?reason=timeout'
  }
}