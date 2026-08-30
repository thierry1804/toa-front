import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockHasSnapshot, mockGetAll, mockGetById } = vi.hoisted(() => ({
  mockHasSnapshot: vi.fn(),
  mockGetAll: vi.fn(),
  mockGetById: vi.fn(),
}))

vi.mock('./snapshotStore', () => ({
  hasSnapshot: mockHasSnapshot,
  getAllFromSnapshot: mockGetAll,
  getByIdFromSnapshot: mockGetById,
}))

import { snapshotList, snapshotById } from './snapshotRead'

function ids(result: { member: unknown[] } | undefined): string[] {
  return (result?.member ?? []).map((item) => (item as { id: string }).id)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockHasSnapshot.mockResolvedValue(true)
  mockGetById.mockResolvedValue(undefined)
})

describe('snapshotList', () => {
  it('returns undefined when no snapshot is stored', async () => {
    mockHasSnapshot.mockResolvedValue(false)

    await expect(snapshotList('permitsTravail', { page: 1 })).resolves.toBeUndefined()
  })

  it('filters permits by groupeId', async () => {
    mockGetAll.mockResolvedValue([
      { id: 'a', groupeId: 'g1', createdAt: '2026-01-02' },
      { id: 'b', groupeId: 'g2', createdAt: '2026-01-03' },
      { id: 'c', groupeId: 'g1', createdAt: '2026-01-01' },
    ])

    const result = await snapshotList<{ id: string }>('permitsTravail', { groupeId: 'g1' })

    expect(ids(result)).toEqual(['a', 'c'])
    expect(result?.totalItems).toBe(2)
  })

  it('matches groupeId stored as an IRI', async () => {
    mockGetAll.mockResolvedValue([
      { id: 'a', groupeId: '/api/permit-groupes/g1', createdAt: '2026-01-01' },
      { id: 'b', groupeId: '/api/permit-groupes/g2', createdAt: '2026-01-02' },
    ])

    const result = await snapshotList<{ id: string }>('permitsTravail', { groupeId: 'g1' })

    expect(ids(result)).toEqual(['a'])
  })

  it('sorts by createdAt desc then paginates so page 2 is not empty', async () => {
    mockGetAll.mockResolvedValue([
      { id: 'old', createdAt: '2026-01-01T00:00:00Z' },
      { id: 'mid', createdAt: '2026-01-02T00:00:00Z' },
      { id: 'new', createdAt: '2026-01-03T00:00:00Z' },
    ])

    const page1 = await snapshotList<{ id: string }>('permitsTravail', { page: 1, itemsPerPage: 2 })
    const page2 = await snapshotList<{ id: string }>('permitsTravail', { page: 2, itemsPerPage: 2 })

    expect(ids(page1)).toEqual(['new', 'mid'])
    expect(page1?.totalItems).toBe(3)
    expect(ids(page2)).toEqual(['old'])
    expect(page2?.totalItems).toBe(3)
  })
})

describe('snapshotById interventions', () => {
  it('embeds permitTravail from the permits store when the dump only has an IRI', async () => {
    mockGetById.mockImplementation(async (store: string, id: string | number) => {
      if (store === 'interventions') {
        return {
          id: 'i1',
          permitTravail: '/api/permits-travail/p1',
          permitTravailId: 'p1',
          statut: 'EN_PREPARATION',
        }
      }
      if (store === 'permitsTravail' && String(id) === 'p1') {
        return {
          id: 'p1',
          reference: '2026/PTW-TOA-0005',
          codeSite: 'TVAT128',
          descriptionTravaux: 'Câblage',
          dateDebutPrevue: '2026-08-29',
          dateFinPrevue: '2026-10-30',
          createdBy: { id: 1, email: 'a@b.c', name: 'Bouvier', firstname: 'Julien' },
        }
      }
      return undefined
    })

    const result = await snapshotById<Record<string, unknown>>('interventions', 'i1')

    expect(result?.permitTravail).toEqual(
      expect.objectContaining({
        id: 'p1',
        reference: '2026/PTW-TOA-0005',
        codeSite: 'TVAT128',
      }),
    )
  })

  it('exposes nested risques as evaluations', async () => {
    mockGetById.mockResolvedValue({
      id: 'i1',
      permitTravail: { id: 'p1', reference: 'PT', codeSite: 'S1' },
      risques: [{ id: 'r1', description: 'Chute', estReevalue: false }],
    })

    const result = await snapshotById<Record<string, unknown>>('interventions', 'i1')

    expect(result?.evaluations).toEqual([
      expect.objectContaining({ id: 'r1', description: 'Chute' }),
    ])
  })
})

describe('snapshotList interventions', () => {
  it('embeds permitTravail on each list item', async () => {
    mockGetAll.mockImplementation(async (store: string) => {
      if (store === 'interventions') {
        return [{ id: 'i1', permitTravail: '/api/permits-travail/p1', statut: 'EN_PREPARATION' }]
      }
      if (store === 'permitsTravail') {
        return [{ id: 'p1', reference: 'PT-1', codeSite: 'TVAT140', descriptionTravaux: 'x' }]
      }
      return []
    })

    const result = await snapshotList<Record<string, unknown>>('interventions')

    expect(result?.member[0]?.permitTravail).toEqual(
      expect.objectContaining({ id: 'p1', reference: 'PT-1', codeSite: 'TVAT140' }),
    )
  })
})

describe('snapshotById users', () => {
  it('embeds entreprise from the entreprises store when the dump only has an IRI', async () => {
    mockGetById.mockImplementation(async (store: string, id: string | number) => {
      if (store === 'users') {
        return { id: 25, email: 'j@b.c', entreprise: '/api/entreprises/e1' }
      }
      if (store === 'entreprises' && String(id) === 'e1') {
        return { id: 'e1', nom: 'Bouvier SARL' }
      }
      return undefined
    })

    const result = await snapshotById<Record<string, unknown>>('users', 25)

    expect(result?.entreprise).toEqual(expect.objectContaining({ id: 'e1', nom: 'Bouvier SARL' }))
    expect(result?.entrepriseName).toBe('Bouvier SARL')
  })
})
