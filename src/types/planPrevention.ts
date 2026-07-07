export type StatutPlanPrevention =
  | 'BROUILLON'
  | 'SOUMIS'
  | 'VALIDE'
  | 'REJETE'
  | 'EN_ATTENTE'
  | 'ENVOYE'
  | 'EN_COURS_DE_VALIDATION'
  | 'EXAMINE'
  | 'VALIDE_HSE'
  | 'REFUSE_HSE'

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
  altitude?: number | null
  description?: string | null
  couleurMarqueur?: string | null
  ordreAffichage?: number
}

export interface KmzImportResult {
  sitesImportes: number
  sitesIgnores: number
  sites: SitePrevention[]
}

export interface ExamenPlanPrevention {
  id: string
  examinePar: { id: number; email: string; name: string; firstname?: string }
  examineAt: string
  commentaire: string | null
}

export type DecisionHse = 'VALIDE' | 'REFUSE'

export interface DecisionHsePlanPrevention {
  id: string
  decidePar: { id: number; email: string; name: string; firstname?: string }
  decision: DecisionHse
  commentaire: string | null
  signatureElectronique: string
  decidedAt: string
}

export interface VersionPlanPrevention {
  id: string
  numeroVersion: number
  snapshotData: Record<string, unknown>
  createdBy: { id: number; email: string; name: string; firstname?: string }
  createdAt: string
  motifResoumission: string | null
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
  chefProjet?: { id: number; email: string; name: string; firstname?: string } | null
  examens?: ExamenPlanPrevention[]
  decisionsHse?: DecisionHsePlanPrevention[]
  versions?: VersionPlanPrevention[]
}

export interface RisqueRow {
  localId: string
  description: string
  gravite: number
  probabilite: number
  mesuresPreventives: string
}
