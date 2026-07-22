import api from '@/lib/axios'
import type { HydraCollection } from '@/types'
import type { Intervention, EvaluationRisque, EvaluationRisqueInput } from '@/types/intervention'

export const interventionApi = {
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
}
