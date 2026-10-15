import type { DangerEntry } from '@/types/permitTravail'

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
  suivisJournaliers?: SuiviJournalier[]
  suiviTerrainVersion?: number
}

export interface PhaseAvancement {
  phaseId: string
  libelle: string
  avancementPourcentage: number
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
  capturedAt?: string | null
  phaseId?: string | null
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
  pendingSync?: boolean
  phasesAvancement?: PhaseAvancement[] | null
  dangersMaitrises?: boolean | null
  detailsDangers?: string | null
  /** R-29 : questionnaire des risques, même format que celui du permis. */
  evaluationRisques?: DangerEntry[] | null
}

export interface SuiviJournalierInput {
  intervention: string
  date: string
  nomResponsable: string
  realise: boolean
  motifNonRealisation?: string | null
  avancementPourcentage: number
  commentaire?: string | null
  phasesAvancement?: PhaseAvancement[]
  dangersMaitrises?: boolean | null
  detailsDangers?: string | null
  evaluationRisques?: DangerEntry[] | null
}

export interface SuiviJournalierUpdateInput {
  nomResponsable?: string
  realise?: boolean
  motifNonRealisation?: string | null
  avancementPourcentage?: number
  commentaire?: string | null
  phasesAvancement?: PhaseAvancement[]
  dangersMaitrises?: boolean | null
  detailsDangers?: string | null
  evaluationRisques?: DangerEntry[] | null
}

export interface ControleJournalier {
  '@id'?: string
  id: string
  date: string
  intervenants: string[]
  confirmationMesures: boolean
  vitesseVent: number | null
  signatureDemandeur: string
  signatureIntervenant: string
  signatureClotureDemandeur: string | null
  signatureClotureIntervenant: string | null
  createdBy: { id: number; name: string; firstname?: string }
  createdAt: string
}

export interface ControleJournalierInput {
  intervention: string
  date: string
  intervenants: string[]
  confirmationMesures: boolean
  vitesseVent?: number | null
  signatureDemandeur: string
  signatureIntervenant: string
}

export interface ControleJournalierUpdateInput {
  signatureClotureDemandeur?: string
  signatureClotureIntervenant?: string
}

export interface Take5Etape1Arreter {
  complete: boolean
  observations: string
}

export interface Take5Etape2Observer {
  complete: boolean
  dangersIdentifies: string[]
  autresDangers: string
}

export interface Take5Risque {
  danger: string
  probabilite: number
  gravite: number
  niveauRisque: number
}

export interface Take5Etape3Analyser {
  complete: boolean
  risquesEvalues: Take5Risque[]
}

export type Take5MesureType =
  | 'elimination'
  | 'substitution'
  | 'controle_ingenierie'
  | 'controle_administratif'
  | 'epi'

export interface Take5Mesure {
  type: Take5MesureType
  description: string
  responsable: string
  miseEnPlace: boolean
}

export interface Take5Etape4Controler {
  complete: boolean
  mesuresControle: Take5Mesure[]
}

export interface Take5Etape5Proceder {
  complete: boolean
  securiteConfirmee: boolean
  autorisationProceder: boolean
}

export interface Take5Record {
  '@id'?: string
  id: string
  responsableNom: string
  equipe: string[]
  localisation: string
  tacheDescription: string
  etape1Arreter: Take5Etape1Arreter
  etape2Observer: Take5Etape2Observer
  etape3Analyser: Take5Etape3Analyser
  etape4Controler: Take5Etape4Controler
  etape5Proceder: Take5Etape5Proceder
  createdBy: { id: number; name: string; firstname?: string }
  createdAt: string
}

export interface Take5RecordInput {
  intervention: string
  responsableNom: string
  equipe: string[]
  localisation: string
  tacheDescription: string
  etape1Arreter: Take5Etape1Arreter
  etape2Observer: Take5Etape2Observer
  etape3Analyser: Take5Etape3Analyser
  etape4Controler: Take5Etape4Controler
  etape5Proceder: Take5Etape5Proceder
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
