import { useAuthStore } from '@/store/auth.store'
import { usePermissions } from '@/features/menus/hooks/usePermissions'

export function usePermission(permission: string): boolean {
  const actionGranted = useAuthStore((s) => s.permissions.includes(permission))
  const roles = useAuthStore((s) => s.roles)
  const permitMenu = usePermissions('/permits-travail')
  // R-14 : la création d'un permis est réservée au seul rôle Agent de terrain,
  // sans exception ; la matrice de menus d'administration reste requise en plus.
  if (permission === 'permit_travail.create') {
    return roles.includes('ROLE_AGENT_TERRAIN') && (permitMenu?.canCreate ?? false)
  }
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
