import api from '@/lib/axios'
import type { MenuAccess, MenuAccessCreate, MenuAccessUpdate, HydraCollection } from '@/types'

export const menuAccessesApi = {
  list: () =>
    api
      .get<HydraCollection<MenuAccess>>('/api/menu-accesses', { params: { pagination: false } })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<MenuAccess>(`/api/menu-accesses/${id}`).then((r) => r.data),

  create: (data: MenuAccessCreate) =>
    api.post<MenuAccess>('/api/menu-accesses', data).then((r) => r.data),

  update: (id: number, data: MenuAccessUpdate) =>
    api.put<MenuAccess>(`/api/menu-accesses/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/menu-accesses/${id}`),
}
