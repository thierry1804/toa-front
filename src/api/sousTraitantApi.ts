import api from '@/lib/axios'
import { hydraMember } from '@/offline/asHydra'

export interface SousTraitant {
  '@id': string
  id: string
  nom: string
  entreprise?: string | { '@id': string } | null
}

export interface PlanificationAffectation {
  id: number
  siteCode: string | null
  siteName: string | null
  process: string | null
  typeIntervention: string | null
  sousTraitantIds: string[]
  planPreventionReference: string | null
  activitePlanifiee: string | null
}

export const sousTraitantApi = {
  list: () =>
    api
      .get('/api/sous-traitants', { params: { itemsPerPage: 200 } })
      .then((r) => hydraMember<SousTraitant>(r.data)),

  create: (nom: string) =>
    api.post<SousTraitant>('/api/sous-traitants', { nom }).then((r) => r.data),

  remove: (id: string) => api.delete(`/api/sous-traitants/${id}`),

  affectations: () =>
    api
      .get<{ planifications: PlanificationAffectation[] }>('/api/planifications-affectations')
      .then((r) => r.data.planifications),

  saveAffectation: (id: number, sousTraitantIds: string[]) =>
    api
      .put<PlanificationAffectation>(`/api/planifications-affectations/${id}`, { sousTraitantIds })
      .then((r) => r.data),
}

export function entrepriseIriOf(sousTraitant: SousTraitant): string {
  const entreprise = sousTraitant.entreprise
  if (!entreprise) return ''
  return typeof entreprise === 'string' ? entreprise : entreprise['@id']
}
