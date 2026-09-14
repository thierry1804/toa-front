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
  | 'LISTE_VEHICULES'

export const TYPES_DOCUMENT_LABELS: Record<TypeDocumentPrevention, string> = {
  PLAN_URGENCE: "Plan d'urgence",
  FDS: 'Fiche de données de sécurité',
  LISTE_INTERVENANTS: 'Liste des intervenants',
  ATTESTATION_HSE: 'Attestation HSE',
  FICHE_CONFORMITE: 'Fiche de conformité',
  LISTE_VEHICULES: 'Liste des véhicules et des chauffeurs',
}

export const ALL_DOCUMENT_TYPES: TypeDocumentPrevention[] = [
  'PLAN_URGENCE',
  'FDS',
  'LISTE_INTERVENANTS',
  'ATTESTATION_HSE',
  'FICHE_CONFORMITE',
  'LISTE_VEHICULES',
]

export interface InstallationRow {
  description: string
  conditionsUtilisation: string
}

export interface VehiculeRow {
  vehicule: string
  chauffeur: string
}

export interface EquipementRow {
  description: string
  conditionsUtilisation: string
  dateVerification?: string | null
  verifiePar?: string | null
}


export interface PlanPreventionInput {
  codeSite: string
  localite: string
  activitePlanifiee: string
  dateDebut: string
  dateFin: string
  chefProjet?: string | null
  installations?: InstallationRow[]
  equipements?: EquipementRow[]
  planificationId?: number | null
  /** Phases + modes opératoires (même shape que l'ancienne planif) */
  sections?: {
    libelle: string
    ordre: number
    taches: { ordre: number; tache: string; materiel?: string; qui?: string }[]
  }[]
}

export interface RisquePreventionInput {
  tachePlanifieeId?: string | null
  description: string
  gravite: number
  probabilite: number
  mesuresPreventives: string
  risqueResiduel?: number | null
  categoriesRisque?: string[]
}

export interface RisquePrevention {
  id: string
  tachePlanifieeId?: string | null
  description: string
  gravite: number
  probabilite: number
  niveauRisque: number
  mesuresPreventives: string
  risqueResiduel?: number | null
  categoriesRisque?: string[]
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
  fokontany?: string | null
  commune?: string | null
  district?: string | null
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
  referenceActivite?: string | null
  planificationId?: number | null
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
  installations?: InstallationRow[]
  equipements?: EquipementRow[]
  typeIntervention?: string | null
  process?: string | null
  planificationSites?: { codeSite: string; nomSite: string }[]
  planificationSections?: import('@/types').SectionPlanifieeItem[]
}

export interface VehiculeRow {
  vehicule: string
  chauffeur: string
}

export interface RisqueRow {
  localId: string
  tachePlanifieeId?: string | null
  description: string
  categorieIds?: string[]
  gravite: number
  probabilite: number
  mesuresPreventives: string
  risqueResiduel?: number | null
}

export interface PlanBySiteResult {
  id: string
  reference: string
  activitePlanifiee: string
  dateDebut: string
  dateFin: string
  typeIntervention: string | null
  process?: string | null
  permitGeneralId?: string | null
  planificationSites: { codeSite: string; nomSite: string }[]
  planificationSections: import('@/types').SectionPlanifieeItem[]
  risques: RisquePrevention[]
  codeSite: string
  localite: string
  installations: InstallationRow[]
  equipements: EquipementRow[]
}

export interface PlansBySiteResponse {
  plans: PlanBySiteResult[]
}

export type StatutPlanPreventionPdf = 'EN_COURS' | 'GENERE' | 'ERREUR'

export interface PlanPreventionPdfStatus {
  statut: StatutPlanPreventionPdf
  jobId: string | null
  genereAt: string | null
  tailleFichier: number | null
}

export interface GeneratePdfResult {
  jobId: string
  statut: StatutPlanPreventionPdf
}
