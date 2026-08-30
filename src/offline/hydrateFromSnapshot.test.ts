import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { hydrateFromSnapshot } from './hydrateFromSnapshot'
import {
  INTERVENTION_KEY,
  PERMIT_TRAVAIL_KEY,
  PLANNING_KEY,
  PLAN_PREVENTION_KEY,
  REFERENTIEL_CATEGORIES_RISQUE_KEY,
  SUIVI_JOURNALIER_KEY,
} from '@/data/constant/query'

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0 } } })
}

describe('hydrateFromSnapshot', () => {
  it('sets detail query data for each entity id', () => {
    const qc = makeClient()
    hydrateFromSnapshot(qc, {
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      plansPrevention: [{ id: 'pl1', reference: 'PP' }],
      permitsTravail: [{ id: 'pt1', reference: 'PT' }],
      interventions: [{ id: 'i1', statut: 'EN_COURS', suivisJournaliers: [{ id: 's1' }] }],
      activityPlannings: [{ id: 9, siteCode: 'S1' }],
    })

    expect(qc.getQueryData([...PLAN_PREVENTION_KEY, 'pl1'])).toEqual({ id: 'pl1', reference: 'PP' })
    expect(qc.getQueryData([...PERMIT_TRAVAIL_KEY, 'pt1'])).toEqual({ id: 'pt1', reference: 'PT' })
    expect(qc.getQueryData([...INTERVENTION_KEY, 'i1'])).toEqual(
      expect.objectContaining({ id: 'i1' }),
    )
    expect(qc.getQueryData([...PLANNING_KEY, 9])).toEqual({ id: 9, siteCode: 'S1' })
    expect(qc.getQueryData([...SUIVI_JOURNALIER_KEY, 'i1'])).toEqual(
      expect.objectContaining({ member: [{ id: 's1' }] }),
    )
  })

  it('hydrates nested intervention risques', () => {
    const qc = makeClient()
    hydrateFromSnapshot(qc, {
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      interventions: [
        {
          id: 'i1',
          risques: [{ id: 'r1', description: 'Chute' }],
        },
      ],
    })

    expect(qc.getQueryData([...INTERVENTION_KEY, 'i1', 'risques'])).toEqual(
      expect.objectContaining({ member: [{ id: 'r1', description: 'Chute' }] }),
    )
  })

  it('hydrates referentiel collections', () => {
    const qc = makeClient()
    hydrateFromSnapshot(qc, {
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      referentiel: {
        categoriesRisque: [{ id: 'c1', nom: 'Chute' }],
      },
    })

    expect(qc.getQueryData([...REFERENTIEL_CATEGORIES_RISQUE_KEY, 'all'])).toEqual(
      expect.objectContaining({ member: [{ id: 'c1', nom: 'Chute' }] }),
    )
  })
})
