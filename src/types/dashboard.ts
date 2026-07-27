export interface KpiValues {
  nbPermisCloturesValides: number
  nbPermisCloturesTotal: number
  tauxCloture: number
  delaiMoyenValidationCdp: number
  tauxIncidents: number | null
  tempsMoyenValidationPlan: number | null
  tempsMoyenValidationPermis: number | null
  tempsMoyenValidationPv: number | null
  avancementMoyen: number | null
}

export interface DashboardKpisGlobal {
  tauxIncidents: number
  tempsMoyenValidationPlan: number
  tempsMoyenValidationPermis: number
  tempsMoyenValidationPv: number
  avancementMoyen: number
  nbPermisValides: number
  nbPermisClotures: number
  nbPlansValides: number
  tauxCloture: number
  parSite: { codeSite: string; kpis: KpiValues }[]
  evolution: { periode: string; kpis: KpiValues }[]
}

export interface DashboardKpisSiteItem {
  codeSite: string
  periode: string
  classement: number
  kpis: KpiValues
}

export interface DashboardKpisEvolutionItem {
  periode: string
  codeSite: string
  kpis: KpiValues
}

export interface DashboardKpisFilters {
  codeSite?: string
  periode?: string
  dateDebut?: string
  dateFin?: string
}
