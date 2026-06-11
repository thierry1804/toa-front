export type PermitStatus =
  | 'draft'
  | 'awaiting_chef_validation'
  | 'awaiting_hse_validation'
  | 'validated'
  | 'in_progress'
  | 'closed'
  | 'rejected'
  | 'expired'

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
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface UserCreate {
  email: string
  name: string
  firstname: string
  plainPassword: string
  roles: string[]
}

export interface UserUpdate {
  email?: string
  name?: string
  firstname?: string
  plainPassword?: string
  roles?: string[]
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

export interface LoginResponse {
  token: string
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

export type ActivityPlanningStatus = 'brouillon' | 'planifie' | 'en_cours' | 'valide' | 'annule'

export interface ActivityPlanningAudit {
  id: number
  fieldName: string
  oldValue: string | null
  newValue: string | null
  changedBy: string
  changedAt: string
}

export interface ActivityPlanning {
  '@id': string
  id: number
  process: string
  provider: string
  providerEmail: string | null
  projectDescription: string
  siteCode: string
  siteNumber: string
  siteName: string
  region: string
  theoreticalStartDate: string
  expectedStartDate: string
  expectedEndDate: string
  status: ActivityPlanningStatus
  permitReference: string | null
  permitValidated: boolean
  auditLogs?: ActivityPlanningAudit[]
  createdAt: string
  updatedAt: string
}

export interface ActivityPlanningCreate {
  process: string
  provider: string
  providerEmail?: string
  projectDescription: string
  siteCode: string
  siteNumber: string
  siteName: string
  region: string
  theoreticalStartDate: string
  expectedStartDate: string
  expectedEndDate: string
  status?: ActivityPlanningStatus
  permitReference?: string
  permitValidated?: boolean
}

export interface ActivityPlanningUpdate {
  process?: string
  provider?: string
  providerEmail?: string
  projectDescription?: string
  siteCode?: string
  siteNumber?: string
  siteName?: string
  region?: string
  theoreticalStartDate?: string
  expectedStartDate?: string
  expectedEndDate?: string
  status?: ActivityPlanningStatus
  permitReference?: string
  permitValidated?: boolean
}
