import type { HydraCollection } from '@/types'
import type { FeatureCollection, Point } from 'geojson'
import type { Site, SiteGeoJsonFeature } from '@/types/referentiel'
import { asHydra, paginateLocal } from './asHydra'
import {
  getAllFromSnapshot,
  getByIdFromSnapshot,
  hasSnapshot,
  type SnapshotStoreName,
} from './snapshotStore'

type ListParams = Record<string, string | number | boolean | string[] | undefined> | undefined

export function resourceId(value: unknown): string | undefined {
  if (value == null || value === '') return undefined
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') {
    const trimmed = value.replace(/\/$/, '')
    const slash = trimmed.lastIndexOf('/')
    return slash >= 0 ? trimmed.slice(slash + 1) : trimmed
  }
  if (typeof value === 'object' && 'id' in value) {
    return resourceId((value as { id: unknown }).id)
  }
  return undefined
}

function statutOf(item: unknown): string | undefined {
  if (!item || typeof item !== 'object') return undefined
  const record = item as Record<string, unknown>
  if (typeof record.statut === 'string') return record.statut
  if (typeof record.status === 'string') return record.status
  return undefined
}

function matchesStatut(item: unknown, statut: string | string[] | undefined): boolean {
  if (!statut || (Array.isArray(statut) && statut.length === 0)) return true
  const value = statutOf(item)
  if (!value) return true
  const allowed = Array.isArray(statut) ? statut : [statut]
  return allowed.includes(value)
}

function matchesGroupeId(item: unknown, groupeId: unknown): boolean {
  if (groupeId == null || groupeId === '') return true
  const wanted = resourceId(groupeId)
  if (!wanted) return true
  if (!item || typeof item !== 'object') return false
  const record = item as Record<string, unknown>
  const actual = resourceId(record.groupeId ?? record.groupe)
  return actual === wanted
}

function pageArgs(params: ListParams): { page: number; itemsPerPage: number } {
  const page = Number(params?.page ?? 1) || 1
  const itemsPerPage = Number(params?.itemsPerPage ?? params?.limit ?? 0) || 0
  return { page, itemsPerPage }
}

function createdAtOf(item: unknown): string {
  if (!item || typeof item !== 'object' || !('createdAt' in item)) return ''
  const value = (item as { createdAt?: unknown }).createdAt
  return typeof value === 'string' ? value : ''
}

function sortByCreatedAtDesc<T>(items: T[]): T[] {
  return [...items].sort((a, b) => createdAtOf(b).localeCompare(createdAtOf(a)))
}

function permitSummary(permit: Record<string, unknown>): Record<string, unknown> {
  return {
    '@id': permit['@id'],
    id: permit.id,
    reference: permit.reference,
    codeSite: permit.codeSite,
    descriptionTravaux: permit.descriptionTravaux ?? null,
    dateDebutPrevue: permit.dateDebutPrevue ?? null,
    dateFinPrevue: permit.dateFinPrevue ?? null,
    createdBy: permit.createdBy,
  }
}

function evaluationsOf(item: Record<string, unknown>): unknown[] | undefined {
  if (Array.isArray(item.evaluations) && item.evaluations.length > 0) return item.evaluations
  if (Array.isArray(item.risques) && item.risques.length > 0) return item.risques
  if (Array.isArray(item.evaluationRisques) && item.evaluationRisques.length > 0) {
    return item.evaluationRisques
  }
  if (Array.isArray(item.evaluations)) return item.evaluations
  return undefined
}

function attachPermitAndEvaluations<T>(
  item: T,
  permitsById: Map<string, Record<string, unknown>>,
): T {
  if (!item || typeof item !== 'object') return item
  const rec = { ...(item as Record<string, unknown>) }
  const permitField = rec.permitTravail
  if (typeof permitField === 'string' || permitField == null) {
    const permitId = resourceId(permitField) ?? resourceId(rec.permitTravailId)
    const permit = permitId ? permitsById.get(permitId) : undefined
    if (permit) rec.permitTravail = permitSummary(permit)
  }
  const evals = evaluationsOf(rec)
  if (evals) rec.evaluations = evals
  if (!rec.permitTravailId) {
    const fromPermit = resourceId(rec.permitTravail)
    if (fromPermit) rec.permitTravailId = fromPermit
  }
  return rec as T
}

async function enrichIntervention<T>(item: T): Promise<T> {
  const permitId =
    item && typeof item === 'object'
      ? resourceId((item as Record<string, unknown>).permitTravail) ??
        resourceId((item as Record<string, unknown>).permitTravailId)
      : undefined
  const permitsById = new Map<string, Record<string, unknown>>()
  if (permitId) {
    const permit = await getByIdFromSnapshot<Record<string, unknown>>('permitsTravail', permitId)
    if (permit) permitsById.set(String(permit.id ?? permitId), permit)
  }
  return attachPermitAndEvaluations(item, permitsById)
}

function attachEntreprise<T>(
  item: T,
  entreprisesById: Map<string, Record<string, unknown>>,
): T {
  if (!item || typeof item !== 'object') return item
  const rec = { ...(item as Record<string, unknown>) }
  const field = rec.entreprise
  if (typeof field === 'string' || field == null) {
    const entrepriseId = resourceId(field)
    const entreprise = entrepriseId ? entreprisesById.get(entrepriseId) : undefined
    if (entreprise) rec.entreprise = entreprise
    if (entreprise && !rec.entrepriseName && typeof entreprise.nom === 'string') {
      rec.entrepriseName = entreprise.nom
    }
  }
  return rec as T
}

async function enrichUser<T>(item: T): Promise<T> {
  const entrepriseId =
    item && typeof item === 'object'
      ? resourceId((item as Record<string, unknown>).entreprise)
      : undefined
  const entreprisesById = new Map<string, Record<string, unknown>>()
  if (entrepriseId) {
    const entreprise = await getByIdFromSnapshot<Record<string, unknown>>(
      'entreprises',
      entrepriseId,
    )
    if (entreprise) entreprisesById.set(String(entreprise.id ?? entrepriseId), entreprise)
  }
  return attachEntreprise(item, entreprisesById)
}

async function enrichUserList<T>(items: T[]): Promise<T[]> {
  const entreprises = await getAllFromSnapshot<Record<string, unknown>>('entreprises')
  const entreprisesById = new Map<string, Record<string, unknown>>()
  for (const entreprise of entreprises) {
    if (entreprise.id != null) entreprisesById.set(String(entreprise.id), entreprise)
    const iriId = resourceId(entreprise['@id'])
    if (iriId) entreprisesById.set(iriId, entreprise)
  }
  return items.map((item) => attachEntreprise(item, entreprisesById))
}

async function enrichInterventionList<T>(items: T[]): Promise<T[]> {
  const permits = await getAllFromSnapshot<Record<string, unknown>>('permitsTravail')
  const permitsById = new Map<string, Record<string, unknown>>()
  for (const permit of permits) {
    if (permit.id != null) permitsById.set(String(permit.id), permit)
    const iriId = resourceId(permit['@id'])
    if (iriId) permitsById.set(iriId, permit)
  }
  return items.map((item) => attachPermitAndEvaluations(item, permitsById))
}

export async function snapshotList<T>(
  store: SnapshotStoreName,
  params?: ListParams,
): Promise<HydraCollection<T> | undefined> {
  if (!(await hasSnapshot())) return undefined
  let items = (await getAllFromSnapshot<T>(store)).filter(
    (item) =>
      matchesStatut(item, params?.statut as string | string[] | undefined) &&
      matchesGroupeId(item, params?.groupeId),
  )
  if (store === 'interventions') {
    items = await enrichInterventionList(items)
  }
  if (store === 'users') {
    items = await enrichUserList(items)
  }
  items = sortByCreatedAtDesc(items)
  const { page, itemsPerPage } = pageArgs(params)
  return paginateLocal(items, page, itemsPerPage)
}

export async function snapshotById<T>(
  store: SnapshotStoreName,
  id: string | number,
): Promise<T | undefined> {
  if (!(await hasSnapshot())) return undefined
  const item = await getByIdFromSnapshot<T>(store, id)
  if (item === undefined) return undefined
  if (store === 'interventions') return enrichIntervention(item)
  if (store === 'users') return enrichUser(item)
  return item
}

export async function snapshotNestedHydra<T>(
  interventionId: string,
  keys: string[],
): Promise<HydraCollection<T> | undefined> {
  const intervention = await snapshotById<Record<string, unknown>>('interventions', interventionId)
  if (!intervention) return undefined
  for (const key of keys) {
    const value = intervention[key]
    if (Array.isArray(value)) return asHydra(value as T[])
  }
  return undefined
}

export async function snapshotSitesGeoJson(): Promise<
  FeatureCollection<Point, SiteGeoJsonFeature> | undefined
> {
  if (!(await hasSnapshot())) return undefined
  const sites = await getAllFromSnapshot<Site>('sites')
  if (sites.length === 0) return undefined
  return {
    type: 'FeatureCollection',
    features: sites.map((site) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [site.longitude, site.latitude],
      },
      properties: {
        id: site.id,
        cs: site.codeSite,
        n: site.nomSite,
        a: site.altitude,
        c: site.couleurMarqueur,
        fok: site.fokontany,
        com: site.commune,
        dis: site.district,
      },
    })),
  }
}

export async function snapshotSiteByCode(
  code: string,
): Promise<{ codeSite: string; nomSite: string } | undefined> {
  if (!(await hasSnapshot())) return undefined
  const sites = await getAllFromSnapshot<Site>('sites')
  const found = sites.find((site) => site.codeSite === code)
  if (!found) return undefined
  return { codeSite: found.codeSite, nomSite: found.nomSite }
}

export async function snapshotSiteSearch(
  q: string,
  limit = 10,
): Promise<{ codeSite: string; nomSite: string }[] | undefined> {
  if (!(await hasSnapshot())) return undefined
  const needle = q.trim().toLowerCase()
  const sites = await getAllFromSnapshot<Site>('sites')
  return sites
    .filter(
      (site) =>
        site.codeSite.toLowerCase().includes(needle) ||
        site.nomSite.toLowerCase().includes(needle),
    )
    .slice(0, limit)
    .map((site) => ({ codeSite: site.codeSite, nomSite: site.nomSite }))
}
