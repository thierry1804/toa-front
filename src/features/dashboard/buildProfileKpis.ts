import type { ActivityPlanning, User } from '@/types'
import type { Intervention } from '@/types/intervention'
import type { PermitTravail } from '@/types/permitTravail'
import type { PlanPrevention } from '@/types/planPrevention'

export const PROFILE_KPI_LIMIT = 6

const PERMIT_TODO = ['BROUILLON', 'SOUMIS', 'REFUSE_HSE', 'REJETE', 'PV_REFUSE'] as const
const PERMIT_VALID = ['VALIDE', 'VALIDE_HSE'] as const
const PERMIT_CLOSED = ['CLOTURE', 'PV_VALIDE'] as const

const PLAN_TODO = [
  'BROUILLON',
  'SOUMIS',
  'EN_ATTENTE',
  'ENVOYE',
  'EN_COURS_DE_VALIDATION',
  'REJETE',
  'REFUSE_HSE',
] as const
const PLAN_VALID = ['VALIDE', 'VALIDE_HSE'] as const

export const PERMIT_STATUT_GROUPS: Record<string, readonly string[]> = {
  todo: PERMIT_TODO,
  valides: PERMIT_VALID,
  clotures: PERMIT_CLOSED,
}

export const PLAN_STATUT_GROUPS: Record<string, readonly string[]> = {
  todo: PLAN_TODO,
  valides: PLAN_VALID,
}

export function statutMatchesFilter(
  statut: string,
  filter: string,
  groups: Record<string, readonly string[]>,
): boolean {
  if (!filter || filter === 'all') return true
  const group = groups[filter]
  if (group) return group.includes(statut)
  return statut === filter
}

export function statutApiParam(
  filter: string,
  groups: Record<string, readonly string[]>,
): string | string[] | undefined {
  if (!filter || filter === 'all') return undefined
  const group = groups[filter]
  if (group) return [...group]
  return filter
}

export type ProfileKpiKey =
  | 'permitsToHandle'
  | 'permisValides'
  | 'plansToHandle'
  | 'plansValides'
  | 'interventionsEnCours'
  | 'interventionsPlanifiees'
  | 'planningEnCours'
  | 'usersActive'

export type ProfileKpiModules = {
  permits: boolean
  plans: boolean
  interventions: boolean
  planning: boolean
  users: boolean
}

export type ProfileKpiItem = {
  key: ProfileKpiKey
  value: number | null
}

export const PROFILE_KPI_HREF: Record<ProfileKpiKey, string> = {
  permitsToHandle: '/permits-travail?statut=todo',
  permisValides: '/permits-travail?statut=valides',
  plansToHandle: '/prevention?statut=todo',
  plansValides: '/prevention?statut=valides',
  interventionsEnCours: '/interventions?statut=en_cours',
  interventionsPlanifiees: '/interventions?statut=planifiee',
  planningEnCours: '/planning?statut=en_cours',
  usersActive: '/users?statut=actif',
}

function countBy<T>(items: T[] | undefined, pred: (item: T) => boolean): number | null {
  if (!items) return null
  return items.filter(pred).length
}

const CANDIDATES: Array<{
  key: ProfileKpiKey
  module: keyof ProfileKpiModules
}> = [
  { key: 'permitsToHandle', module: 'permits' },
  { key: 'permisValides', module: 'permits' },
  { key: 'plansToHandle', module: 'plans' },
  { key: 'plansValides', module: 'plans' },
  { key: 'interventionsEnCours', module: 'interventions' },
  { key: 'interventionsPlanifiees', module: 'interventions' },
  { key: 'planningEnCours', module: 'planning' },
  { key: 'usersActive', module: 'users' },
]

export function profileKpiKeysFor(modules: ProfileKpiModules): ProfileKpiKey[] {
  return CANDIDATES.filter((c) => modules[c.module])
    .map((c) => c.key)
    .slice(0, PROFILE_KPI_LIMIT)
}

export function buildProfileKpis(
  modules: ProfileKpiModules,
  data: {
    permits?: PermitTravail[]
    plans?: PlanPrevention[]
    interventions?: Intervention[]
    plannings?: ActivityPlanning[]
    users?: User[]
  },
): ProfileKpiItem[] {
  const values: Record<ProfileKpiKey, number | null> = {
    permitsToHandle: countBy(data.permits, (p) => PERMIT_STATUT_GROUPS.todo.includes(p.statut)),
    permisValides: countBy(data.permits, (p) => PERMIT_STATUT_GROUPS.valides.includes(p.statut)),
    plansToHandle: countBy(data.plans, (p) => PLAN_STATUT_GROUPS.todo.includes(p.statut)),
    plansValides: countBy(data.plans, (p) => PLAN_STATUT_GROUPS.valides.includes(p.statut)),
    interventionsEnCours: countBy(data.interventions, (i) => i.statut === 'EN_COURS'),
    interventionsPlanifiees: countBy(data.interventions, (i) =>
      i.statut === 'EN_PREPARATION' || i.statut === 'EVALUATION_COMPLETE',
    ),
    planningEnCours: countBy(data.plannings, (p) => p.status === 'en_cours'),
    usersActive: countBy(data.users, (u) => u.isActive),
  }

  return profileKpiKeysFor(modules).map((key) => ({ key, value: values[key] }))
}
