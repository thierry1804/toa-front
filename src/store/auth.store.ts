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
  roles: string[]
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setPermissions: (permissions: string[]) => void
  setRoles: (roles: string[]) => void
  logout: () => void
}

function readTokenPayload(): Record<string, unknown> | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  return decodeJwtPayload(token)
}

function rolesFromToken(): string[] {
  const payload = readTokenPayload()
  if (!payload) return []
  const roles = payload.roles
  return Array.isArray(roles) ? (roles as string[]) : []
}

function permissionsFromToken(): string[] {
  const payload = readTokenPayload()
  if (!payload) return []
  const perms = payload.permissions
  return Array.isArray(perms) ? perms.filter((permission): permission is string => typeof permission === 'string') : []
}

function userFromStorage(): User | null {
  const stored = localStorage.getItem(USER_DATA_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as User
    } catch {
      localStorage.removeItem(USER_DATA_KEY)
    }
  }
  const payload = readTokenPayload()
  if (!payload) return null
  return {
    id: String(payload.id ?? ''),
    email: (payload.email as string) ?? (payload.username as string) ?? '',
    nom: '',
    actif: true,
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: userFromStorage(),
  permissions: permissionsFromToken(),
  roles: rolesFromToken(),
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
  setRoles: (roles) => set({ roles }),
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem(USER_DATA_KEY)
    set({ user: null, permissions: [], roles: [], isAuthenticated: false })
  },
}))
