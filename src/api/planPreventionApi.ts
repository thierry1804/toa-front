import api from '@/lib/axios'
import type { HydraCollection } from '@/types'
import type {
  PlanPrevention,
  PlanPreventionInput,
  RisquePreventionInput,
  RisquePrevention,
  DocumentPrevention,
  SitePrevention,
} from '@/types/planPrevention'

export const planPreventionApi = {
  list: (params?: Record<string, string>) =>
    api
      .get<HydraCollection<PlanPrevention>>('/api/plans-prevention', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<PlanPrevention>(`/api/plans-prevention/${id}`).then((r) => r.data),

  create: (data: PlanPreventionInput) =>
    api.post<PlanPrevention>('/api/plans-prevention', data).then((r) => r.data),

  update: (id: string, data: Partial<PlanPreventionInput>) =>
    api
      .patch<PlanPrevention>(`/api/plans-prevention/${id}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })
      .then((r) => r.data),

  soumettre: (id: string) =>
    api.post<PlanPrevention>(`/api/plans-prevention/${id}/soumettre`).then((r) => r.data),

  addRisque: (id: string, data: RisquePreventionInput) =>
    api
      .post<RisquePrevention>(`/api/plans-prevention/${id}/risques`, data)
      .then((r) => r.data),

  updateRisque: (planId: string, risqueId: string, data: RisquePreventionInput) =>
    api
      .patch<RisquePrevention>(`/api/plans-prevention/${planId}/risques/${risqueId}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })
      .then((r) => r.data),

  deleteRisque: (planId: string, risqueId: string) =>
    api.delete(`/api/plans-prevention/${planId}/risques/${risqueId}`),

  listDocuments: (id: string) =>
    api
      .get<HydraCollection<DocumentPrevention>>(`/api/plans-prevention/${id}/documents`)
      .then((r) => r.data),

  uploadDocument: (id: string, type: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api
      .post<DocumentPrevention>(`/api/plans-prevention/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  examiner: (id: string, commentaire?: string) =>
    api
      .post<PlanPrevention>(`/api/plans-prevention/${id}/examiner`, commentaire ? { commentaire } : {})
      .then((r) => r.data),

  valider: (id: string, commentaire?: string) =>
    api
      .post<PlanPrevention>(`/api/plans-prevention/${id}/valider`, commentaire ? { commentaire } : {})
      .then((r) => r.data),

  refuser: (id: string, commentaire: string) =>
    api
      .post<PlanPrevention>(`/api/plans-prevention/${id}/refuser`, { commentaire })
      .then((r) => r.data),

  resoumettre: (id: string, motifResoumission?: string) =>
    api
      .post<PlanPrevention>(
        `/api/plans-prevention/${id}/resoumettre`,
        motifResoumission ? { motifResoumission } : {},
      )
      .then((r) => r.data),

  importKmz: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<PlanPrevention>(`/api/plans-prevention/${id}/import-kmz`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}

