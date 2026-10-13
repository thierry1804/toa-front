import { useAuthStore } from '@/store/auth.store'
import { usePermissions } from '@/features/menus/hooks/usePermissions'

export function usePermission(permission: string): boolean {
  const actionGranted = useAuthStore((s) => s.permissions.includes(permission))
  const permitMenu = usePermissions('/permits-travail')
  // The admin menu matrix is authoritative for permit creation.
  if (permission === 'permit_travail.create') return permitMenu?.canCreate ?? false
  return actionGranted
}

export function useHasPermissions(): boolean {
  return useAuthStore((s) => s.permissions.length > 0)
}

export function useRole(): string[] {
  return useAuthStore((s) => s.roles)
}

export function useHasRole(...roles: string[]): boolean {
  return useAuthStore((s) => s.roles.some((r) => roles.includes(r)))
}
