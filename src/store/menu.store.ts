import { create } from 'zustand'
import type { MenuNode } from '@/types'
import { fetchUserMenu } from '@/api/menuApi'

const MENU_LOAD_TIMEOUT_MS = 15_000

let loadPromise: Promise<void> | null = null

interface MenuState {
  items: MenuNode[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  clear: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    if (loadPromise) return loadPromise

    const isInitialLoad = !get().loaded
    if (isInitialLoad) {
      set({ loading: true, error: null })
    }

    loadPromise = (async () => {
      try {
        const items = await Promise.race([
          fetchUserMenu(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Menu load timeout')), MENU_LOAD_TIMEOUT_MS),
          ),
        ])
        set({ items, loading: false, loaded: true, error: null })
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[MenuStore] Failed to load menu:', msg)
        set({ error: msg, loading: false, loaded: true })
      } finally {
        loadPromise = null
      }
    })()

    return loadPromise
  },

  clear: () => {
    loadPromise = null
    set({ items: [], loading: false, loaded: false, error: null })
  },
}))
