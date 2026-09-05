export type ProcessusPermit = 'NOUVEAU_SITE' | 'MAINTENANCE' | 'RENOUVELLEMENT'
export type TypePermit = 'GENERAL' | 'ELECTRIQUE' | 'HAUTEUR'
export type StatutPermitTravail = 'BROUILLON' | 'SOUMIS' | 'EN_COURS' | 'VALIDE' | 'REJETE' | 'VALIDE_HSE' | 'REFUSE_HSE' | 'CLOTURE' | 'PV_VALIDE' | 'PV_REFUSE'
export type TypeCloturePerm = 'MANUELLE' | 'AUTOMATIQUE'
export type DecisionCdpPv = 'VALIDE' | 'REFUSE'
export type StatutPvReceptionPdf = 'EN_COURS' | 'GENERE' | 'ERREUR'

export type ActionPermitTravailLog = 'CONSULTE' | 'DOCUMENT_TELECHARGE' | 'STATUT_CHANGE' | 'PDF_GENERE'

/** Une entrée du formulaire des dangers (champs répéteurs) d'un permis. */
export interface DangerEntry {
  dangers: string
  evaluationPreliminaire: 'rouge' | 'jaune' | 'vert' | ''
  moyensMaitrise: string
  evaluationFinale: 'rouge' | 'jaune' | 'vert' | ''
}

export interface PermitTravailLog {
  id: string
  action: ActionPermitTravailLog
  declenchePar: { id: number; email: string; name: string; firstname?: string } | null
  codeSite: string
  typePermis: TypePermit
  metadata: Record<string, string> | null
  createdAt: string
}

export interface PermitTravailSuiviData {
  totalPermis: number
  parStatut: Partial<Record<StatutPermitTravail, number>>
  parType: Partial<Record<TypePermit, number>>
  parSite: Record<string, number>
  expirantSous7j: PermitTravail[]
  logsRecents: PermitTravailLog[]
}

export interface PermitTravailStatsJournalieresData {
  nbConsultations: number
  nbChangementsStatut: number
  nbTelechargements: number
  permisActifs: number
}

export interface PermitTravailSuiviFilters {
  codeSite?: string
  typePermis?: TypePermit | ''
  statut?: StatutPermitTravail | ''
  dateDebut?: string
  dateFin?: string
}

export type TypeDocumentPermitTravail =
  | 'TROUSSE_SECOURS'
  | 'PV_SENSIBILISATION_HSE'
  | 'PHOTO_EPI_BASE'
  | 'PV_KICKOFF_AUTORITES'
  | 'PV_ENVIRONNEMENT'
  | 'PHOTO_AVANCEMENT_CHANTIER'
  | 'PLAN_SAUVETAGE_HAUTEUR'
  | 'KIT_SAUVETAGE_HAUTEUR'
  | 'HARNAIS_SECURITE'
  | 'PIECE_IDENTITE_HABILITE'
  | 'MESURE_VITESSE_VENT'
  | 'PHOTO_EPI_SPECIFIQUE'
  | 'PHOTO_EQUIPEMENTS_ISOLANTS'
  | 'PV_CLOTURE_ENVIRONNEMENT'
  | 'PV_FIN_TRAVAUX'
  | 'PHOTO_PROPRETE_SITE'

export const DOCUMENT_TYPE_LABELS: Record<TypeDocumentPermitTravail, string> = {
  TROUSSE_SECOURS:            "Trousse de secours",
  PV_SENSIBILISATION_HSE:     "PV de sensibilisation HSE",
  PHOTO_EPI_BASE:              "Photo des intervenants en EPI de base",
  PV_KICKOFF_AUTORITES:        "PV kick-off signé par les autorités locales",
  PV_ENVIRONNEMENT:            "PV Environnement",
  PHOTO_AVANCEMENT_CHANTIER:   "Photo d'avancement du chantier",
  PLAN_SAUVETAGE_HAUTEUR:      "Plan de sauvetage en hauteur",
  KIT_SAUVETAGE_HAUTEUR:       "Kit de sauvetage en hauteur",
  HARNAIS_SECURITE:            "Harnais de sécurité complet",
  PIECE_IDENTITE_HABILITE:     "Pièce d'identité de la personne habilitée",
  MESURE_VITESSE_VENT:         "Mesure de la vitesse du vent",
  PHOTO_EPI_SPECIFIQUE:        "Photo des intervenants en EPI spécifique",
  PHOTO_EQUIPEMENTS_ISOLANTS:  "Photo des équipements isolants",
  PV_CLOTURE_ENVIRONNEMENT:    "PV clôture Environnement",
  PV_FIN_TRAVAUX:              "PV fin travaux",
  PHOTO_PROPRETE_SITE:         "Photo propreté du site et/ou remise en état",
}

/**
 * Matrice des documents obligatoires par permis, croisant le processus du
 * plan de prévention (Nouveau site vs les 4 autres processus regroupés) et
 * le fait qu'il s'agisse d'une première demande ou d'un renouvellement.
 * Doit rester synchronisée avec PermitDocumentRequirementResolver côté API.
 */
const DOCUMENT_MATRIX: Record<'NOUVEAU_SITE' | 'AUTRES', Record<TypePermit, [TypeDocumentPermitTravail[], TypeDocumentPermitTravail[]]>> = {
  NOUVEAU_SITE: {
    GENERAL: [
      ['TROUSSE_SECOURS', 'PV_SENSIBILISATION_HSE', 'PHOTO_EPI_BASE', 'PV_KICKOFF_AUTORITES', 'PV_ENVIRONNEMENT'],
      ['PHOTO_AVANCEMENT_CHANTIER', 'PHOTO_EPI_BASE'],
    ],
    HAUTEUR: [
      ['PLAN_SAUVETAGE_HAUTEUR', 'KIT_SAUVETAGE_HAUTEUR', 'HARNAIS_SECURITE', 'PIECE_IDENTITE_HABILITE', 'TROUSSE_SECOURS', 'MESURE_VITESSE_VENT'],
      ['PHOTO_AVANCEMENT_CHANTIER', 'PHOTO_EPI_SPECIFIQUE'],
    ],
    ELECTRIQUE: [[], []],
  },
  AUTRES: {
    GENERAL: [
      ['TROUSSE_SECOURS', 'PHOTO_EPI_BASE', 'PV_SENSIBILISATION_HSE'],
      ['PHOTO_AVANCEMENT_CHANTIER', 'PHOTO_EPI_BASE'],
    ],
    HAUTEUR: [
      ['PLAN_SAUVETAGE_HAUTEUR', 'KIT_SAUVETAGE_HAUTEUR', 'HARNAIS_SECURITE', 'PIECE_IDENTITE_HABILITE', 'TROUSSE_SECOURS', 'MESURE_VITESSE_VENT'],
      [],
    ],
    ELECTRIQUE: [
      ['PIECE_IDENTITE_HABILITE', 'PHOTO_EQUIPEMENTS_ISOLANTS', 'TROUSSE_SECOURS'],
      ['PHOTO_AVANCEMENT_CHANTIER', 'PHOTO_EPI_SPECIFIQUE'],
    ],
  },
}

export function getRequiredDocumentTypes(
  planTypeIntervention: string | null | undefined,
  typePermis: TypePermit,
  processus: ProcessusPermit,
): TypeDocumentPermitTravail[] {
  const bucket = planTypeIntervention === 'Nouveau site' ? 'NOUVEAU_SITE' : 'AUTRES'
  const index = processus === 'RENOUVELLEMENT' ? 1 : 0
  return DOCUMENT_MATRIX[bucket][typePermis][index]
}

/**
 * Documents de clôture, exigés à la clôture manuelle d'un permis — cf.
 * tableau de la recette interne, étape "Fin" / "Validation Fin". Doit
 * rester synchronisée avec PermitDocumentRequirementResolver côté API.
 */
const CLOTURE_DOCUMENT_MATRIX: Record<'NOUVEAU_SITE' | 'AUTRES', TypeDocumentPermitTravail[]> = {
  NOUVEAU_SITE: ['PV_CLOTURE_ENVIRONNEMENT', 'PV_FIN_TRAVAUX'],
  AUTRES: ['PHOTO_PROPRETE_SITE', 'PV_FIN_TRAVAUX'],
}

export function getRequiredClotureDocumentTypes(
  planTypeIntervention: string | null | undefined,
): TypeDocumentPermitTravail[] {
  const bucket = planTypeIntervention === 'Nouveau site' ? 'NOUVEAU_SITE' : 'AUTRES'
  return CLOTURE_DOCUMENT_MATRIX[bucket]
}

export const PROCESSUS_LABELS: Record<ProcessusPermit, string> = {
  NOUVEAU_SITE:  "Nouveau site",
  MAINTENANCE:   "Maintenance",
  RENOUVELLEMENT: "Renouvellement",
}

export const TYPE_PERMIT_LABELS: Record<TypePermit, string> = {
  GENERAL:   "Général",
  ELECTRIQUE: "Électrique",
  HAUTEUR:   "Hauteur",
}

export interface DocumentPermitTravail {
  id: string
  type: TypeDocumentPermitTravail
  filePath: string
  mimeType: string
  uploadedAt: string
}

export function getMissingDocumentTypes(
  requiredTypes: readonly TypeDocumentPermitTravail[],
  uploadedDocuments: ReadonlyArray<Pick<DocumentPermitTravail, 'type'>>,
): TypeDocumentPermitTravail[] {
  const uploadedTypes = new Set(uploadedDocuments.map((document) => document.type))
  return requiredTypes.filter((type) => !uploadedTypes.has(type))
}

export interface DecisionHsePermitTravail {
  id: string
  decision: 'VALIDE' | 'REFUSE'
  commentaire?: string | null
  signatureElectronique: string
  decidedAt: string
  decidePar: { id: number; email: string; name: string; firstname?: string }
}

export interface VersionPermitTravail {
  id: string
  numeroVersion: number
  snapshotData?: Record<string, unknown>
  createdBy: { id: number; email: string; name: string; firstname?: string }
  createdAt: string
  motifResoumission: string | null
}

export interface PermitTravailInput {
  processus: ProcessusPermit
  typePermis: TypePermit
  planPreventionId?: string
  codeSite: string
  descriptionTravaux?: string
  dateDebutPrevue: string
  dateFinPrevue: string
  engagementAccepte?: boolean
  dangers?: DangerEntry[] | null
}

export type StatutPermitTravailPdf = 'EN_COURS' | 'GENERE' | 'ERREUR'

export interface PermitTravailPdfStatus {
  statut: StatutPermitTravailPdf | null
  jobId: string | null
  genereAt?: string | null
  tailleFichier?: number | null
}

export interface GeneratePermitTravailPdfResult {
  jobId: string
  statut: StatutPermitTravailPdf
}

export interface CloturePermData {
  id: string
  typeCloture: TypeCloturePerm
  dateClotureEffective: string
  commentaire?: string | null
  accordClient: boolean
  accordClientAt?: string | null
  clotureBy?: { id: number; name: string; firstname?: string } | null
  createdAt: string
}

export interface PvReceptionStatus {
  statut: StatutPvReceptionPdf | null
  genereAt?: string | null
  tailleFichier?: number | null
}

export interface CloturerPermitResult {
  jobId: string
  statut: string
  message: string
}

export interface DecisionCdpPvReception {
  id: string
  decision: DecisionCdpPv
  decidePar: { id: number; name: string; firstname?: string } | null
  commentaire?: string | null
  signatureElectronique: string
  decidedAt: string
}

export interface KpiIntervention {
  nbPermisCloturesValides: number
  nbPermisCloturesTotal: number
  tauxCloture: number
  delaiMoyenValidationCdp: number
}

export interface PermitTravail {
  '@id'?: string
  id: string
  reference: string
  processus: ProcessusPermit
  typePermis: TypePermit
  planPreventionId?: string | null
  planProcess?: string | null
  interventionId?: string | null
  codeSite: string
  descriptionTravaux: string
  dateDebutPrevue: string
  dateFinPrevue: string
  statut: StatutPermitTravail
  engagementAccepte: boolean
  dangers?: DangerEntry[] | null
  createdBy: { id: number; email: string; name: string; firstname?: string }
  nomPrestataire?: string | null
  soumisAt?: string | null
  createdAt: string
  documents: DocumentPermitTravail[]
  decisionsHse?: DecisionHsePermitTravail[]
  groupeId?: string | null
  permitsGroupe?: {
    id: string
    reference: string
    typePermis: TypePermit
    statut: StatutPermitTravail
    documents: DocumentPermitTravail[]
  }[]
}
