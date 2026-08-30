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

function pageArgs(params: ListParams): { page: number; itemsPerPage: number } {
  const page = Number(params?.page ?? 1) || 1
  const itemsPerPage = Number(params?.itemsPerPage ?? params?.limit ?? 0) || 0
  return { page, itemsPerPage }
}

export async function snapshotList<T>(
  store: SnapshotStoreName,
  params?: ListParams,
): Promise<HydraCollection<T> | undefined> {
  if (!(await hasSnapshot())) return undefined
  const items = (await getAllFromSnapshot<T>(store)).filter((item) =>
    matchesStatut(item, params?.statut as string | string[] | undefined),
  )
  const { page, itemsPerPage } = pageArgs(params)
  return paginateLocal(items, page, itemsPerPage)
}

export async function snapshotById<T>(
  store: SnapshotStoreName,
  id: string | number,
): Promise<T | undefined> {
  if (!(await hasSnapshot())) return undefined
  return getByIdFromSnapshot<T>(store, id)
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
