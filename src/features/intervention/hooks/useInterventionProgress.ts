import { useQueries } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import { latestInterventionProgress } from '../presentation'

export function useInterventionProgress(interventions: { id: string }[]) {
  const queries = useQueries({
    queries: interventions.map(({ id }) => ({
      queryKey: [...SUIVI_JOURNALIER_KEY, id],
      queryFn: () => interventionApi.getSuivis(id),
      select: (data: Awaited<ReturnType<typeof interventionApi.getSuivis>>) =>
        latestInterventionProgress(data.member ?? []),
    })),
  })
  return {
    isLoading: queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
    progressById: new Map(interventions.map(({ id }, index) => [id, queries[index]?.data ?? 0])),
  }
}
