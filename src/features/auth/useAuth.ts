import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/auth.store'
import { decodeJwtPayload } from '@/utils/jwt'
import { useMenuStore } from '@/store/menu.store'
import { clearOfflineState } from '@/offline/clearOfflineState'

function resolvePermissions(payload: Record<string, unknown> | null): string[] {
  if (!payload) return []
  const perms = payload.permissions
  return Array.isArray(perms) ? perms.filter((permission): permission is string => typeof permission === 'string') : []
}

function resolveRoles(payload: Record<string, unknown> | null): string[] {
  if (!payload) return []
  const roles = payload.roles
  return Array.isArray(roles) ? (roles as string[]) : []
}

export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const setUser = useAuthStore((s) => s.setUser)
  const setPermissions = useAuthStore((s) => s.setPermissions)
  const setRoles = useAuthStore((s) => s.setRoles)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.token)
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token)
      }
      const payload = decodeJwtPayload(data.token)
      setUser({
        id: String(data.user?.id ?? payload?.id ?? ''),
        email: data.user?.email ?? (payload?.email as string) ?? (payload?.username as string) ?? '',
        nom: data.user?.name ?? '',
        prenom: data.user?.firstname ?? undefined,
        actif: data.user?.isActive ?? true,
      })
      setRoles(resolveRoles(payload))
      setPermissions(resolvePermissions(payload))
      // force fresh DB permissions on next AppShell render
      void queryClient.invalidateQueries({ queryKey: ['me', 'permissions'] })
      navigate('/dashboard')
    },
  })
}

export function useRefreshPermissions() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const setPermissions = useAuthStore((s) => s.setPermissions)

  return useQuery({
    queryKey: ['me', 'permissions'],
    queryFn: async () => {
      const permissions = await authApi.getMyPermissions()
      setPermissions(permissions)
      return permissions
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await clearOfflineState()
    },
    onSettled: () => {
      useMenuStore.getState().clear()
      queryClient.clear()
      logout()
      navigate('/login')
    },
  })
}
