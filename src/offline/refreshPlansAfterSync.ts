import type { QueryClient } from '@tanstack/react-query'
import { planPreventionApi } from '@/api/planPreventionApi'
import { PLAN_PREVENTION_KEY } from '@/data/constant/query'
import { putSnapshotItem } from './snapshotStore'
import type { SyncItem } from './syncQueue'

const PLAN_URL = /\/api\/plans-prevention\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})(?:\/|$|\?)/i

/** Identifiants des plans visés par les actions en file (consulter, examiner, valider, documents, risques…). */
export function planIdsFromQueue(items: Pick<SyncItem, 'url'>[]): string[] {
  const ids = new Set<string>()
  for (const item of items) {
    const match = PLAN_URL.exec(item.url ?? '')
    if (match) ids.add(match[1].toLowerCase())
  }
  return [...ids]
}

/**
 * Après synchronisation (réussie ou non), remet les plans touchés dans l'état réel du serveur : l'état
 * optimiste local (voir optimisticPlan) ne doit pas survivre à une action refusée ou modifiée côté serveur.
 * Cible seulement ces plans plutôt qu'un nouveau tirage complet (le snapshot est limité à 1 appel / 5 min).
 */
export async function refreshPlansAfterSync(queryClient: QueryClient, planIds: string[]): Promise<void> {
  for (const id of planIds) {
    try {
      const plan = await planPreventionApi.getById(id)
      queryClient.setQueryData([...PLAN_PREVENTION_KEY, id], plan)
      await putSnapshotItem('plansPrevention', plan)
    } catch {
      // Hors-ligne, supprimé ou non autorisé : on garde l'état local, le prochain tirage le corrigera.
    }
  }
}
