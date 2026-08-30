import type { QueryClient } from '@tanstack/react-query'
import {
  INTERVENTION_KEY,
  PERMIT_TRAVAIL_KEY,
  PLANNING_KEY,
  PLAN_PREVENTION_KEY,
  REFERENTIEL_CATEGORIES_RISQUE_KEY,
  REFERENTIEL_INSTALLATIONS_KEY,
  REFERENTIEL_SITES_GEOJSON_KEY,
  REFERENTIEL_SITES_KEY,
  SUIVI_JOURNALIER_KEY,
  CONTROLE_JOURNALIER_KEY,
  TAKE5_RECORD_KEY,
} from '@/data/constant/query'
import type { OfflineSnapshot } from '@/types/offlineSnapshot'
import { asHydra } from './asHydra'

function entityId(item: unknown): string | number | undefined {
  if (!item || typeof item !== 'object' || !('id' in item)) return undefined
  const id = (item as { id: unknown }).id
  if (typeof id === 'string' || typeof id === 'number') return id
  return undefined
}

function setDetails(queryClient: QueryClient, key: readonly string[], items: unknown[] | undefined) {
  if (!items) return
  for (const item of items) {
    const id = entityId(item)
    if (id === undefined) continue
    queryClient.setQueryData([...key, id], item)
  }
}

function nestedArray(item: unknown, ...keys: string[]): unknown[] | undefined {
  if (!item || typeof item !== 'object') return undefined
  const record = item as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as unknown[]
  }
  return undefined
}

export function hydrateFromSnapshot(queryClient: QueryClient, snapshot: OfflineSnapshot): void {
  setDetails(queryClient, PLAN_PREVENTION_KEY, snapshot.plansPrevention)
  setDetails(queryClient, PERMIT_TRAVAIL_KEY, snapshot.permitsTravail)
  setDetails(queryClient, INTERVENTION_KEY, snapshot.interventions)
  setDetails(queryClient, PLANNING_KEY, snapshot.activityPlannings)
  setDetails(queryClient, REFERENTIEL_SITES_KEY, snapshot.sites)

  if (snapshot.plansPrevention) {
    queryClient.setQueryData([...PLAN_PREVENTION_KEY, 'snapshot'], asHydra(snapshot.plansPrevention))
  }
  if (snapshot.permitsTravail) {
    queryClient.setQueryData([...PERMIT_TRAVAIL_KEY, 'snapshot'], asHydra(snapshot.permitsTravail))
  }
  if (snapshot.interventions) {
    queryClient.setQueryData(INTERVENTION_KEY, asHydra(snapshot.interventions))
    queryClient.setQueryData([...INTERVENTION_KEY, 'snapshot'], asHydra(snapshot.interventions))
    for (const item of snapshot.interventions) {
      const id = entityId(item)
      if (id === undefined) continue
      const suivis = nestedArray(item, 'suivisJournaliers', 'suivis')
      if (suivis) queryClient.setQueryData([...SUIVI_JOURNALIER_KEY, String(id)], asHydra(suivis))
      const controles = nestedArray(item, 'controlesJournaliers')
      if (controles) {
        queryClient.setQueryData([...CONTROLE_JOURNALIER_KEY, String(id)], asHydra(controles))
      }
      const take5 = nestedArray(item, 'take5Records')
      if (take5) queryClient.setQueryData([...TAKE5_RECORD_KEY, String(id)], asHydra(take5))
    }
  }
  if (snapshot.activityPlannings) {
    queryClient.setQueryData(
      [...PLANNING_KEY, { page: 1, itemsPerPage: 1000 }],
      asHydra(snapshot.activityPlannings),
    )
  }
  if (snapshot.sites) {
    queryClient.setQueryData([...REFERENTIEL_SITES_KEY, 1], asHydra(snapshot.sites, snapshot.sites.length))
  }

  const categories = snapshot.referentiel?.categoriesRisque
  if (categories) {
    queryClient.setQueryData([...REFERENTIEL_CATEGORIES_RISQUE_KEY, 'all'], asHydra(categories))
  }
  const installations = snapshot.referentiel?.installationsEquipements
  if (installations) {
    queryClient.setQueryData(REFERENTIEL_INSTALLATIONS_KEY, asHydra(installations))
  }
  if (snapshot.referentiel?.sitesGeoJson) {
    queryClient.setQueryData(REFERENTIEL_SITES_GEOJSON_KEY, snapshot.referentiel.sitesGeoJson)
  }
}
