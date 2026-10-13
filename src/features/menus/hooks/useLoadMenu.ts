import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useMenuStore } from '@/store/menu.store'

export function useLoadMenu() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const load = useMenuStore((s) => s.load)
  const clear = useMenuStore((s) => s.clear)

  useEffect(() => {
    if (isAuthenticated) {
      void load()
      const refresh = () => { if (navigator.onLine) void load(true) }
      window.addEventListener('focus', refresh)
      window.addEventListener('online', refresh)
      const interval = window.setInterval(refresh, 60_000)
      return () => {
        window.removeEventListener('focus', refresh)
        window.removeEventListener('online', refresh)
        window.clearInterval(interval)
      }
    } else {
      clear()
    }
  }, [isAuthenticated, load, clear])
}
