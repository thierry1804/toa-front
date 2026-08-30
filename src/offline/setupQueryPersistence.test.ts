import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, dehydrate } from '@tanstack/react-query'

type Store = Map<unknown, unknown>
const stores: Record<string, Store> = {}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => {
        stores[name] = new Map()
      }),
      get: vi.fn((store: string, key: unknown) =>
        Promise.resolve(stores[store]?.get(key)),
      ),
      put: vi.fn((store: string, val: unknown, key: unknown) => {
        stores[store].set(key, val)
        return Promise.resolve()
      }),
      delete: vi.fn((store: string, key: unknown) => {
        stores[store].delete(key)
        return Promise.resolve()
      }),
      clear: vi.fn((store: string) => {
        stores[store].clear()
        return Promise.resolve()
      }),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

import { restoreQueryCache, setupQueryPersistence, clearPersistedQueryCache } from './setupQueryPersistence'

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0, staleTime: Infinity } } })
}

function fakeJwt(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  const b64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `aaa.${b64}.bbb`
}

beforeEach(() => {
  Object.keys(stores).forEach((k) => delete stores[k])
  localStorage.clear()
  vi.clearAllMocks()
})

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

  it('does not hydrate when cached userId differs from current user', async () => {
    localStorage.setItem('access_token', fakeJwt({ id: 'user-a' }))
    const source = makeClient()
    source.setQueryData(['secret'], { value: 1 })
    stores['rq-persist'] = new Map()
    stores['rq-persist'].set('state', {
      timestamp: Date.now(),
      userId: 'user-b',
      state: dehydrate(source),
    })

    const qc = makeClient()
    await restoreQueryCache(qc)

    expect(qc.getQueryData(['secret'])).toBeUndefined()
  })

  it('hydrates when cached userId matches current user', async () => {
    localStorage.setItem('access_token', fakeJwt({ id: 'user-a' }))
    const source = makeClient()
    source.setQueryData(['secret'], { value: 1 })
    stores['rq-persist'] = new Map()
    stores['rq-persist'].set('state', {
      timestamp: Date.now(),
      userId: 'user-a',
      state: dehydrate(source),
    })

    const qc = makeClient()
    await restoreQueryCache(qc)

    expect(qc.getQueryData(['secret'])).toEqual({ value: 1 })
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

describe('clearPersistedQueryCache', () => {
  it('clears the persist store', async () => {
    stores['rq-persist'] = new Map()
    stores['rq-persist'].set('state', { timestamp: Date.now(), userId: 'x', state: {} })

    await clearPersistedQueryCache()

    expect(stores['rq-persist'].size).toBe(0)
  })
})
