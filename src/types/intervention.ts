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

export interface PermitTravailSummary {
  '@id'?: string
  id: string
  reference: string
  codeSite: string
  descriptionTravaux: string | null
  dateDebutPrevue: string | null
  dateFinPrevue: string | null
  createdBy: {
    id: number
    email: string
    name: string
    firstname?: string
    entrepriseName?: string | null
  }
}

export interface Intervention {
  '@id'?: string
  id: string
  permitTravail: PermitTravailSummary | string
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

export interface SuiviJournalierDocument {
  id: string
  filePath: string
  mimeType: string
  nom: string
  uploadedAt: string
}

export interface SuiviJournalier {
  '@id'?: string
  id: string
  date: string
  nomResponsable: string
  realise: boolean
  motifNonRealisation: string | null
  avancementPourcentage: number
  commentaire: string | null
  createdBy: { id: number; name: string; firstname?: string }
  createdAt: string
  documents: SuiviJournalierDocument[]
}

export interface SuiviJournalierInput {
  intervention: string
  date: string
  nomResponsable: string
  realise: boolean
  motifNonRealisation?: string | null
  avancementPourcentage: number
  commentaire?: string | null
}

export interface SuiviJournalierUpdateInput {
  nomResponsable?: string
  realise?: boolean
  motifNonRealisation?: string | null
  avancementPourcentage?: number
  commentaire?: string | null
}
