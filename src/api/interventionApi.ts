import api from '@/lib/axios'
import type { HydraCollection } from '@/types'
import type {
  Intervention,
  EvaluationRisque,
  EvaluationRisqueInput,
  SuiviJournalier,
  SuiviJournalierInput,
  SuiviJournalierUpdateInput,
  SuiviJournalierDocument,
} from '@/types/intervention'

export const interventionApi = {
  getAll: () =>
    api.get<HydraCollection<Intervention>>('/api/interventions').then((r) => r.data),

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
}
