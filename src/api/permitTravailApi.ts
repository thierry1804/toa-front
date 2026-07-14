import api from '@/lib/axios'
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
} from '@/types/permitTravail'

export const permitTravailApi = {
  list: (params?: Record<string, string>) =>
    api
      .get<HydraCollection<PermitTravail>>('/api/permits-travail', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<PermitTravail>(`/api/permits-travail/${id}`).then((r) => r.data),

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

  uploadDocument: (id: string, type: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)
    return api
      .post<DocumentPermitTravail>(`/api/permits-travail/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  downloadDocument: async (permitId: string, documentId: string, filename?: string): Promise<void> => {
    const response = await api.get(
      `/api/permits-travail/${permitId}/documents/${documentId}/download`,
      { responseType: 'blob' },
    )
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? documentId
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
    const params: Record<string, string | number> = { itemsPerPage: 50 }
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
