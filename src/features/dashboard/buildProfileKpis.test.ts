import { describe, expect, it } from 'vitest'
import { buildProfileKpis, profileKpiKeysFor, PROFILE_KPI_HREF, statutMatchesFilter, statutApiParam, PERMIT_STATUT_GROUPS } from './buildProfileKpis'
import type { PermitTravail } from '@/types/permitTravail'
import type { PlanPrevention } from '@/types/planPrevention'
import type { Intervention } from '@/types/intervention'
import type { User } from '@/types'

function permit(statut: PermitTravail['statut']): PermitTravail {
  return { id: statut, statut } as PermitTravail
}

function plan(statut: PlanPrevention['statut']): PlanPrevention {
  return { id: statut, statut } as PlanPrevention
}

function intervention(statut: Intervention['statut']): Intervention {
  return { id: statut, statut } as Intervention
}

function user(isActive: boolean): User {
  return { id: isActive ? 1 : 2, isActive } as User
}

describe('profileKpiKeysFor', () => {
  it('keeps at most 6 keys and prefers operational queues', () => {
    expect(
      profileKpiKeysFor({
        permits: true,
        plans: true,
        interventions: true,
        planning: true,
        users: true,
      }),
    ).toEqual([
      'permitsToHandle',
      'permisValides',
      'plansToHandle',
      'plansValides',
      'interventionsEnCours',
      'interventionsPlanifiees',
    ])
  })

  it('only includes modules the profile can see', () => {
    expect(
      profileKpiKeysFor({
        permits: true,
        plans: false,
        interventions: false,
        planning: false,
        users: true,
      }),
    ).toEqual(['permitsToHandle', 'permisValides', 'usersActive'])
  })
})

describe('buildProfileKpis', () => {
  it('counts actionable and validated permits', () => {
    const items = buildProfileKpis(
      { permits: true, plans: false, interventions: false, planning: false, users: false },
      {
        permits: [
          permit('BROUILLON'),
          permit('SOUMIS'),
          permit('REFUSE_HSE'),
          permit('VALIDE_HSE'),
          permit('CLOTURE'),
        ],
      },
    )
    expect(items).toEqual([
      { key: 'permitsToHandle', value: 3 },
      { key: 'permisValides', value: 1 },
    ])
  })

  it('returns null values while a visible collection is still loading', () => {
    expect(
      buildProfileKpis(
        { permits: true, plans: true, interventions: false, planning: false, users: false },
        {},
      ),
    ).toEqual([
      { key: 'permitsToHandle', value: null },
      { key: 'permisValides', value: null },
      { key: 'plansToHandle', value: null },
      { key: 'plansValides', value: null },
    ])
  })

  it('counts plan and intervention queues', () => {
    const items = buildProfileKpis(
      { permits: false, plans: true, interventions: true, planning: false, users: false },
      {
        plans: [plan('SOUMIS'), plan('VALIDE_HSE'), plan('BROUILLON')],
        interventions: [
          intervention('EN_COURS'),
          intervention('EN_PREPARATION'),
          intervention('EVALUATION_COMPLETE'),
        ],
      },
    )
    expect(items).toEqual([
      { key: 'plansToHandle', value: 2 },
      { key: 'plansValides', value: 1 },
      { key: 'interventionsEnCours', value: 1 },
      { key: 'interventionsPlanifiees', value: 2 },
    ])
  })

  it('builds list URLs with a matching statut query', () => {
    expect(PROFILE_KPI_HREF.permitsToHandle).toBe('/permits-travail?statut=todo')
    expect(PROFILE_KPI_HREF.permisValides).toBe('/permits-travail?statut=valides')
    expect(PROFILE_KPI_HREF.plansToHandle).toBe('/prevention?statut=todo')
    expect(PROFILE_KPI_HREF.interventionsEnCours).toBe('/interventions?statut=en_cours')
    expect(PROFILE_KPI_HREF.usersActive).toBe('/users?statut=actif')
  })

  it('counts active users when that is the only module', () => {
    expect(
      buildProfileKpis(
        { permits: false, plans: false, interventions: false, planning: false, users: true },
        { users: [user(true), user(true), user(false)] },
      ),
    ).toEqual([{ key: 'usersActive', value: 2 }])
  })
})

describe('statutMatchesFilter', () => {
  it('matches a statut group used by dashboard KPIs', () => {
    expect(statutMatchesFilter('SOUMIS', 'todo', PERMIT_STATUT_GROUPS)).toBe(true)
    expect(statutMatchesFilter('VALIDE_HSE', 'todo', PERMIT_STATUT_GROUPS)).toBe(false)
    expect(statutMatchesFilter('VALIDE_HSE', 'valides', PERMIT_STATUT_GROUPS)).toBe(true)
    expect(statutMatchesFilter('CLOTURE', 'CLOTURE', PERMIT_STATUT_GROUPS)).toBe(true)
  })
})

describe('statutApiParam', () => {
  it('expands KPI groups into statut arrays for the list API', () => {
    expect(statutApiParam('todo', PERMIT_STATUT_GROUPS)).toEqual([
      'BROUILLON',
      'SOUMIS',
      'REFUSE_HSE',
      'REJETE',
      'PV_REFUSE',
    ])
    expect(statutApiParam('valides', PERMIT_STATUT_GROUPS)).toEqual(['VALIDE', 'VALIDE_HSE'])
    expect(statutApiParam('CLOTURE', PERMIT_STATUT_GROUPS)).toBe('CLOTURE')
    expect(statutApiParam('all', PERMIT_STATUT_GROUPS)).toBeUndefined()
  })
})

