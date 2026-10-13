import type { QueryClient } from '@tanstack/react-query'
import { INTERVENTION_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import type { HydraCollection } from '@/types'
import type {
  Intervention,
  SuiviJournalier,
  SuiviJournalierInput,
  SuiviJournalierUpdateInput,
} from '@/types/intervention'
import { getByIdFromSnapshot, putSnapshotItem } from './snapshotStore'

type OfflineUser = {
  id: string
  nom: string
  prenom?: string
}

type SnapshotIntervention = Intervention & {
  suivis?: SuiviJournalier[]
}

function nextStatus(intervention: Intervention, suivi: SuiviJournalier): Intervention['statut'] {
  if (intervention.statut === 'EVALUATION_COMPLETE' && suivi.avancementPourcentage > 0) {
    return 'EN_COURS'
  }
  return intervention.statut
}

export function upsertSuiviCollection(
  old: HydraCollection<SuiviJournalier> | undefined,
  suivi: SuiviJournalier,
  interventionId: string,
): HydraCollection<SuiviJournalier> {
  if (!old) {
    return {
      '@context': '/api/contexts/SuiviJournalier',
      '@id': `/api/interventions/${interventionId}/suivis`,
      '@type': 'hydra:Collection',
      member: [suivi],
      totalItems: 1,
    }
  }

  const exists = old.member.some((item) => item.id === suivi.id)
  const member = exists
    ? old.member.map((item) => (item.id === suivi.id ? suivi : item))
    : [...old.member, suivi]
  return { ...old, member, totalItems: exists ? old.totalItems : old.totalItems + 1 }
}

function withSuivi(intervention: SnapshotIntervention, suivi: SuiviJournalier): SnapshotIntervention {
  const current = intervention.suivisJournaliers ?? intervention.suivis ?? []
  const exists = current.some((item) => item.id === suivi.id)
  const suivisJournaliers = exists
    ? current.map((item) => (item.id === suivi.id ? suivi : item))
    : [...current, suivi]

  return {
    ...intervention,
    statut: nextStatus(intervention, suivi),
    suivisJournaliers,
    ...(intervention.suivis ? { suivis: suivisJournaliers } : {}),
  }
}

async function persistSuiviInSnapshot(
  interventionId: string,
  suivi: SuiviJournalier,
): Promise<void> {
  const intervention = await getByIdFromSnapshot<SnapshotIntervention>('interventions', interventionId)
  if (!intervention) return
  await putSnapshotItem('interventions', withSuivi(intervention, suivi))
}

export async function commitSuiviLocally(
  queryClient: QueryClient,
  interventionId: string,
  suivi: SuiviJournalier,
): Promise<void> {
  const suiviKey = [...SUIVI_JOURNALIER_KEY, interventionId]
  queryClient.setQueryData<HydraCollection<SuiviJournalier>>(suiviKey, (old) =>
    upsertSuiviCollection(old, suivi, interventionId),
  )

  queryClient.setQueryData<Intervention>([...INTERVENTION_KEY, interventionId], (old) =>
    old ? withSuivi(old, suivi) : old,
  )
  queryClient.setQueryData<HydraCollection<Intervention>>(INTERVENTION_KEY, (old) => {
    if (!old) return old
    return {
      ...old,
      member: old.member.map((item) =>
        item.id === interventionId ? withSuivi(item, suivi) : item,
      ),
    }
  })

  await persistSuiviInSnapshot(interventionId, suivi).catch(() => undefined)
}

export function buildOptimisticSuivi(
  data: SuiviJournalierInput,
  user: OfflineUser | null,
  now = new Date(),
  id = `offline-${crypto.randomUUID()}`,
): SuiviJournalier {
  return {
    id,
    date: data.date,
    nomResponsable: data.nomResponsable,
    realise: data.realise,
    motifNonRealisation: data.motifNonRealisation ?? null,
    avancementPourcentage: data.avancementPourcentage,
    commentaire: data.commentaire ?? null,
    createdBy: {
      id: Number(user?.id ?? 0) || 0,
      name: user?.nom ?? data.nomResponsable,
      firstname: user?.prenom,
    },
    createdAt: now.toISOString(),
    documents: [],
    pendingSync: true,
  }
}

export async function commitOptimisticSuiviCreation(
  queryClient: QueryClient,
  interventionId: string,
  data: SuiviJournalierInput,
  user: OfflineUser | null,
): Promise<void> {
  await commitSuiviLocally(queryClient, interventionId, buildOptimisticSuivi(data, user))
}

export async function commitOptimisticSuiviUpdate(
  queryClient: QueryClient,
  interventionId: string,
  suiviId: string,
  data: SuiviJournalierUpdateInput,
): Promise<void> {
  const cached = queryClient.getQueryData<HydraCollection<SuiviJournalier>>([
    ...SUIVI_JOURNALIER_KEY,
    interventionId,
  ])
  let current = cached?.member.find((item) => item.id === suiviId)

  if (!current) {
    const intervention = await getByIdFromSnapshot<SnapshotIntervention>('interventions', interventionId)
    current = (intervention?.suivisJournaliers ?? intervention?.suivis ?? []).find(
      (item) => item.id === suiviId,
    )
  }
  if (!current) return

  await commitSuiviLocally(queryClient, interventionId, {
    ...current,
    ...data,
    pendingSync: true,
  })
}
