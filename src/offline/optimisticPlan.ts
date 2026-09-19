import type { QueryClient } from '@tanstack/react-query'
import { PLAN_PREVENTION_KEY } from '@/data/constant/query'
import type { PlanPrevention } from '@/types/planPrevention'
import { getByIdFromSnapshot, putSnapshotItem } from './snapshotStore'

/** Actions du cycle de vie d'un plan qui peuvent être mises en file hors-ligne. */
export type PlanOfflineAction =
  | { type: 'consulter'; documentId: string }
  | { type: 'soumettre' }
  | { type: 'resoumettre' }
  | { type: 'examiner' }
  | { type: 'valider' }
  | { type: 'refuser' }

function allConsulted(documents: PlanPrevention['documents']): boolean {
  return (documents ?? []).every((doc) => doc.nonApplicable === true || Boolean(doc.consultedAt))
}

function resetConsultations(documents: PlanPrevention['documents']): PlanPrevention['documents'] {
  return (documents ?? []).map((doc) => (doc.nonApplicable === true ? doc : { ...doc, consultedAt: null }))
}

/**
 * Effet local d'une action mise en file hors-ligne : reproduit la transition faite par le serveur
 * (statut, consultations remises à zéro à la soumission et à l'examen — R-11) pour que l'écran et la
 * lecture hors-ligne reflètent l'action. Le serveur reste l'autorité : la vraie valeur écrase celle-ci
 * dès la synchronisation.
 */
export function applyPlanAction(plan: PlanPrevention, action: PlanOfflineAction, now = new Date()): PlanPrevention {
  const at = now.toISOString()

  switch (action.type) {
    case 'consulter': {
      const documents = (plan.documents ?? []).map((doc) =>
        doc.id === action.documentId && !doc.consultedAt ? { ...doc, consultedAt: at } : doc,
      )
      return { ...plan, documents, tousDocumentsConsultes: allConsulted(documents), pendingSync: true }
    }
    case 'soumettre':
    case 'resoumettre': {
      const documents = resetConsultations(plan.documents)
      return {
        ...plan,
        statut: 'SOUMIS',
        soumisAt: at,
        documents,
        tousDocumentsConsultes: allConsulted(documents),
        pendingSync: true,
      }
    }
    case 'examiner': {
      const documents = resetConsultations(plan.documents)
      return {
        ...plan,
        statut: 'EXAMINE',
        documents,
        tousDocumentsConsultes: allConsulted(documents),
        pendingSync: true,
      }
    }
    case 'valider':
      return { ...plan, statut: 'VALIDE_HSE', validatedAt: at, pendingSync: true }
    case 'refuser':
      return { ...plan, statut: 'BROUILLON', pendingSync: true }
  }
}

/**
 * Applique l'action au plan connu localement (cache React Query, sinon snapshot) et l'écrit aux deux
 * endroits : sans l'écriture dans le snapshot, la relecture hors-ligne (qui lit IndexedDB) reviendrait à
 * l'état d'avant l'action.
 */
export async function commitOptimisticPlan(
  queryClient: QueryClient,
  planId: string,
  action: PlanOfflineAction,
): Promise<PlanPrevention | undefined> {
  const key = [...PLAN_PREVENTION_KEY, planId]
  const current =
    queryClient.getQueryData<PlanPrevention>(key) ??
    (await getByIdFromSnapshot<PlanPrevention>('plansPrevention', planId))
  if (!current) return undefined

  const next = applyPlanAction(current, action)
  queryClient.setQueryData(key, next)
  await putSnapshotItem('plansPrevention', next).catch(() => undefined)
  return next
}
