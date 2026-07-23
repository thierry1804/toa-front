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

// HSE/Chef de Projet dashboard types

export interface InterventionSuiviFilters {
  codeSite?: string
  dateDebut?: string
  dateFin?: string
  statut?: StatutIntervention | ''
}

export interface InterventionDashboardItem {
  id: string
  permitReference: string | null
  codeSite: string | null
  statut: StatutIntervention
  avancementMoyen: number
  dernierSuivi: string | null
  nbSuivis: number
}

export interface InterventionDashboard {
  totalInterventions: number
  parStatut: Record<StatutIntervention, number>
  avancementMoyen: number
  interventions: InterventionDashboardItem[]
}

export interface InterventionDetailHseDocument {
  id: string
  nom: string
  mimeType: string
}

export interface InterventionDetailHseSuivi {
  id: string
  date: string
  nomResponsable: string
  realise: boolean
  motifNonRealisation: string | null
  avancementPourcentage: number
  commentaire: string | null
  createdAt: string
  documents: InterventionDetailHseDocument[]
}

export interface InterventionDetailHseEval {
  id: string
  description: string
  gravite: number
  probabilite: number
  niveauRisque: number
  niveauCouleur: string
  mesuresConfirmees: string | null
  estReevalue: boolean
}

export interface InterventionDetailHse {
  intervention: {
    id: string
    statut: StatutIntervention
    createdAt: string
  }
  permitTravail: {
    id: string
    reference: string
    type: string
    codeSite: string
  } | null
  planPrevention: {
    id: string
    reference: string
  } | null
  suiviJournaliers: InterventionDetailHseSuivi[]
  evaluationRisques: {
    count: number
    niveauMoyen: number
    items: InterventionDetailHseEval[]
  }
  avancementMoyen: number
}

export interface InterventionStatsJournalieres {
  date: string
  codeSite: string
  nbInterventionsActives: number
  avancementMoyen: number
  nbSuivisJour: number
  interventions: InterventionDashboardItem[]
}
