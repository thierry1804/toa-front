import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface UiState {
  sidebarOpen: boolean
  toasts: Toast[]
  locale: 'fr' | 'mg'
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  setLocale: (locale: 'fr' | 'mg') => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toasts: [],
  locale: 'fr',
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  addToast: (toast) =>
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id: crypto.randomUUID() }],
    })),
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setLocale: (locale) => set({ locale }),
}))
