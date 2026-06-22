import { useAuthStore } from '@/store/auth.store'

export function usePermission(permission: string): boolean {
  return useAuthStore((s) => s.permissions.includes(permission))
}

export function useHasPermissions(): boolean {
  return useAuthStore((s) => s.permissions.length > 0)
}
