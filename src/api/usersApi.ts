import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import type { User, UserCreate, UserUpdate, HydraCollection } from '@/types'

export const usersApi = {
  list: (params?: { page?: number; itemsPerPage?: number }) =>
    api
      .get<HydraCollection<User>>('/api/users', { params: withNewestFirst(params) })
      .then((r) => r.data),

  getById: (id: number) =>
    api.get<User>(`/api/users/${id}`).then((r) => r.data),

  create: (data: UserCreate) =>
    api.post<User>('/api/users', data).then((r) => r.data),

  update: (id: number, data: UserUpdate) =>
    api.put<User>(`/api/users/${id}`, data).then((r) => r.data),

  patch: (id: number, data: Partial<UserUpdate>) =>
    api.patch<User>(`/api/users/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  delete: (id: number) => api.delete(`/api/users/${id}`),

  uploadSignature: (id: number, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<User>(`/api/users/${id}/signature`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data)
  },

  signatureDownloadUrl: (id: number) => `/api/users/${id}/signature/download`,

  // Plain <img src="..."> can't send the Authorization header the API
  // requires, so the signature must be fetched as an authenticated blob
  // and turned into an object URL by the caller.
  getSignatureBlob: (id: number) =>
    api
      .get(`/api/users/${id}/signature/download`, { responseType: 'blob' })
      .then((r) => r.data as Blob),
}
