import { create } from 'zustand'
import type { MenuNode } from '@/types'
import { fetchUserMenu } from '@/api/menuApi'

interface MenuState {
  items: MenuNode[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  clear: () => void
}

export const useMenuStore = create<MenuState>((set) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const items = await fetchUserMenu()
      set({ items, loading: false, loaded: true })
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Erreur inconnue'
      console.error('[MenuStore] Failed to load menu:', msg)
      set({ error: msg, loading: false, loaded: true })
    }
  },

  clear: () => set({ items: [], loading: false, loaded: false, error: null }),
}))
