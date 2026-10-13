import { useQueries, useQuery } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { permitTravailApi } from '@/api/permitTravailApi'
import { INTERVENTION_KEY, PERMIT_TRAVAIL_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import { collectPages } from './model'

export function useTerrainData() {
  const interventions = useQuery({
    queryKey: [...INTERVENTION_KEY, 'terrain'],
    queryFn: () => collectPages((page) => interventionApi.getAll({ page, itemsPerPage: 100 })),
    refetchInterval: 60_000,
  })
  const permits = useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, 'terrain'],
    queryFn: () => collectPages((page) => permitTravailApi.list({ page: String(page), itemsPerPage: '100' })),
    refetchInterval: 60_000,
  })
  // The agent may see an intervention linked to a colleague's permit not in their own collection.
  const permitIds = [...new Set((interventions.data ?? []).map((i) => i.permitTravailId).filter(Boolean))]
  const details = useQueries({ queries: permitIds.map((id) => ({
    queryKey: [...PERMIT_TRAVAIL_KEY, id], queryFn: () => permitTravailApi.getById(id),
    refetchInterval: 60_000,
  })) })
  const rows = interventions.data ?? []
  const suiviQueries = useQueries({ queries: rows.map(({ id }) => ({
    queryKey: [...SUIVI_JOURNALIER_KEY, id], queryFn: () => interventionApi.getSuivis(id),
    refetchInterval: 60_000,
  })) })
  const permitMap = new Map((permits.data ?? []).map((p) => [p.id, p]))
  details.forEach((query) => { if (query.data) permitMap.set(query.data.id, query.data) })
  const suiviMap = new Map(rows.map((row, index) => [row.id, suiviQueries[index]?.data?.member]))
  return {
    interventions: rows, permits: [...permitMap.values()], permitMap, suiviMap,
    isLoading: interventions.isLoading || permits.isLoading || details.some((q) => q.isLoading) || suiviQueries.some((q) => q.isLoading),
    isError: interventions.isError,
    isPartial: permits.isError || details.some((q) => q.isError) || suiviQueries.some((q) => q.isError),
    retry: () => { void interventions.refetch(); void permits.refetch(); details.forEach((q) => void q.refetch()); suiviQueries.forEach((q) => void q.refetch()) },
  }
}
