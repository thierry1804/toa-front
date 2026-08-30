import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import type { HydraCollection } from '@/types'
import type {
  Intervention,
  EvaluationRisque,
  EvaluationRisqueInput,
  SuiviJournalier,
  SuiviJournalierInput,
  SuiviJournalierUpdateInput,
  SuiviJournalierDocument,
  InterventionSuiviFilters,
  InterventionDashboard,
  InterventionDetailHse,
  InterventionStatsJournalieres,
  ControleJournalier,
  ControleJournalierInput,
  ControleJournalierUpdateInput,
  Take5Record,
  Take5RecordInput,
} from '@/types/intervention'
import type { KpiIntervention } from '@/types/permitTravail'

export const interventionApi = {
  getAll: (params?: { page?: number; itemsPerPage?: number }) =>
    api
      .get<HydraCollection<Intervention>>('/api/interventions', {
        params: withNewestFirst(params),
      })
      .then((r) => r.data),

  create: (permitTravailId: string) =>
    api
      .post<Intervention>('/api/interventions', {
        permitTravail: `/api/permits-travail/${permitTravailId}`,
      })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Intervention>(`/api/interventions/${id}`).then((r) => r.data),

  getRisques: (interventionId: string) =>
    api
      .get<HydraCollection<EvaluationRisque>>(`/api/interventions/${interventionId}/risques`)
      .then((r) => r.data),

  updateRisque: (interventionId: string, risqueId: string, data: EvaluationRisqueInput) =>
    api
      .patch<EvaluationRisque>(
        `/api/interventions/${interventionId}/risques/${risqueId}`,
        data,
        { headers: { 'Content-Type': 'application/merge-patch+json' } },
      )
      .then((r) => r.data),

  validerEvaluation: (id: string) =>
    api.post<Intervention>(`/api/interventions/${id}/valider-evaluation`).then((r) => r.data),

  getSuivis: (interventionId: string) =>
    api
      .get<HydraCollection<SuiviJournalier>>(`/api/interventions/${interventionId}/suivis`)
      .then((r) => r.data),

  createSuivi: (data: SuiviJournalierInput) =>
    api.post<SuiviJournalier>('/api/suivis-journaliers', data).then((r) => r.data),

  updateSuivi: (id: string, data: SuiviJournalierUpdateInput) =>
    api
      .patch<SuiviJournalier>(`/api/suivis-journaliers/${id}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })
      .then((r) => r.data),

  uploadSuiviDocument: (suiviId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api
      .post<SuiviJournalierDocument>(`/api/suivis-journaliers/${suiviId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  deleteSuiviDocument: (suiviId: string, docId: string) =>
    api
      .delete(`/api/suivis-journaliers/${suiviId}/documents/${docId}`)
      .then((r) => r.data),

  getSuiviDocumentBlob: (suiviId: string, docId: string): Promise<Blob> =>
    api
      .get(`/api/suivis-journaliers/${suiviId}/documents/${docId}/download`, {
        responseType: 'blob',
      })
      .then((r) => r.data as Blob),

  getDashboard: (filters?: InterventionSuiviFilters) => {
    const params: Record<string, string> = {}
    if (filters?.codeSite)  params.codeSite  = filters.codeSite
    if (filters?.dateDebut) params.dateDebut = filters.dateDebut
    if (filters?.dateFin)   params.dateFin   = filters.dateFin
    if (filters?.statut)    params.statut    = filters.statut
    return api.get<InterventionDashboard>('/api/interventions/dashboard', { params }).then((r) => r.data)
  },

  getSuiviHse: (id: string) =>
    api.get<InterventionDetailHse>(`/api/interventions/${id}/suivi-hse`).then((r) => r.data),

  getStatsJournalieres: (codeSite: string, date?: string) => {
    const params: Record<string, string> = { codeSite }
    if (date) params.date = date
    return api.get<InterventionStatsJournalieres>('/api/interventions/stats-journalieres', { params }).then((r) => r.data)
  },

  getControlesJournaliers: (interventionId: string) =>
    api
      .get<HydraCollection<ControleJournalier>>(`/api/interventions/${interventionId}/controles-journaliers`)
      .then((r) => r.data),

  createControleJournalier: (data: ControleJournalierInput) =>
    api.post<ControleJournalier>('/api/controles-journaliers', data).then((r) => r.data),

  updateControleJournalier: (id: string, data: ControleJournalierUpdateInput) =>
    api
      .patch<ControleJournalier>(`/api/controles-journaliers/${id}`, data, {
        headers: { 'Content-Type': 'application/merge-patch+json' },
      })
      .then((r) => r.data),

  getTake5Records: (interventionId: string) =>
    api
      .get<HydraCollection<Take5Record>>(`/api/interventions/${interventionId}/take5-records`)
      .then((r) => r.data),

  createTake5Record: (data: Take5RecordInput) =>
    api.post<Take5Record>('/api/take5-records', data).then((r) => r.data),

  getKpis: (codeSite?: string, periode?: string) => {
    const params: Record<string, string> = {}
    if (codeSite) params.codeSite = codeSite
    if (periode) params.periode = periode
    return api.get<KpiIntervention>('/api/interventions/kpis', { params }).then((r) => r.data)
  },
}
