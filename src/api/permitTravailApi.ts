import api from '@/lib/axios'
import { triggerBlobDownload } from '@/lib/downloadBlob'
import { withNewestFirst } from '@/lib/listOrder'
import { withSnapshotFallback } from '@/offline/withSnapshotFallback'
import { snapshotById, snapshotList } from '@/offline/snapshotRead'
import { putCachedDocument, withCachedDocumentBlob } from '@/offline/docCache'
import type { HydraCollection } from '@/types'
import type {
  PermitTravail,
  PermitTravailInput,
  DocumentPermitTravail,
  PermitTravailPdfStatus,
  GeneratePermitTravailPdfResult,
  VersionPermitTravail,
  PermitTravailSuiviData,
  PermitTravailStatsJournalieresData,
  PermitTravailLog,
  PermitTravailSuiviFilters,
  CloturePermData,
  PvReceptionStatus,
  CloturerPermitResult,
  DecisionCdpPvReception,
} from '@/types/permitTravail'

export const permitTravailApi = {
  list: (params?: Record<string, string | string[]>) =>
    withSnapshotFallback(
      () =>
        api
          .get<HydraCollection<PermitTravail>>('/api/permits-travail', {
            params: withNewestFirst(params),
          })
          .then((r) => r.data),
      () => snapshotList<PermitTravail>('permitsTravail', params),
    ),

  getById: (id: string) =>
    withSnapshotFallback(
      () => api.get<PermitTravail>(`/api/permits-travail/${id}`).then((r) => r.data),
      () => snapshotById<PermitTravail>('permitsTravail', id),
    ),

  create: (data: PermitTravailInput) => {
    const { planPreventionId, ...rest } = data
    const body = {
      ...rest,
      ...(planPreventionId ? { planPrevention: `/api/plans-prevention/${planPreventionId}` } : {}),
    }
    return api.post<PermitTravail>('/api/permits-travail', body).then((r) => r.data)
  },

  update: (id: string, data: Partial<PermitTravailInput>) =>
    api
      .patch<PermitTravail>(`/api/permits-travail/${id}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })
      .then((r) => r.data),

  delete: (id: string): Promise<void> =>
    api.delete(`/api/permits-travail/${id}`).then(() => undefined),

  uploadDocument: (id: string, type: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api
      .post<DocumentPermitTravail>(`/api/permits-travail/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(async (r) => {
        const doc = r.data
        await putCachedDocument(
          `/api/permits-travail/${id}/documents/${doc.id}/download`,
          file,
          file.name,
        ).catch(() => false)
        return doc
      })
  },

  getDocumentBlob: (permitId: string, documentId: string): Promise<Blob> => {
    const url = `/api/permits-travail/${permitId}/documents/${documentId}/download`
    return withCachedDocumentBlob(url, () =>
      api.get(url, { responseType: 'blob' }).then((r) => r.data as Blob),
    )
  },

  downloadDocument: async (permitId: string, documentId: string, filename?: string): Promise<void> => {
    const blob = await permitTravailApi.getDocumentBlob(permitId, documentId)
    triggerBlobDownload(blob, filename ?? documentId)
  },

  soumettre: (id: string) =>
    api.post<PermitTravail>(`/api/permits-travail/${id}/soumettre`).then((r) => r.data),

  valider: (id: string, commentaire?: string) =>
    api
      .post<PermitTravail>(`/api/permits-travail/${id}/valider`, commentaire ? { commentaire } : {})
      .then((r) => r.data),

  refuser: (id: string, commentaire: string) =>
    api
      .post<PermitTravail>(`/api/permits-travail/${id}/refuser`, { commentaire })
      .then((r) => r.data),

  resoumettre: (id: string, motifResoumission?: string) =>
    api
      .post<PermitTravail>(`/api/permits-travail/${id}/resoumettre`, motifResoumission ? { motifResoumission } : {})
      .then((r) => r.data),

  getVersions: (id: string) =>
    api.get<VersionPermitTravail[]>(`/api/permits-travail/${id}/versions`).then((r) => r.data),

  generatePdf: (id: string) =>
    api
      .post<GeneratePermitTravailPdfResult>(`/api/permits-travail/${id}/generate-pdf`)
      .then((r) => r.data),

  getPdfStatus: (id: string) =>
    api
      .get<PermitTravailPdfStatus>(`/api/permits-travail/${id}/pdf/status`)
      .then((r) => r.data),

  getSuivi: (filters?: PermitTravailSuiviFilters) => {
    const params: Record<string, string> = {}
    if (filters?.codeSite) params.codeSite = filters.codeSite
    if (filters?.typePermis) params.typePermis = filters.typePermis
    if (filters?.statut) params.statut = filters.statut
    if (filters?.dateDebut) params.dateDebut = filters.dateDebut
    if (filters?.dateFin) params.dateFin = filters.dateFin
    return api.get<PermitTravailSuiviData>('/api/permits-travail/suivi', { params }).then((r) => r.data)
  },

  getLogs: (permitId: string, date?: string) => {
    const params: Record<string, string | number> = withNewestFirst({ itemsPerPage: 50 })
    if (date) params.date = date
    return api
      .get<HydraCollection<PermitTravailLog>>(`/api/permits-travail/${permitId}/logs`, { params })
      .then((r) => r.data)
  },

  getStatsJournalieres: (date?: string, codeSite?: string, typePermis?: string) => {
    const params: Record<string, string> = {}
    if (date) params.date = date
    if (codeSite) params.codeSite = codeSite
    if (typePermis) params.typePermis = typePermis
    return api
      .get<PermitTravailStatsJournalieresData>('/api/permits-travail/suivi/stats-journalieres', { params })
      .then((r) => r.data)
  },

  cloturerPermit: (id: string, data: { commentaire?: string; accordClient?: boolean }) =>
    api
      .post<CloturerPermitResult>(`/api/permits-travail/${id}/cloturer`, data)
      .then((r) => r.data),

  getCloture: (id: string) =>
    api.get<CloturePermData>(`/api/permits-travail/${id}/cloture`).then((r) => r.data),

  validerPv: (id: string, commentaire?: string) =>
    api
      .post<PermitTravail>(`/api/permits-travail/${id}/pv/valider`, commentaire ? { commentaire } : {})
      .then((r) => r.data),

  refuserPv: (id: string, commentaire: string) =>
    api
      .post<PermitTravail>(`/api/permits-travail/${id}/pv/refuser`, { commentaire })
      .then((r) => r.data),

  getPvDecision: (id: string) =>
    api.get<DecisionCdpPvReception[]>(`/api/permits-travail/${id}/pv/decision`).then((r) => r.data),

  getPvStatus: (id: string) =>
    api.get<PvReceptionStatus>(`/api/permits-travail/${id}/pv/status`).then((r) => r.data),

  downloadPv: async (id: string): Promise<void> => {
    const token = localStorage.getItem('access_token') ?? ''
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/permits-travail/${id}/pv/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) throw new Error('Téléchargement PV échoué')
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'pv_reception.pdf'
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  },

  downloadPdf: async (id: string): Promise<void> => {
    const token = localStorage.getItem('access_token') ?? ''
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/permits-travail/${id}/pdf/download`,
      { headers: { Authorization: `Bearer ${token}` } },
    )
    if (!res.ok) throw new Error('Téléchargement PDF échoué')
    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') ?? ''
    const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? 'permit_travail.pdf'
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
