import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import type { Role, RoleCreate, RoleUpdate, HydraCollection } from '@/types'

export const rolesApi = {
  list: (params?: { page?: number; itemsPerPage?: number }) =>
    api
      .get<HydraCollection<Role>>('/api/roles', { params: withNewestFirst(params) })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<Role>(`/api/roles/${id}`).then((r) => r.data),

  create: (data: RoleCreate) =>
    api.post<Role>('/api/roles', data).then((r) => r.data),

  patch: (id: number, data: RoleUpdate) =>
    api.patch<Role>(`/api/roles/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/roles/${id}`),
}
