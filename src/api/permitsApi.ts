import api from '@/lib/axios'
import type { Permit } from '@/types'

export const permitsApi = {
  list: (params?: Record<string, string>) =>
    api.get<Permit[]>('/permits', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Permit>(`/permits/${id}`).then((r) => r.data),

  create: (data: Partial<Permit>) =>
    api.post<Permit>('/permits', data).then((r) => r.data),

  update: (id: string, data: Partial<Permit>) =>
    api.put<Permit>(`/permits/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/permits/${id}`),

  submit: (id: string) =>
    api.post<Permit>(`/permits/${id}/submit`).then((r) => r.data),

  validate: (id: string, role: 'chef' | 'hse') =>
    api.post<Permit>(`/permits/${id}/validate`, { role }).then((r) => r.data),

  reject: (id: string, reason: string) =>
    api
      .post<Permit>(`/permits/${id}/reject`, { reason })
      .then((r) => r.data),
}
