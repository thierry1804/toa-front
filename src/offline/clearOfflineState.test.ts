import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockClear, mockClearPersisted, mockClearBlobs } = vi.hoisted(() => ({
  mockClear: vi.fn().mockResolvedValue(undefined),
  mockClearPersisted: vi.fn().mockResolvedValue(undefined),
  mockClearBlobs: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/offline/syncQueue', () => ({
  syncQueue: { clear: mockClear },
}))

vi.mock('@/offline/setupQueryPersistence', () => ({
  clearPersistedQueryCache: mockClearPersisted,
}))

vi.mock('@/offline/blobStore', () => ({
  clearBlobs: mockClearBlobs,
}))

import { clearOfflineState, API_CACHE_NAME, DOC_CACHE_NAME } from './clearOfflineState'

beforeEach(() => {
  vi.clearAllMocks()
  mockClear.mockResolvedValue(undefined)
  mockClearPersisted.mockResolvedValue(undefined)
  mockClearBlobs.mockResolvedValue(undefined)
})

describe('clearOfflineState', () => {
  it('clears sync queue, blobs, query cache and SW caches', async () => {
    const deleteCache = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('caches', { delete: deleteCache })

    await clearOfflineState()

    expect(mockClear).toHaveBeenCalledTimes(1)
    expect(mockClearBlobs).toHaveBeenCalledTimes(1)
    expect(mockClearPersisted).toHaveBeenCalledTimes(1)
    expect(deleteCache).toHaveBeenCalledWith(API_CACHE_NAME)
    expect(deleteCache).toHaveBeenCalledWith(DOC_CACHE_NAME)
  })
})
