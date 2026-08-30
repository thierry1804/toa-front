import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/offline/syncQueue', () => ({
  syncQueue: {
    requeueFailed: vi.fn(),
  },
}))

vi.mock('./drainSyncQueue', () => ({
  drainSyncQueue: vi.fn(),
}))

vi.mock('./pullOfflineSnapshot', () => ({
  maybePullIncremental: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/i18n', () => ({
  default: { t: (key: string) => key },
}))

import { retryFailedSync } from './retryFailedSync'
import { syncQueue } from '@/offline/syncQueue'
import { drainSyncQueue } from './drainSyncQueue'
import { maybePullIncremental } from './pullOfflineSnapshot'
import { getSyncing, resetSyncingForTests, setSyncing } from './syncStatus'

const mockRequeue = vi.mocked(syncQueue.requeueFailed)
const mockDrain = vi.mocked(drainSyncQueue)
const mockPull = vi.mocked(maybePullIncremental)

const queryClient = { invalidateQueries: vi.fn() } as unknown as import('@tanstack/react-query').QueryClient
const addToast = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  resetSyncingForTests()
})

describe('retryFailedSync', () => {
  it('does nothing when already syncing', async () => {
    setSyncing(true)

    const synced = await retryFailedSync(queryClient, addToast)

    expect(synced).toBe(0)
    expect(mockRequeue).not.toHaveBeenCalled()
    expect(mockDrain).not.toHaveBeenCalled()
  })

  it('returns 0 without draining when there is nothing to requeue', async () => {
    mockRequeue.mockResolvedValue(0)

    const synced = await retryFailedSync(queryClient, addToast)

    expect(synced).toBe(0)
    expect(mockDrain).not.toHaveBeenCalled()
    expect(getSyncing()).toBe(false)
  })

  it('requeues, drains, toasts, and pulls incremental', async () => {
    mockRequeue.mockResolvedValue(2)
    mockDrain.mockResolvedValue(2)

    const synced = await retryFailedSync(queryClient, addToast)

    expect(synced).toBe(2)
    expect(mockDrain).toHaveBeenCalledWith(queryClient, addToast)
    expect(addToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'success' }),
    )
    expect(mockPull).toHaveBeenCalledWith(queryClient)
    expect(getSyncing()).toBe(false)
  })
})
