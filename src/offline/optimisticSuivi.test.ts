import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { INTERVENTION_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import type { HydraCollection } from '@/types'
import type { Intervention, SuiviJournalier } from '@/types/intervention'

const { mockGetById, mockPut } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockPut: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('./snapshotStore', () => ({
  getByIdFromSnapshot: mockGetById,
  putSnapshotItem: mockPut,
}))

import {
  buildOptimisticSuivi,
  commitOptimisticSuiviUpdate,
  commitSuiviLocally,
} from './optimisticSuivi'

const INTERVENTION_ID = 'i1'

function suivi(overrides: Partial<SuiviJournalier> = {}): SuiviJournalier {
  return {
    id: 's1',
    date: '2026-10-13',
    nomResponsable: 'Rak Pascal',
    realise: true,
    motifNonRealisation: null,
    avancementPourcentage: 49,
    commentaire: 'Avant',
    createdBy: { id: 1, name: 'Rak', firstname: 'Pascal' },
    createdAt: '2026-10-13T08:00:00.000Z',
    documents: [],
    ...overrides,
  }
}

function collection(member: SuiviJournalier[]): HydraCollection<SuiviJournalier> {
  return {
    '@context': '/api/contexts/SuiviJournalier',
    '@id': `/api/interventions/${INTERVENTION_ID}/suivis`,
    '@type': 'hydra:Collection',
    member,
    totalItems: member.length,
  }
}

function intervention(overrides: Partial<Intervention> = {}): Intervention {
  return {
    id: INTERVENTION_ID,
    permitTravail: '/api/permits-travail/p1',
    permitTravailId: 'p1',
    statut: 'EVALUATION_COMPLETE',
    createdBy: { id: 1, email: 'agent@example.test', name: 'Rak' },
    createdAt: '2026-10-01T08:00:00.000Z',
    evaluations: [],
    suivisJournaliers: [suivi()],
    ...overrides,
  }
}

describe('suivi journalier hors ligne', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue(undefined)
  })

  it('construit une création optimiste complète et marquée en attente', () => {
    const optimistic = buildOptimisticSuivi(
      {
        intervention: `/api/interventions/${INTERVENTION_ID}`,
        date: '2026-10-13',
        nomResponsable: 'Rak Pascal',
        realise: true,
        avancementPourcentage: 42,
        commentaire: 'Hors ligne',
        phasesAvancement: [{ phaseId: 'phase1', libelle: 'Fouille', avancementPourcentage: 25 }],
        dangersMaitrises: false,
        detailsDangers: 'Balisage requis',
      },
      { id: '7', nom: 'Rak', prenom: 'Pascal' },
      new Date('2026-10-13T10:00:00.000Z'),
      'offline-1',
    )

    expect(optimistic).toMatchObject({
      id: 'offline-1',
      avancementPourcentage: 42,
      commentaire: 'Hors ligne',
        phasesAvancement: [{ phaseId: 'phase1', libelle: 'Fouille', avancementPourcentage: 25 }],
        dangersMaitrises: false,
        detailsDangers: 'Balisage requis',
      pendingSync: true,
      createdBy: { id: 7, name: 'Rak', firstname: 'Pascal' },
    })
  })

  it('met à jour le cache et le snapshot avec la réponse du serveur', async () => {
    const client = new QueryClient()
    const initial = intervention()
    const updated = suivi({ avancementPourcentage: 42, commentaire: 'Après' })
    client.setQueryData([...SUIVI_JOURNALIER_KEY, INTERVENTION_ID], collection([suivi()]))
    client.setQueryData([...INTERVENTION_KEY, INTERVENTION_ID], initial)
    mockGetById.mockResolvedValue(initial)

    await commitSuiviLocally(client, INTERVENTION_ID, updated)

    const cached = client.getQueryData<HydraCollection<SuiviJournalier>>([
      ...SUIVI_JOURNALIER_KEY,
      INTERVENTION_ID,
    ])
    expect(cached?.member[0]).toMatchObject({ avancementPourcentage: 42, commentaire: 'Après' })
    expect(client.getQueryData<Intervention>([...INTERVENTION_KEY, INTERVENTION_ID])?.statut)
      .toBe('EN_COURS')
    expect(mockPut).toHaveBeenCalledWith(
      'interventions',
      expect.objectContaining({
        statut: 'EN_COURS',
        suivisJournaliers: [expect.objectContaining({ avancementPourcentage: 42 })],
      }),
    )
  })

  it('applique immédiatement une modification mise en file hors ligne', async () => {
    const client = new QueryClient()
    const initial = intervention()
    client.setQueryData([...SUIVI_JOURNALIER_KEY, INTERVENTION_ID], collection([suivi()]))
    mockGetById.mockResolvedValue(initial)

    await commitOptimisticSuiviUpdate(client, INTERVENTION_ID, 's1', {
      avancementPourcentage: 42,
      commentaire: 'Modification hors ligne',
    })

    const cached = client.getQueryData<HydraCollection<SuiviJournalier>>([
      ...SUIVI_JOURNALIER_KEY,
      INTERVENTION_ID,
    ])
    expect(cached?.member[0]).toMatchObject({
      avancementPourcentage: 42,
      commentaire: 'Modification hors ligne',
      pendingSync: true,
    })
    expect(mockPut).toHaveBeenCalled()
  })
})
