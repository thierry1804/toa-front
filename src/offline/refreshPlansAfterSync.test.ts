import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

const { mockGetById, mockPut } = vi.hoisted(() => ({
  mockGetById: vi.fn(),
  mockPut: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/api/planPreventionApi', () => ({ planPreventionApi: { getById: mockGetById } }))
vi.mock('./snapshotStore', () => ({ putSnapshotItem: mockPut }))

import { planIdsFromQueue, refreshPlansAfterSync } from './refreshPlansAfterSync'

const A = '01a0b9e8-700b-7360-bc62-f48352ba5de9'
const B = '01a0b9e8-7b31-7eeb-b3b7-bd11a8cf1577'

describe('planIdsFromQueue', () => {
  it('extrait les plans visés sans doublon, quelle que soit la sous-route', () => {
    const ids = planIdsFromQueue([
      { url: `/api/plans-prevention/${A}/documents/${B}/consulter` },
      { url: `/api/plans-prevention/${A}/examiner` },
      { url: `/api/plans-prevention/${B}/documents` },
      { url: `https://api.toa.mg/api/plans-prevention/${B.toUpperCase()}/valider?x=1` },
    ])
    expect(ids.sort()).toEqual([A, B].sort())
  })

  it('ignore les autres ressources et la création (sans identifiant)', () => {
    expect(
      planIdsFromQueue([
        { url: '/api/plans-prevention' },
        { url: `/api/permits-travail/${A}/soumettre` },
        { url: '/api/suivis-journaliers' },
      ]),
    ).toEqual([])
  })
})

describe('refreshPlansAfterSync', () => {
  const qc = () => new QueryClient()

  beforeEach(() => {
    vi.clearAllMocks()
    mockPut.mockResolvedValue(undefined)
  })

  it("remplace l'état optimiste par celui du serveur, dans le cache et dans le snapshot", async () => {
    const client = qc()
    // état local provisoire : le plan a été « validé » hors-ligne
    client.setQueryData(['plans-prevention', A], { id: A, statut: 'VALIDE_HSE', pendingSync: true })
    // le serveur l'a refusé entre-temps
    mockGetById.mockResolvedValue({ id: A, statut: 'BROUILLON' })

    await refreshPlansAfterSync(client, [A])

    const cached = client.getQueryData<{ statut: string; pendingSync?: boolean }>(['plans-prevention', A])
    expect(cached).toEqual({ id: A, statut: 'BROUILLON' })
    expect(cached?.pendingSync).toBeUndefined()
    expect(mockPut).toHaveBeenCalledWith('plansPrevention', { id: A, statut: 'BROUILLON' })
  })

  it("garde l'état local et continue avec les autres plans si l'un ne peut pas être relu", async () => {
    const client = qc()
    client.setQueryData(['plans-prevention', A], { id: A, statut: 'VALIDE_HSE', pendingSync: true })
    mockGetById.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({ id: B, statut: 'SOUMIS' })

    await refreshPlansAfterSync(client, [A, B])

    expect(client.getQueryData(['plans-prevention', A])).toMatchObject({ pendingSync: true })
    expect(client.getQueryData(['plans-prevention', B])).toEqual({ id: B, statut: 'SOUMIS' })
  })
})

