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

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ROLE_CHEF_PROJET:  ['plan_prevention.examine'],
  ROLE_HSE:          [
    'plan_prevention.valider_hse', 'plan_prevention.refuser_hse',
    'plan_prevention.generate_pdf', 'plan_prevention.download_pdf',
    'permit_travail.valider_hse', 'permit_travail.refuser_hse',
    'permit_travail.generate_pdf', 'permit_travail.cloturer',
    'permit_travail.suivi', 'permit_travail.logs',
  ],
  ROLE_PRESTATAIRE:  [
    'plan_prevention.resoumettre',
    'permit_travail.view', 'permit_travail.edit', 'permit_travail.resoumettre', 'permit_travail.cloturer',
    'intervention.create', 'intervention.view', 'intervention.edit', 'intervention.valider_evaluation',
    'suivi_journalier.create', 'suivi_journalier.view', 'suivi_journalier.edit', 'suivi_journalier.delete_document',
  ],
  ROLE_ADMIN:        [
    'plan_prevention.examine', 'plan_prevention.valider_hse', 'plan_prevention.refuser_hse',
    'plan_prevention.generate_pdf', 'plan_prevention.download_pdf',
    'permit_travail.valider_hse', 'permit_travail.refuser_hse',
    'permit_travail.generate_pdf',
    'permit_travail.suivi', 'permit_travail.logs',
    'edit_users', 'create_users',
    'intervention.view', 'intervention.view_all',
    'suivi_journalier.view',
  ],
  ROLE_SUPER_ADMIN:  [
    'plan_prevention.examine', 'plan_prevention.valider_hse', 'plan_prevention.refuser_hse',
    'plan_prevention.generate_pdf', 'plan_prevention.download_pdf',
    'permit_travail.valider_hse', 'permit_travail.refuser_hse',
    'permit_travail.generate_pdf', 'permit_travail.cloturer',
    'permit_travail.suivi', 'permit_travail.logs',
    'edit_users', 'create_users',
    'intervention.view', 'intervention.view_all',
    'suivi_journalier.create', 'suivi_journalier.view', 'suivi_journalier.edit', 'suivi_journalier.delete_document',
  ],
}

function derivePermissionsFromRoles(roles: string[]): string[] {
  const set = new Set<string>()
  for (const role of roles) {
    for (const perm of ROLE_PERMISSIONS[role] ?? []) set.add(perm)
  }
  return [...set]
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
  if (Array.isArray(perms) && perms.length > 0) return perms as string[]
  return derivePermissionsFromRoles(rolesFromToken())
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
    localStorage.removeItem(USER_DATA_KEY)
    set({ user: null, permissions: [], roles: [], isAuthenticated: false })
  },
}))

export { ROLE_PERMISSIONS, derivePermissionsFromRoles }
