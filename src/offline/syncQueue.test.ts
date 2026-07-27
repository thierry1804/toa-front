import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── mock idb before importing syncQueue ──────────────────────────────────────

const mockStore = new Map<string, unknown>()

vi.mock('idb', () => ({
  openDB: vi.fn((_, __, opts?: { upgrade?: (db: unknown) => void }) => {
    const db = {
      objectStoreNames: { contains: () => false },
      createObjectStore: vi.fn(),
      add:    vi.fn((_, item: { id: string }) => { mockStore.set(item.id, item); return Promise.resolve() }),
      getAll: vi.fn(() => Promise.resolve([...mockStore.values()])),
      get:    vi.fn((_, id: string) => Promise.resolve(mockStore.get(id))),
      put:    vi.fn((_, item: { id: string }) => { mockStore.set(item.id, item); return Promise.resolve() }),
      delete: vi.fn((_, id: string) => { mockStore.delete(id); return Promise.resolve() }),
      clear:  vi.fn(() => { mockStore.clear(); return Promise.resolve() }),
    }
    opts?.upgrade?.(db)
    return Promise.resolve(db)
  }),
}))

// import after mock setup
import { syncQueue } from './syncQueue'

// ── tests ────────────────────────────────────────────────────────────────────

beforeEach(() => mockStore.clear())

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
})
