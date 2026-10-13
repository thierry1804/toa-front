import { create } from 'zustand'
import type { MenuNode } from '@/types'
import { fetchUserMenu } from '@/api/menuApi'
import { useAuthStore } from '@/store/auth.store'
import { currentUserId } from '@/utils/jwt'

const MENU_LOAD_TIMEOUT_MS = 15_000
const MENU_CACHE_PREFIX = 'toa-menu-cache:'

let loadPromise: Promise<void> | null = null

function menuCacheKey(): string | null {
  const id = useAuthStore.getState().user?.id || currentUserId()
  if (!id || id === 'undefined') return null
  return `${MENU_CACHE_PREFIX}${id}`
}

function readCachedMenu(): MenuNode[] | null {
  const key = menuCacheKey()
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as MenuNode[]) : null
  } catch {
    return null
  }
}

function writeCachedMenu(items: MenuNode[]): void {
  const key = menuCacheKey()
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // quota
  }
}

function clearCachedMenus(): void {
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(MENU_CACHE_PREFIX)) toRemove.push(key)
  }
  toRemove.forEach((key) => localStorage.removeItem(key))
}

interface MenuState {
  items: MenuNode[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: (force?: boolean) => Promise<void>
  clear: () => void
}

export const useMenuStore = create<MenuState>((set, get) => ({
  items: [],
  loading: false,
  loaded: false,
  error: null,

  load: async (force = false) => {
    if (loadPromise) return loadPromise

    const state = get()
    if (!force && state.loaded && !state.error) return

    const isInitialLoad = !state.loaded
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
        writeCachedMenu(items)
        set({ items, loading: false, loaded: true, error: null })
      } catch (err: unknown) {
        const cached = readCachedMenu()
        if (cached && cached.length > 0) {
          set({ items: cached, loading: false, loaded: true, error: null })
          return
        }
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
    clearCachedMenus()
    set({ items: [], loading: false, loaded: false, error: null })
  },
}))

