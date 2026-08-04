export type PermitStatus =
  | 'brouillon'
  | 'en_attente_validation_chef'
  | 'en_attente_validation_hse'
  | 'valide'
  | 'refuse'
  | 'en_cours'
  | 'cloture'
  | 'expire'

export type UserRole = 'admin' | 'chef' | 'hse' | 'operateur'

export interface Permit {
  id: string
  numero: string
  titre: string
  description: string
  status: PermitStatus
  demandeur_id: string
  validateur_chef_id?: string
  validateur_hse_id?: string
  created_at: string
  updated_at: string
  expired_at?: string
}

export interface User {
  '@id': string
  id: number
  email: string
  name: string
  firstname: string
  prenom?: string
  entrepriseName?: string | null
  numeroRegistreCommerce?: string | null
  siegeSocial?: string | null
  qualiteRepresentant?: string | null
  signaturePath?: string | null
  roles: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UserCreate {
  email: string
  name: string
  firstname: string
  plainPassword: string
  roles: string[]
  isActive: boolean
  entrepriseName?: string | null
  numeroRegistreCommerce?: string | null
  siegeSocial?: string | null
  qualiteRepresentant?: string | null
}

export interface UserUpdate {
  email?: string
  name?: string
  firstname?: string
  plainPassword?: string
  roles?: string[]
  isActive?: boolean
  entrepriseName?: string | null
  numeroRegistreCommerce?: string | null
  siegeSocial?: string | null
  qualiteRepresentant?: string | null
}

export interface HydraCollection<T> {
  '@context': string
  '@id': string
  '@type': 'hydra:Collection'
  member: T[]
  totalItems: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponseUser {
  id: number
  email: string
  name: string
  firstname: string
  roles: string[]
  isActive: boolean
  createdAt: string
}

export interface LoginResponse {
  token: string
  refresh_token?: string
  user?: LoginResponseUser
}

export interface MenuNode {
  id: number
  name: string
  icon?: string
  route?: string | null
  children: MenuNode[]
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface Menu {
  '@id': string
  id: number
  name: string
  icon: string
  route: string | null
  position: number
  parent: string | null
  children: Menu[]
}

export interface MenuCreate {
  name: string
  icon?: string
  route?: string | null
  position?: number
  parent?: string | null
}

export interface MenuUpdate {
  name?: string
  icon?: string
  route?: string | null
  position?: number
  parent?: string | null
}

export interface MenuAccess {
  '@id': string
  id: number
  menu: string
  role: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export interface MenuAccessCreate {
  menu: string
  role: string
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface MenuAccessUpdate {
  menu?: string
  role?: string
  canView?: boolean
  canCreate?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface Role {
  '@id': string
  id: number
  name: string
  label: string
  description?: string | null
  isSystem: boolean
  createdAt: string
}

export interface RoleCreate {
  name: string
  label: string
  description?: string | null
}

export interface RoleUpdate {
  name?: string
  label?: string
  description?: string | null
}

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export type ActivityPlanningStatus = 'brouillon' | 'planifie' | 'en_cours' | 'valide' | 'annule' | 'stand_by'

export interface ActivityPlanningAudit {
  id: number
  fieldName: string
  oldValue: string | null
  newValue: string | null
  changedBy: string
  changedAt: string
}

export interface TachePlanifieeItem {
  id: string
  ordre: number
  tache: string
  materiel?: string | null
  qui?: string | null
}

export interface SectionPlanifieeItem {
  id: string
  libelle: string
  ordre: number
  taches: TachePlanifieeItem[]
  createdAt?: string
}

export interface TaskRow {
  localId: string
  tache: string
  materiel: string
  qui: string
}

export interface SectionRow {
  localId: string
  libelle: string
  libelleMg: string
  taches: TaskRow[]
}

export interface PlanSite {
  codeSite: string
  nomSite: string
}

export interface ActivityPlanning {
  '@id': string
  id: number
  process: string
  provider: string
  providerEmail: string | null
  siteCode: string
  siteName: string
  typeIntervention: string | null
  sites: PlanSite[] | null
  theoreticalStartDate?: string | null
  expectedStartDate: string
  expectedEndDate: string
  actualStartDate?: string | null
  actualEndDate?: string | null
  status: ActivityPlanningStatus
  permitReference: string | null
  permitValidated: boolean
  sections?: SectionPlanifieeItem[]
  auditLogs?: ActivityPlanningAudit[]
  createdAt: string
  updatedAt: string
  createdBy?: { '@id': string; id: number; email: string; name: string; firstname?: string | null } | null
}

export interface SectionPayload {
  libelle: string
  ordre: number
  taches: { ordre: number; tache: string; materiel?: string; qui?: string }[]
}

export interface ActivityPlanningCreate {
  process: string
  provider: string
  providerEmail?: string
  siteCode: string
  siteName: string
  typeIntervention?: string
  sites?: PlanSite[]
  expectedStartDate: string
  expectedEndDate: string
  status?: ActivityPlanningStatus
  permitReference?: string
  permitValidated?: boolean
  sections?: SectionPayload[]
}

export interface ActivityPlanningUpdate {
  process?: string
  provider?: string
  providerEmail?: string
  siteCode?: string
  siteName?: string
  typeIntervention?: string
  sites?: PlanSite[]
  expectedStartDate?: string
  expectedEndDate?: string
  status?: ActivityPlanningStatus
  permitReference?: string
  permitValidated?: boolean
  sections?: SectionPayload[]
}

export interface ValidationInterventionJournaliere {
  id?: string
  date?: any
  observationsJour?: string
  avancementPourcentage?: number
  controles?: ControleJournalierPermis[]
  heureDebut?: string
  heureFin?: string
  nombrePersonnes?: number
  listePersonnel?: string[]
  conditionsMeteo?: string
  temperatureC?: number
  vitesseVentKmh?: number
  verificationsSecurite?: any
  activitesRealisees?: string
  take5Effectue?: boolean
  take5Id?: string
  incidents?: boolean
  incidentsDetails?: string
  photosAvancement?: string[]
  documents?: string[]
  validee?: boolean
  dateValidation?: any
}

export interface ControleJournalierPermis {
  id?: string
  libelle?: string
  conforme?: boolean
  remarque?: string
  permisId?: string
  date?: any
  createdAt?: any
  [key: string]: any
}

export interface Take5Record {
  id?: string
  interventionId?: string
  date?: any
  equipe?: string[]
  heure?: string
  membres?: string[]
  risquesEvalues?: RisqueEvalue[]
  commentaire?: string
  responsableNom?: string
  localisation?: string
  tacheDescription?: string
  transmisHSE?: boolean
  etape1_arreter?: any
  etape2_observer?: any
  etape3_analyser?: any
  etape4_controler?: any
  etape5_proceder?: any
  createdAt?: any
  updatedAt?: any
}

export interface RisqueEvalue {
  id?: string
  description?: string
  categorie?: string
  mesureControle?: string
  danger?: string
  probabilite?: string
  gravite?: string
  niveauRisque?: string
}

export interface MesureControle {
  id?: string
  description?: string
  responsable?: string
  type?: string
  miseEnPlace?: boolean
}

export type InterventionStatus = 'planifiee' | 'en_cours' | 'suspendue' | 'terminee' | 'annulee'

export interface ValidationJournaliere {
  id?: string
  date?: string
  observations?: string
  statut?: string
  codeSite?: string
  vitesseVent?: string
  demandeurSignatureDebut?: string
  utilisateurSignatureDebut?: string
  demandeurSignatureFin?: string
  utilisateurSignatureFin?: string
}
