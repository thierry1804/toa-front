import { create } from 'zustand'
import { decodeJwtPayload } from '@/utils/jwt'

const USER_DATA_KEY = 'user_data'

interface User {
  id: string
  email: string
  nom: string
  prenom?: string
  entreprise?: string
  actif: boolean
}

interface AuthState {
  user: User | null
  permissions: string[]
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setPermissions: (permissions: string[]) => void
  logout: () => void
}

function userFromStorage(): User | null {
  // Prefer the full user object saved after login (has nom/prenom)
  const stored = localStorage.getItem(USER_DATA_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as User
    } catch {
      localStorage.removeItem(USER_DATA_KEY)
    }
  }
  // Fallback: reconstruct from JWT (limited — no nom/prenom)
  const token = localStorage.getItem('access_token')
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  return {
    id: String(payload.id ?? ''),
    email: (payload.email as string) ?? '',
    nom: '',
    actif: true,
  }
}

function permissionsFromToken(): string[] {
  const token = localStorage.getItem('access_token')
  if (!token) return []
  const payload = decodeJwtPayload(token)
  if (!payload) return []
  const perms = payload.permissions
  if (Array.isArray(perms)) return perms as string[]
  return []
}

export const useAuthStore = create<AuthState>((set) => ({
  user: userFromStorage(),
  permissions: permissionsFromToken(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setUser: (user) => {
    if (user) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_DATA_KEY)
    }
    set({ user, isAuthenticated: !!user })
  },
  setPermissions: (permissions) => set({ permissions }),
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem(USER_DATA_KEY)
    set({ user: null, permissions: [], isAuthenticated: false })
  },
}))
