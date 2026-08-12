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
    } else {
      clear()
    }
  }, [isAuthenticated, load, clear])
}
