import api from '@/lib/axios'
import type { Entreprise } from '@/types'

export interface MeProfile {
  id: number
  email: string
  name: string
  firstname: string
  roles: string[]
  entrepriseName?: string | null
  entreprise?: Entreprise | null
  signaturePath?: string | null
}

export const meApi = {
  get: () => api.get<MeProfile>('/api/me').then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api
      .patch('/api/me/password', { currentPassword, newPassword })
      .then((r) => r.data),
}
