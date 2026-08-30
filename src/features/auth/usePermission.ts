import { useAuthStore, derivePermissionsFromRoles } from '@/store/auth.store'

export function usePermission(permission: string): boolean {
  return useAuthStore((s) => {
    if (s.permissions.includes(permission)) return true
    // Fallback: derive from roles (handles old tokens and HMR state issues)
    return derivePermissionsFromRoles(s.roles).includes(permission)
  })
}

export function useHasPermissions(): boolean {
  return useAuthStore((s) => s.permissions.length > 0 || s.roles.length > 0)
}

export function useRole(): string[] {
  return useAuthStore((s) => s.roles)
}

export function useHasRole(...roles: string[]): boolean {
  return useAuthStore((s) => s.roles.some((r) => roles.includes(r)))
}
