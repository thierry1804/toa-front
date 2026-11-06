import api from '@/lib/axios'
import { hydraMember } from '@/offline/asHydra'

export interface DocumentPermisRegle {
  id: string
  code: string
  libelle: string
  moment: 'SOUMISSION' | 'CLOTURE' | 'DANGERS'
  processus: 'NOUVEAU_SITE' | 'AUTRES' | 'TOUS'
  typePermis: 'GENERAL' | 'HAUTEUR' | 'ELECTRIQUE' | 'TOUS'
  demande: 'PREMIERE' | 'RENOUVELLEMENT' | 'TOUTES'
  apnApiUniquement: boolean
  obligatoire: boolean
  ordre: number
  actif: boolean
}

export type DocumentPermisInput = Omit<DocumentPermisRegle, 'id'>

export const documentPermisApi = {
  list: () =>
    api
      .get('/api/referentiel/documents-permis?itemsPerPage=200')
      .then((r) => hydraMember<DocumentPermisRegle>(r.data)),

  create: (input: DocumentPermisInput) =>
    api.post<DocumentPermisRegle>('/api/referentiel/documents-permis', input).then((r) => r.data),

  update: (id: string, input: Partial<DocumentPermisInput>) =>
    api.patch<DocumentPermisRegle>(`/api/referentiel/documents-permis/${id}`, input, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  remove: (id: string) => api.delete(`/api/referentiel/documents-permis/${id}`).then(() => undefined),
}
