import api from '@/lib/axios'
import { openBlobInNewTab, triggerBlobDownload } from '@/lib/downloadBlob'
import { withNewestFirst } from '@/lib/listOrder'
import { withSnapshotFallback } from '@/offline/withSnapshotFallback'
import { snapshotById, snapshotList } from '@/offline/snapshotRead'
import type { ActivityPlanning, HydraCollection } from '@/types'
import type {
  PlanPrevention,
  PlanPreventionInput,
  RisquePreventionInput,
  RisquePrevention,
  DocumentPrevention,
  KmzImportResult,
  PlanPreventionPdfStatus,
  GeneratePdfResult,
  PlansBySiteResponse,
} from '@/types/planPrevention'

export const planPreventionApi = {
  list: (params?: Record<string, string | string[]>) =>
    withSnapshotFallback(
      () =>
        api
          .get<HydraCollection<PlanPrevention>>('/api/plans-prevention', {
            params: withNewestFirst(params),
          })
          .then((r) => r.data),
      () => snapshotList<PlanPrevention>('plansPrevention', params),
    ),

  getById: (id: string) =>
    withSnapshotFallback(
      () => api.get<PlanPrevention>(`/api/plans-prevention/${id}`).then((r) => r.data),
      () => snapshotById<PlanPrevention>('plansPrevention', id),
    ),

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
      .post<KmzImportResult>(`/api/plans-prevention/${id}/import-kmz`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deleteSite: (planId: string, siteId: string) =>
    api.delete(`/api/plans-prevention/${planId}/sites/${siteId}`),

  generatePdf: (planId: string) =>
    api
      .post<GeneratePdfResult>(`/api/plans-prevention/${planId}/generate-pdf`)
      .then((r) => r.data),

  getPdfStatus: (planId: string) =>
    api
      .get<PlanPreventionPdfStatus>(`/api/plans-prevention/${planId}/pdf/status`)
      .then((r) => r.data),

  getPlansBySite: (codeSite: string): Promise<PlansBySiteResponse> =>
    api
      .get<PlansBySiteResponse>('/api/plans-prevention/by-site', { params: { codeSite } })
      .then((r) => r.data),

  // TODO: Backend must expose GET /api/planifications?disponible=true
  // Filter: planifications owned by connected user AND not linked to any PlanPrevention
  listPlanificationsDisponibles: () =>
    api
      .get<HydraCollection<ActivityPlanning>>('/api/planifications', {
        params: { disponible: true },
      })
      .then((r) => r.data),

  getDocumentBlob: (planId: string, documentId: string): Promise<Blob> =>
    api
      .get(`/api/plans-prevention/${planId}/documents/${documentId}/download`, {
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),

  viewDocument: async (planId: string, documentId: string): Promise<void> => {
    const blob = await planPreventionApi.getDocumentBlob(planId, documentId)
    openBlobInNewTab(blob)
  },

  downloadDocument: async (planId: string, documentId: string, filename: string): Promise<void> => {
    const blob = await planPreventionApi.getDocumentBlob(planId, documentId)
    triggerBlobDownload(blob, filename)
  },

  downloadPdf: async (planId: string): Promise<void> => {
    const token = localStorage.getItem('access_token') ?? ''
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/plans-prevention/${planId}/pdf/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) throw new Error('Téléchargement PDF échoué')
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'plan_prevention.pdf'
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  },
}

