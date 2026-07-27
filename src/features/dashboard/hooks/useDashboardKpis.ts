import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboardApi'
import { DASHBOARD_KEY } from '@/data/constant/query'
import type { DashboardKpisFilters } from '@/types/dashboard'

const REFETCH_MS = 60_000

export function useDashboardKpis(filters?: DashboardKpisFilters) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'global', filters],
    queryFn: () => dashboardApi.getKpis(filters),
    staleTime: REFETCH_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useDashboardKpisSites(filters?: Omit<DashboardKpisFilters, 'codeSite'>) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'sites', filters],
    queryFn: () => dashboardApi.getKpisSites(filters),
    staleTime: REFETCH_MS,
    refetchInterval: REFETCH_MS,
  })
}

export function useDashboardKpisEvolution(codeSite?: string, nbMois = 6) {
  return useQuery({
    queryKey: [...DASHBOARD_KEY, 'evolution', codeSite, nbMois],
    queryFn: () => dashboardApi.getEvolution(codeSite, nbMois),
    staleTime: REFETCH_MS,
    refetchInterval: REFETCH_MS,
  })
}
