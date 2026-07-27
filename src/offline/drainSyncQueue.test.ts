import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/offline/syncQueue', () => ({
  syncQueue: {
    getAll:            vi.fn(),
    remove:            vi.fn(),
    incrementRetries:  vi.fn(),
  },
}))

vi.mock('@/lib/axios', () => ({
  default: vi.fn(),
}))

import { drainSyncQueue } from './drainSyncQueue'
import { syncQueue } from '@/offline/syncQueue'
import api from '@/lib/axios'

type SyncItem = {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  createdAt: number
  retries: number
}

const mockApi              = vi.mocked(api as unknown as (c: unknown) => Promise<unknown>)
const mockGetAll           = vi.mocked(syncQueue.getAll)
const mockRemove           = vi.mocked(syncQueue.remove)
const mockIncrementRetries = vi.mocked(syncQueue.incrementRetries)

const queryClient = { invalidateQueries: vi.fn() } as unknown as import('@tanstack/react-query').QueryClient
const addToast    = vi.fn()

function item(overrides: Partial<SyncItem> = {}): SyncItem {
  return { id: 'id-1', url: '/api/x', method: 'POST', body: {}, createdAt: 0, retries: 0, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRemove.mockResolvedValue(undefined)
  mockIncrementRetries.mockResolvedValue(undefined)
})

describe('drainSyncQueue', () => {
  it('returns 0 and does not invalidate when queue is empty', async () => {
    mockGetAll.mockResolvedValue([])

    const synced = await drainSyncQueue(queryClient, addToast)

    expect(synced).toBe(0)
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })

  it('replays request with correct method/url/data', async () => {
    mockGetAll.mockResolvedValue([item({ url: '/api/permits', method: 'POST', body: { name: 'PT-1' } })])
    mockApi.mockResolvedValue({})

    await drainSyncQueue(queryClient, addToast)

    expect(mockApi).toHaveBeenCalledWith({ method: 'POST', url: '/api/permits', data: { name: 'PT-1' } })
  })

  it('removes item and counts it on success', async () => {
    mockGetAll.mockResolvedValue([item({ id: 'abc' })])
    mockApi.mockResolvedValue({})

    const synced = await drainSyncQueue(queryClient, addToast)

    expect(mockRemove).toHaveBeenCalledWith('abc')
    expect(synced).toBe(1)
  })

  it('invalidates queries after at least one success', async () => {
    mockGetAll.mockResolvedValue([item()])
    mockApi.mockResolvedValue({})

    await drainSyncQueue(queryClient, addToast)

    expect(queryClient.invalidateQueries).toHaveBeenCalled()
  })

  it('increments retries on failure and does not remove', async () => {
    mockGetAll.mockResolvedValue([item({ id: 'xyz' })])
    mockApi.mockRejectedValue(new Error('network'))

    const synced = await drainSyncQueue(queryClient, addToast)

    expect(mockIncrementRetries).toHaveBeenCalledWith('xyz')
    expect(mockRemove).not.toHaveBeenCalled()
    expect(synced).toBe(0)
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled()
  })

  it('processes all items: removes successful, increments failed', async () => {
    const ok   = item({ id: '1', url: '/api/ok',  method: 'POST' })
    const fail = item({ id: '2', url: '/api/bad', method: 'PUT'  })
    mockGetAll.mockResolvedValue([ok, fail])
    mockApi
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('fail'))

    const synced = await drainSyncQueue(queryClient, addToast)

    expect(mockRemove).toHaveBeenCalledWith('1')
    expect(mockIncrementRetries).toHaveBeenCalledWith('2')
    expect(synced).toBe(1)
  })
})
