import api from '@/lib/axios'
import type { User, UserCreate, UserUpdate, HydraCollection } from '@/types'

export const usersApi = {
  list: () =>
    api.get<HydraCollection<User>>('/api/users').then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/api/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) =>
    api.post<User>('/api/users', data).then((r) => r.data),

  update: (id: number, data: UserUpdate) =>
    api.put<User>(`/api/users/${id}`, data).then((r) => r.data),

  patch: (id: number, data: Partial<UserUpdate>) =>
    api.patch<User>(`/api/users/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/users/${id}`),
}
