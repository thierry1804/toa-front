import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── mock idb before importing syncQueue ──────────────────────────────────────

const stores: Record<string, Map<string, unknown>> = {
  'sync-queue': new Map(),
  'sync-failed': new Map(),
  blobs: new Map(),
}

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: (name: string) => name in stores },
      createObjectStore: vi.fn((name: string) => {
        stores[name] = new Map()
      }),
      add: vi.fn((store: string, item: { id: string }) => {
        stores[store].set(item.id, item)
        return Promise.resolve()
      }),
      getAll: vi.fn((store: string) => Promise.resolve([...stores[store].values()])),
      get: vi.fn((store: string, id: string) => Promise.resolve(stores[store].get(id))),
      put: vi.fn((store: string, item: { id: string }) => {
        stores[store].set(item.id, item)
        return Promise.resolve()
      }),
      delete: vi.fn((store: string, id: string) => {
        stores[store].delete(id)
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

// import after mock setup
import { syncQueue } from './syncQueue'

// ── tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  stores['sync-queue'] = new Map()
  stores['sync-failed'] = new Map()
  stores.blobs = new Map()
})

describe('syncQueue', () => {
  it('add stores item with generated id and retries=0', async () => {
    await syncQueue.add({ url: '/api/test', method: 'POST', body: { x: 1 } })

    const items = await syncQueue.getAll()
    expect(items).toHaveLength(1)
    expect(items[0].url).toBe('/api/test')
    expect(items[0].method).toBe('POST')
    expect(items[0].retries).toBe(0)
    expect(typeof items[0].id).toBe('string')
    expect(items[0].id.length).toBeGreaterThan(0)
  })

  it('add stores createdAt timestamp', async () => {
    const before = Date.now()
    await syncQueue.add({ url: '/api/t', method: 'PUT' })
    const after = Date.now()

    const [item] = await syncQueue.getAll()
    expect(item.createdAt).toBeGreaterThanOrEqual(before)
    expect(item.createdAt).toBeLessThanOrEqual(after)
  })

  it('remove deletes item by id', async () => {
    await syncQueue.add({ url: '/api/a', method: 'POST' })
    const [item] = await syncQueue.getAll()

    await syncQueue.remove(item.id)

    expect(await syncQueue.getAll()).toHaveLength(0)
  })

  it('incrementRetries bumps retries by 1', async () => {
    await syncQueue.add({ url: '/api/b', method: 'PUT', body: {} })
    const [item] = await syncQueue.getAll()

    await syncQueue.incrementRetries(item.id)
    const [updated] = await syncQueue.getAll()

    expect(updated.retries).toBe(1)
  })

  it('incrementRetries accumulates across calls', async () => {
    await syncQueue.add({ url: '/api/c', method: 'PATCH' })
    const [item] = await syncQueue.getAll()

    await syncQueue.incrementRetries(item.id)
    await syncQueue.incrementRetries(item.id)
    const [updated] = await syncQueue.getAll()

    expect(updated.retries).toBe(2)
  })

  it('clear empties the store', async () => {
    await syncQueue.add({ url: '/api/d', method: 'DELETE' })
    await syncQueue.add({ url: '/api/e', method: 'POST' })

    await syncQueue.clear()

    expect(await syncQueue.getAll()).toHaveLength(0)
  })

  it('clear also empties the failed store', async () => {
    await syncQueue.add({ url: '/api/drop', method: 'POST' })
    const [item] = await syncQueue.getAll()
    await syncQueue.moveToFailed(item.id)
    expect(await syncQueue.getFailed()).toHaveLength(1)

    await syncQueue.clear()

    expect(await syncQueue.getFailed()).toHaveLength(0)
  })

  it('stores multiple items independently', async () => {
    await syncQueue.add({ url: '/api/f', method: 'POST' })
    await syncQueue.add({ url: '/api/g', method: 'PATCH', body: { y: 2 } })

    const items = await syncQueue.getAll()
    expect(items).toHaveLength(2)
    expect(items.map((i) => i.url)).toContain('/api/f')
    expect(items.map((i) => i.url)).toContain('/api/g')
  })

  it('items have unique ids', async () => {
    await syncQueue.add({ url: '/api/h', method: 'POST' })
    await syncQueue.add({ url: '/api/i', method: 'POST' })

    const items = await syncQueue.getAll()
    expect(items[0].id).not.toBe(items[1].id)
  })

  it('getAll returns items sorted by createdAt ascending', async () => {
    await syncQueue.add({ url: '/api/first', method: 'POST' })
    await syncQueue.add({ url: '/api/second', method: 'POST' })

    const stored = [...stores['sync-queue'].values()] as Array<{ url: string; createdAt: number }>
    const first = stored.find((i) => i.url === '/api/first')!
    const second = stored.find((i) => i.url === '/api/second')!
    first.createdAt = 200
    second.createdAt = 100

    const ordered = await syncQueue.getAll()
    expect(ordered.map((i) => i.url)).toEqual(['/api/second', '/api/first'])
  })

  it('moveToFailed relocates item out of the queue', async () => {
    await syncQueue.add({ url: '/api/drop', method: 'POST' })
    const [item] = await syncQueue.getAll()

    await syncQueue.moveToFailed(item.id)

    expect(await syncQueue.getAll()).toHaveLength(0)
    expect(await syncQueue.getFailed()).toHaveLength(1)
    expect((await syncQueue.getFailed())[0].url).toBe('/api/drop')
  })

  it('requeueFailed returns 0 when the failed store is empty', async () => {
    expect(await syncQueue.requeueFailed()).toBe(0)
    expect(await syncQueue.getAll()).toHaveLength(0)
  })

  it('requeueFailed moves failed items back to the queue with retries=0', async () => {
    await syncQueue.add({ url: '/api/a', method: 'POST' })
    await syncQueue.add({ url: '/api/b', method: 'PATCH' })
    const [a, b] = await syncQueue.getAll()
    await syncQueue.incrementRetries(a.id)
    await syncQueue.moveToFailed(a.id)
    await syncQueue.moveToFailed(b.id)

    const moved = await syncQueue.requeueFailed()

    expect(moved).toBe(2)
    expect(await syncQueue.getFailed()).toHaveLength(0)
    const queued = await syncQueue.getAll()
    expect(queued).toHaveLength(2)
    expect(queued.every((item) => item.retries === 0)).toBe(true)
    expect(queued.map((item) => item.url).sort()).toEqual(['/api/a', '/api/b'])
  })
})
