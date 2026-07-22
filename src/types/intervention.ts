export type StatutIntervention =
  | 'EN_PREPARATION'
  | 'EVALUATION_COMPLETE'
  | 'EN_COURS'
  | 'TERMINEE'

export interface EvaluationRisque {
  id: string
  description: string
  gravite: number
  probabilite: number
  niveauRisque: number
  mesuresConfirmees: string | null
  estReevalue: boolean
  createdBy: { id: number; email: string; name: string; firstname?: string }
}

export interface Intervention {
  '@id'?: string
  id: string
  permitTravail: string
  permitTravailId: string
  statut: StatutIntervention
  createdBy: { id: number; email: string; name: string; firstname?: string }
  createdAt: string
  evaluations: EvaluationRisque[]
}

export interface EvaluationRisqueInput {
  gravite?: number
  probabilite?: number
  mesuresConfirmees?: string | null
}
