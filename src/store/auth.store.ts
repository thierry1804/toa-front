import { create } from 'zustand'
import { decodeJwtPayload } from '@/utils/jwt'

export type Feature =
  | 'view_users'
  | 'create_users'
  | 'edit_users'
  | 'delete_users'
  | 'view_planning'
  | 'create_planning'
  | 'edit_planning'
  | 'delete_planning'
  | 'manage_menus'

const ROLE_FEATURES: Record<string, Feature[]> = {
  super_admin: [
    'view_users', 'create_users', 'edit_users', 'delete_users',
    'view_planning', 'create_planning', 'edit_planning', 'delete_planning',
    'manage_menus',
  ],
  admin: [
    'view_users', 'create_users', 'edit_users', 'delete_users',
    'view_planning', 'create_planning', 'edit_planning', 'delete_planning',
  ],
  chef_projet: [
    'view_users',
    'view_planning', 'create_planning', 'edit_planning', 'delete_planning',
  ],
  hse: ['view_users', 'view_planning'],
  prestataire: ['view_planning'],
  dg: ['view_users', 'view_planning'],
}

const ROLE_MAP: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'super_admin',
  ROLE_ADMIN: 'admin',
  ROLE_CHEF_PROJET: 'chef_projet',
  ROLE_HSE: 'hse',
  ROLE_PRESTATAIRE: 'prestataire',
  ROLE_DG: 'dg',
}

function mapRole(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) {
    const symfonyRole = roles.find((r): r is string => typeof r === 'string' && r.startsWith('ROLE_'))
    if (symfonyRole) return ROLE_MAP[symfonyRole] ?? symfonyRole
  }
  if (typeof roles === 'string') return ROLE_MAP[roles] ?? roles
  return 'prestataire'
}

function userFromToken(): User | null {
  const token = localStorage.getItem('access_token')
  if (!token) return null
  const payload = decodeJwtPayload(token)
  if (!payload) return null
  return {
    id: String(payload.id ?? ''),
    email: (payload.email as string) ?? '',
    nom: (payload.nom as string) ?? '',
    role: mapRole(payload.roles),
    actif: true,
  }
}

interface User {
  id: string
  email: string
  nom: string
  role: string
  actif: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  canAccessFeature: (feature: Feature) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: userFromToken(),
  isAuthenticated: !!localStorage.getItem('access_token'),
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    localStorage.removeItem('access_token')
    set({ user: null, isAuthenticated: false })
  },
  canAccessFeature: (feature: Feature) => {
    const role = get().user?.role ?? ''
    const features = ROLE_FEATURES[role] ?? []
    return features.includes(feature)
  },
}))
