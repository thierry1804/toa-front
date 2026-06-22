import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/auth.store'
import { decodeJwtPayload } from '@/utils/jwt'

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const setPermissions = useAuthStore((s) => s.setPermissions)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.token)
      const payload = decodeJwtPayload(data.token)
      setUser({
        id: String(data.user?.id ?? payload?.id ?? ''),
        email: data.user?.email ?? (payload?.email as string) ?? '',
        nom: data.user?.name ?? '',
        prenom: data.user?.firstname ?? undefined,
        actif: data.user?.isActive ?? true,
      })
      const perms = Array.isArray(payload?.permissions) ? (payload!.permissions as string[]) : []
      setPermissions(perms)
      navigate('/dashboard')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('access_token')
    },
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}
