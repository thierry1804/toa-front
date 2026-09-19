import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resetSnapshotDbForTests } from './snapshotStore'

type Store = Map<unknown, unknown>
const stores: Record<string, Store> = {}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => {
        stores[name] = new Map()
      }),
      get: vi.fn((store: string, key: unknown) => Promise.resolve(stores[store]?.get(key))),
      put: vi.fn((store: string, val: { id?: unknown }, key?: unknown) => {
        const k = key ?? val.id
        stores[store].set(k, val)
        return Promise.resolve()
      }),
      delete: vi.fn((store: string, key: unknown) => {
        stores[store]?.delete(key)
        return Promise.resolve()
      }),
      clear: vi.fn((store: string) => {
        stores[store]?.clear()
        return Promise.resolve()
      }),
      getAll: vi.fn((store: string) => Promise.resolve([...(stores[store]?.values() ?? [])])),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

function fakeJwt(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `aaa.${b64}.bbb`
}

beforeEach(() => {
  Object.keys(stores).forEach((k) => delete stores[k])
  localStorage.clear()
  localStorage.setItem('access_token', fakeJwt({ id: '42' }))
  resetSnapshotDbForTests()
})

describe('snapshotStore', () => {
  it('saves a full snapshot and reads entities by module', async () => {
    const { saveSnapshot, getAllFromSnapshot, getByIdFromSnapshot, getSnapshotMeta } =
      await import('./snapshotStore')

    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      permitsTravail: [{ id: 'p1', reference: 'PT-1' }],
      plansPrevention: [{ id: 'pl1', reference: 'PP-1' }],
      referentiel: {
        categoriesRisque: [{ id: 'c1', nom: 'Chute' }],
      },
    })

    expect(await getAllFromSnapshot('permitsTravail')).toEqual([
      { id: 'p1', reference: 'PT-1' },
    ])
    expect(await getByIdFromSnapshot('plansPrevention', 'pl1')).toEqual({
      id: 'pl1',
      reference: 'PP-1',
    })
    expect(await getAllFromSnapshot('categoriesRisque')).toEqual([{ id: 'c1', nom: 'Chute' }])
    const meta = await getSnapshotMeta()
    expect(meta?.userId).toBe('42')
    expect(meta?.generatedAt).toBe('2026-08-30T12:00:00Z')
    expect(meta?.modules).toEqual(expect.arrayContaining(['permitsTravail', 'plansPrevention', 'referentiel']))
  })

  it('applies a delta and tombstones without wiping other entities', async () => {
    const { saveSnapshot, applyDelta, getAllFromSnapshot, getByIdFromSnapshot } =
      await import('./snapshotStore')

    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      permitsTravail: [
        { id: 'p1', reference: 'PT-1' },
        { id: 'p2', reference: 'PT-2' },
      ],
    })

    await applyDelta({
      generatedAt: '2026-08-30T13:00:00Z',
      userId: 42,
      since: '2026-08-30T12:00:00Z',
      permitsTravail: [{ id: 'p1', reference: 'PT-1-b' }],
      tombstones: { permitsTravail: ['p2'] },
    })

    expect(await getByIdFromSnapshot('permitsTravail', 'p1')).toEqual({
      id: 'p1',
      reference: 'PT-1-b',
    })
    expect(await getAllFromSnapshot('permitsTravail')).toEqual([
      { id: 'p1', reference: 'PT-1-b' },
    ])
  })

  it('hides another user snapshot', async () => {
    const { saveSnapshot, getSnapshotMeta, getAllFromSnapshot } = await import('./snapshotStore')

    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      permitsTravail: [{ id: 'p1' }],
    })

    localStorage.setItem('access_token', fakeJwt({ id: '99' }))

    expect(await getSnapshotMeta()).toBeNull()
    expect(await getAllFromSnapshot('permitsTravail')).toEqual([])
  })

  it('clears all snapshot stores', async () => {
    const { saveSnapshot, clearSnapshot, getSnapshotMeta, getAllFromSnapshot } =
      await import('./snapshotStore')

    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      permitsTravail: [{ id: 'p1' }],
    })

    await clearSnapshot()

    expect(await getSnapshotMeta()).toBeNull()
    expect(await getAllFromSnapshot('permitsTravail')).toEqual([])
  })

  it('stores entities that only have @id and persists users', async () => {
    const { saveSnapshot, getAllFromSnapshot, getByIdFromSnapshot } = await import('./snapshotStore')

    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      interventions: [{ '@id': '/api/interventions/i1', statut: 'EN_PREPARATION' }],
      users: [{ id: 25, email: 'j@b.c', entreprise: '/api/entreprises/e1' }],
      entreprises: [{ id: 'e1', nom: 'Bouvier SARL' }],
    })

    expect(await getByIdFromSnapshot('interventions', 'i1')).toEqual(
      expect.objectContaining({ id: 'i1', statut: 'EN_PREPARATION' }),
    )
    expect(await getByIdFromSnapshot('users', 25)).toEqual(
      expect.objectContaining({ id: 25, email: 'j@b.c' }),
    )
    expect(await getAllFromSnapshot('entreprises')).toEqual([
      expect.objectContaining({ id: 'e1', nom: 'Bouvier SARL' }),
    ])
  })

  it('stores the extras (required documents, available plannings) and replaces them on the next pull', async () => {
    const { saveSnapshot, saveExtras, getAllFromSnapshot, getByIdFromSnapshot } = await import('./snapshotStore')
    await saveSnapshot({ generatedAt: '2026-08-30T12:00:00Z', userId: 42 })

    await saveExtras({
      generatedAt: 't',
      permitsDocumentsRequis: [
        { id: 'pt1', soumission: ['TROUSSE_SECOURS'], cloture: ['PHOTO_AVANT_TRAVAUX'], apnApi: true },
      ],
      planificationsDisponibles: [{ id: 5 }, { id: 2 }],
      generatedPdfs: [],
    })

    expect(await getByIdFromSnapshot('permitDocumentsRequis', 'pt1')).toMatchObject({ apnApi: true })
    expect(await getByIdFromSnapshot('planificationsDisponibles', 5)).toEqual({ id: 5 })
    expect(await getAllFromSnapshot('planificationsDisponibles')).toHaveLength(2)

    await saveExtras({
      generatedAt: 't2',
      permitsDocumentsRequis: [],
      planificationsDisponibles: [{ id: 7 }],
      generatedPdfs: [],
    })

    expect(await getByIdFromSnapshot('permitDocumentsRequis', 'pt1')).toBeUndefined()
    expect(await getAllFromSnapshot('planificationsDisponibles')).toEqual([{ id: 7 }])
  })

  it('writes a single entity into the snapshot (optimistic offline state)', async () => {
    const { saveSnapshot, putSnapshotItem, getByIdFromSnapshot } = await import('./snapshotStore')
    await saveSnapshot({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 42,
      plansPrevention: [{ id: 'pl1', statut: 'EXAMINE' }],
    })

    await putSnapshotItem('plansPrevention', { id: 'pl1', statut: 'VALIDE_HSE', pendingSync: true })

    expect(await getByIdFromSnapshot('plansPrevention', 'pl1')).toEqual({
      id: 'pl1',
      statut: 'VALIDE_HSE',
      pendingSync: true,
    })
  })
})
