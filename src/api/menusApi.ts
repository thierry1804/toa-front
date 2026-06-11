import api from '@/lib/axios'
import type { Menu, MenuCreate, MenuUpdate, HydraCollection } from '@/types'

export const menusApi = {
  list: () =>
    api.get<HydraCollection<Menu>>('/api/menus').then((r) => r.data),

  getById: (id: number) =>
    api.get<Menu>(`/api/menus/${id}`).then((r) => r.data),

  create: (data: MenuCreate) =>
    api.post<Menu>('/api/menus', data).then((r) => r.data),

  update: (id: number, data: MenuUpdate) =>
    api.put<Menu>(`/api/menus/${id}`, data).then((r) => r.data),

  patch: (id: number, data: Partial<MenuUpdate>) =>
    api.patch<Menu>(`/api/menus/${id}`, data).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/menus/${id}`),
}
