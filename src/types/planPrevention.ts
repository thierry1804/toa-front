export type StatutPlanPrevention = 'BROUILLON' | 'SOUMIS' | 'VALIDE' | 'REJETE'

export type TypeDocumentPrevention =
  | 'PLAN_URGENCE'
  | 'FDS'
  | 'LISTE_INTERVENANTS'
  | 'ATTESTATION_HSE'
  | 'FICHE_CONFORMITE'

export const TYPES_DOCUMENT_LABELS: Record<TypeDocumentPrevention, string> = {
  PLAN_URGENCE: "Plan d'urgence",
  FDS: 'Fiche de données de sécurité',
  LISTE_INTERVENANTS: 'Liste des intervenants',
  ATTESTATION_HSE: 'Attestation HSE',
  FICHE_CONFORMITE: 'Fiche de conformité',
}

export const ALL_DOCUMENT_TYPES: TypeDocumentPrevention[] = [
  'PLAN_URGENCE',
  'FDS',
  'LISTE_INTERVENANTS',
  'ATTESTATION_HSE',
  'FICHE_CONFORMITE',
]

export interface PlanPreventionInput {
  codeSite: string
  localite: string
  activitePlanifiee: string
  dateDebut: string
  dateFin: string
}

export interface RisquePreventionInput {
  description: string
  gravite: number
  probabilite: number
  mesuresPreventives: string
}

export interface RisquePrevention {
  id: string
  description: string
  gravite: number
  probabilite: number
  niveauRisque: number
  mesuresPreventives: string
}

export interface DocumentPrevention {
  id: string
  type: TypeDocumentPrevention
  filePath: string
  mimeType: string
  uploadedAt: string
}

export interface SitePrevention {
  id: string
  nom: string
  latitude: number
  longitude: number
  sourceKmz: boolean
}

export interface PlanPrevention {
  '@id'?: string
  id: string
  reference: string
  codeSite: string
  localite: string
  activitePlanifiee: string
  dateDebut: string
  dateFin: string
  statut: StatutPlanPrevention
  createdBy: { id: number; email: string; name: string }
  createdAt: string
  risques: RisquePrevention[]
  documents: DocumentPrevention[]
  sites: SitePrevention[]
}

export interface RisqueRow {
  localId: string
  description: string
  gravite: number
  probabilite: number
  mesuresPreventives: string
}
