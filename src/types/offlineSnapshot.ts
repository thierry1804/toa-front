export const SNAPSHOT_ENTITY_MODULES = [
  'plansPrevention',
  'permitsTravail',
  'interventions',
  'activityPlannings',
  'sites',
  'users',
  'entreprises',
] as const

export type OfflineSnapshotEntityModule = (typeof SNAPSHOT_ENTITY_MODULES)[number]

export type OfflineSnapshotModule = OfflineSnapshotEntityModule | 'referentiel'

export const SNAPSHOT_PATH_MODULES = [
  'plans-prevention',
  'permits-travail',
  'interventions',
  'activity-plannings',
  'sites',
  'users',
  'entreprises',
  'referentiel',
] as const

export type OfflineSnapshotPathModule = (typeof SNAPSHOT_PATH_MODULES)[number]

export const ENTITY_MODULE_TO_PATH: Record<OfflineSnapshotModule, OfflineSnapshotPathModule> = {
  plansPrevention: 'plans-prevention',
  permitsTravail: 'permits-travail',
  interventions: 'interventions',
  activityPlannings: 'activity-plannings',
  sites: 'sites',
  users: 'users',
  entreprises: 'entreprises',
  referentiel: 'referentiel',
}

export const PATH_TO_ENTITY_MODULE: Record<OfflineSnapshotPathModule, OfflineSnapshotModule> = {
  'plans-prevention': 'plansPrevention',
  'permits-travail': 'permitsTravail',
  interventions: 'interventions',
  'activity-plannings': 'activityPlannings',
  sites: 'sites',
  users: 'users',
  entreprises: 'entreprises',
  referentiel: 'referentiel',
}

export interface OfflineSnapshotModuleStats {
  count: number
  estimatedBytes: number
}

export interface OfflineSnapshotManifest {
  generatedAt: string
  userId: number | string
  modules: Partial<Record<OfflineSnapshotModule, OfflineSnapshotModuleStats>>
  documents?: OfflineSnapshotModuleStats
}

export interface OfflineSnapshotReferentiel {
  categoriesRisque?: unknown[]
  installationsEquipements?: unknown[]
  sitesGeoJson?: unknown
}

export interface OfflineSnapshotTombstones {
  plansPrevention?: string[]
  permitsTravail?: string[]
  interventions?: string[]
  activityPlannings?: Array<string | number>
  sites?: string[]
  users?: Array<string | number>
  entreprises?: string[]
  categoriesRisque?: string[]
  installationsEquipements?: string[]
}

export interface OfflineSnapshot {
  generatedAt: string
  userId: number | string
  since?: string | null
  plansPrevention?: unknown[]
  permitsTravail?: unknown[]
  interventions?: unknown[]
  activityPlannings?: unknown[]
  sites?: unknown[]
  users?: unknown[]
  entreprises?: unknown[]
  referentiel?: OfflineSnapshotReferentiel
  tombstones?: OfflineSnapshotTombstones
}

/** Pièces requises d'un permis (GET /permits-travail/{id}/documents-requis), précalculées pour le hors-ligne. */
export interface OfflineSnapshotPermitDocumentsRequis {
  id: string
  soumission: string[]
  cloture: string[]
  apnApi: boolean
}

export interface OfflineSnapshotGeneratedPdf {
  downloadPath: string
  nom: string
}

/** Données calculées côté serveur, hors entités du snapshot (GET /offline/snapshot/extras). */
export interface OfflineSnapshotExtras {
  generatedAt: string
  permitsDocumentsRequis: OfflineSnapshotPermitDocumentsRequis[]
  planificationsDisponibles: unknown[]
  generatedPdfs: OfflineSnapshotGeneratedPdf[]
}

export interface OfflineSnapshotMeta {
  userId: string
  generatedAt: string
  lastPulledAt: number
  modules: OfflineSnapshotModule[]
}

export type SnapshotPullErrorCode =
  | 'forbidden'
  | 'rateLimited'
  | 'tooLarge'
  | 'network'
  | 'unknown'
