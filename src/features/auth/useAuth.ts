import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/auth.store'
import { decodeJwtPayload } from '@/utils/jwt'
import { ROLE_MAP } from '@/data/constant/roles'

function mapRole(roles: unknown): string {
  if (Array.isArray(roles) && roles.length > 0) {
    const symfonyRole = roles.find((r): r is string => typeof r === 'string' && r.startsWith('ROLE_'))
    if (symfonyRole) return ROLE_MAP[symfonyRole] ?? symfonyRole
  }
  if (typeof roles === 'string') return ROLE_MAP[roles] ?? roles
  return 'prestataire'
}

export function useLogin() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      localStorage.setItem('access_token', data.token)
      const payload = decodeJwtPayload(data.token)
      setUser({
        id: String(payload?.id ?? ''),
        email: (payload?.email as string) ?? '',
        nom: (payload?.nom as string) ?? '',
        role: mapRole(payload?.roles),
        actif: true,
      })
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
