import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

// ── mock idb ─────────────────────────────────────────────────────────────────

type Store = Map<unknown, unknown>
const stores: Record<string, Store> = {}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const store: Store = new Map()
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => { stores[name] = store }),
      get:    vi.fn((_, key: unknown) => Promise.resolve(store.get(key))),
      put:    vi.fn((_, val: unknown, key: unknown) => { store.set(key, val); return Promise.resolve() }),
      delete: vi.fn((_, key: unknown) => { store.delete(key); return Promise.resolve() }),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

import { restoreQueryCache, setupQueryPersistence } from './setupQueryPersistence'

// ── helpers ───────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0, staleTime: Infinity } } })
}

beforeEach(() => {
  Object.keys(stores).forEach((k) => delete stores[k])
  vi.clearAllMocks()
})

// ── tests ─────────────────────────────────────────────────────────────────────

describe('restoreQueryCache', () => {
  it('does nothing when IDB is empty', async () => {
    const qc = makeClient()
    await restoreQueryCache(qc)
    expect(qc.getQueryCache().getAll()).toHaveLength(0)
  })

  it('does not throw when IDB fails', async () => {
    const { openDB } = await import('idb')
    vi.mocked(openDB).mockRejectedValueOnce(new Error('IDB unavailable'))

    const qc = makeClient()
    await expect(restoreQueryCache(qc)).resolves.toBeUndefined()
  })
})

describe('setupQueryPersistence', () => {
  it('subscribes to query cache changes', () => {
    const qc = makeClient()
    const spy = vi.spyOn(qc.getQueryCache(), 'subscribe')

    setupQueryPersistence(qc)

    expect(spy).toHaveBeenCalledTimes(1)
  })
})
