import api from '@/lib/axios'
import type {
  DashboardKpisGlobal,
  DashboardKpisSiteItem,
  DashboardKpisEvolutionItem,
  DashboardKpisFilters,
} from '@/types/dashboard'

export const dashboardApi = {
  getKpis: (filters?: DashboardKpisFilters) => {
    const params: Record<string, string> = {}
    if (filters?.codeSite)  params.codeSite  = filters.codeSite
    if (filters?.periode)   params.periode   = filters.periode
    if (filters?.dateDebut) params.dateDebut = filters.dateDebut
    if (filters?.dateFin)   params.dateFin   = filters.dateFin
    return api.get<DashboardKpisGlobal>('/api/dashboard/kpis', { params }).then((r) => r.data)
  },

  getKpisSites: (filters?: Omit<DashboardKpisFilters, 'codeSite'>) => {
    const params: Record<string, string> = {}
    if (filters?.periode)   params.periode   = filters.periode
    if (filters?.dateDebut) params.dateDebut = filters.dateDebut
    if (filters?.dateFin)   params.dateFin   = filters.dateFin
    return api
      .get<DashboardKpisSiteItem[]>('/api/dashboard/kpis/sites', { params })
      .then((r) => r.data)
  },

  getEvolution: (codeSite?: string, nbMois = 6) => {
    const params: Record<string, string> = { nbMois: String(nbMois) }
    if (codeSite) params.codeSite = codeSite
    return api
      .get<DashboardKpisEvolutionItem[]>('/api/dashboard/kpis/evolution', { params })
      .then((r) => r.data)
  },
}
