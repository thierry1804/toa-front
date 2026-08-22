import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboardApi'
import { DASHBOARD_KEY } from '@/data/constant/query'
import type { DashboardKpisFilters } from '@/types/dashboard'

const REFETCH_MS = 60_000

type DashboardQueryOptions = { enabled?: boolean }

export function useDashboardKpis(
  filters?: DashboardKpisFilters,
  options?: DashboardQueryOptions,
) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'global', filters],
    queryFn: () => dashboardApi.getKpis(filters),
    staleTime: REFETCH_MS,
    refetchInterval: options?.enabled === false ? false : REFETCH_MS,
    enabled: options?.enabled !== false,
  })
}

export function useDashboardKpisSites(
  filters?: Omit<DashboardKpisFilters, 'codeSite'>,
  options?: DashboardQueryOptions,
) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'sites', filters],
    queryFn: () => dashboardApi.getKpisSites(filters),
    staleTime: REFETCH_MS,
    refetchInterval: options?.enabled === false ? false : REFETCH_MS,
    enabled: options?.enabled !== false,
  })
}

export function useDashboardKpisEvolution(
  codeSite?: string,
  nbMois = 6,
  options?: DashboardQueryOptions,
) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'evolution', codeSite, nbMois],
    queryFn: () => dashboardApi.getEvolution(codeSite, nbMois),
    staleTime: REFETCH_MS,
    refetchInterval: options?.enabled === false ? false : REFETCH_MS,
    enabled: options?.enabled !== false,
  })
}
