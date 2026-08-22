import api from '@/lib/axios'
import type { Entreprise, HydraCollection } from '@/types'

export interface EntrepriseCreate {
  nom: string
  numeroRegistreCommerce?: string | null
  siegeSocial?: string | null
  qualiteRepresentant?: string | null
}

export interface EntrepriseUpdate {
  nom?: string
  numeroRegistreCommerce?: string | null
  siegeSocial?: string | null
  qualiteRepresentant?: string | null
}

export const entrepriseApi = {
  list: () =>
    api
      .get<HydraCollection<Entreprise>>('/api/entreprises', { params: { pagination: false } })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Entreprise>(`/api/entreprises/${id}`).then((r) => r.data),

  create: (data: EntrepriseCreate) =>
    api.post<Entreprise>('/api/entreprises', data).then((r) => r.data),

  update: (id: string, data: EntrepriseUpdate) =>
    api.patch<Entreprise>(`/api/entreprises/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  delete: (id: string) => api.delete(`/api/entreprises/${id}`),
}
