import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import { withSnapshotFallback } from '@/offline/withSnapshotFallback'
import { snapshotById, snapshotList } from '@/offline/snapshotRead'
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
    withSnapshotFallback(
      () =>
        api
          .get<HydraCollection<Entreprise>>('/api/entreprises', {
            params: withNewestFirst({ pagination: false }),
          })
          .then((r) => r.data),
      () => snapshotList<Entreprise>('entreprises'),
    ),

  getById: (id: string) =>
    withSnapshotFallback(
      () => api.get<Entreprise>(`/api/entreprises/${id}`).then((r) => r.data),
      () => snapshotById<Entreprise>('entreprises', id),
    ),

  create: (data: EntrepriseCreate) =>
    api.post<Entreprise>('/api/entreprises', data).then((r) => r.data),

  update: (id: string, data: EntrepriseUpdate) =>
    api.patch<Entreprise>(`/api/entreprises/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  delete: (id: string) => api.delete(`/api/entreprises/${id}`),
}
