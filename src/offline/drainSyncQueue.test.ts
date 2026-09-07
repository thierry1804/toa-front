import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/offline/syncQueue', () => ({
  syncQueue: {
    getAll:            vi.fn(),
    remove:            vi.fn(),
    incrementRetries:  vi.fn(),
    moveToFailed:      vi.fn(),
  },
}))

vi.mock('@/offline/blobStore', () => ({
  rebuildFormData: vi.fn(),
  deleteBlobsForParts: vi.fn().mockResolvedValue(undefined),
  getBlob: vi.fn(),
}))

vi.mock('@/offline/docCache', () => ({
  putCachedDocument: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/axios', () => ({
  default: vi.fn(),
}))

import { drainSyncQueue } from './drainSyncQueue'
import { syncQueue } from '@/offline/syncQueue'
import api from '@/lib/axios'
import { rebuildFormData, deleteBlobsForParts, getBlob } from '@/offline/blobStore'
import { putCachedDocument } from '@/offline/docCache'

type SyncItem = {
  id: string
  url: string
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  formParts?: Array<{ name: string; kind: 'file' | 'text'; blobId?: string; value?: string; filename?: string }>
  createdAt: number
  retries: number
}

const mockApi              = vi.mocked(api as unknown as (c: unknown) => Promise<unknown>)
const mockGetAll           = vi.mocked(syncQueue.getAll)
const mockRemove           = vi.mocked(syncQueue.remove)
const mockIncrementRetries = vi.mocked(syncQueue.incrementRetries)
const mockMoveToFailed     = vi.mocked(syncQueue.moveToFailed)

const queryClient = { invalidateQueries: vi.fn() } as unknown as import('@tanstack/react-query').QueryClient
const addToast    = vi.fn()

function item(overrides: Partial<SyncItem> = {}): SyncItem {
  return { id: 'id-1', url: '/api/x', method: 'POST', body: {}, createdAt: 0, retries: 0, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRemove.mockResolvedValue(undefined)
  mockIncrementRetries.mockResolvedValue(1)
  mockMoveToFailed.mockResolvedValue(undefined)
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

    expect(mockApi).toHaveBeenCalledWith({
      method: 'POST',
      url: '/api/permits',
      data: { name: 'PT-1' },
      _skipOfflineQueue: true,
    })
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

  it('moves item to failed store after max retries instead of removing', async () => {
    mockGetAll.mockResolvedValue([item({ id: 'drop-me' })])
    mockApi.mockRejectedValue(new Error('network'))
    mockIncrementRetries.mockResolvedValue(5)

    const synced = await drainSyncQueue(queryClient, addToast)

    expect(mockMoveToFailed).toHaveBeenCalledWith('drop-me')
    expect(mockRemove).not.toHaveBeenCalled()
    expect(synced).toBe(0)
    expect(addToast).toHaveBeenCalled()
  })

  it('rebuilds FormData from formParts and deletes blobs on success', async () => {
    const form = new FormData()
    form.append('file', new File(['x'], 'a.jpg'))
    form.append('type', 'PV')
    vi.mocked(rebuildFormData).mockResolvedValue(form)

    const queued = item({
      id: 'doc-1',
      url: '/api/permits-travail/1/documents',
      formParts: [
        { name: 'type', kind: 'text', value: 'PV' },
        { name: 'file', kind: 'file', blobId: 'b1', filename: 'a.jpg' },
      ],
    })
    mockGetAll.mockResolvedValue([queued])
    mockApi.mockResolvedValue({})

    await drainSyncQueue(queryClient, addToast)

    expect(rebuildFormData).toHaveBeenCalled()
    expect(mockApi).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/permits-travail/1/documents',
        _skipOfflineQueue: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    )
    expect(deleteBlobsForParts).toHaveBeenCalledWith(queued.formParts)
    expect(mockRemove).toHaveBeenCalledWith('doc-1')
  })

  it('seeds doc-cache from the local blob before deleting it', async () => {
    const form = new FormData()
    vi.mocked(rebuildFormData).mockResolvedValue(form)
    vi.mocked(getBlob).mockResolvedValue({
      blob: new Blob(['img'], { type: 'image/jpeg' }),
      filename: 'a.jpg',
      mimeType: 'image/jpeg',
      size: 3,
      id: 'b1',
    })

    const queued = item({
      id: 'doc-1',
      url: '/api/permits-travail/1/documents',
      formParts: [
        { name: 'type', kind: 'text', value: 'PV' },
        { name: 'file', kind: 'file', blobId: 'b1', filename: 'a.jpg' },
      ],
    })
    mockGetAll.mockResolvedValue([queued])
    mockApi.mockResolvedValue({ data: { id: 'doc-99' } })

    await drainSyncQueue(queryClient, addToast)

    expect(putCachedDocument).toHaveBeenCalledWith(
      '/api/permits-travail/1/documents/doc-99/download',
      expect.any(Blob),
      'a.jpg',
    )
    expect(deleteBlobsForParts).toHaveBeenCalledWith(queued.formParts)
  })
})
