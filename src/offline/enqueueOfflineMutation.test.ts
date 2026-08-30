import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockAddToast, mockIngest } = vi.hoisted(() => ({
  mockAddToast: vi.fn(),
  mockIngest: vi.fn(),
}))

vi.mock('@/offline/syncQueue', () => ({
  syncQueue: {
    add: vi.fn().mockResolvedValue('id-1'),
  },
}))

vi.mock('@/offline/blobStore', () => ({
  ingestFormData: mockIngest,
}))

vi.mock('@/store/ui.store', () => ({
  useUiStore: {
    getState: () => ({ addToast: mockAddToast }),
  },
}))

vi.mock('@/lib/i18n', () => ({
  default: { t: (_key: string, fallback?: string) => fallback ?? _key },
}))

import { enqueueOfflineMutation } from './enqueueOfflineMutation'
import { syncQueue } from '@/offline/syncQueue'

const mockAdd = vi.mocked(syncQueue.add)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('enqueueOfflineMutation', () => {
  it('does not enqueue when _skipOfflineQueue is set', async () => {
    const result = await enqueueOfflineMutation({
      method: 'POST',
      url: '/api/x',
      data: { a: 1 },
      _skipOfflineQueue: true,
    })

    expect(result).toBe('skipped')
    expect(mockAdd).not.toHaveBeenCalled()
    expect(mockIngest).not.toHaveBeenCalled()
  })

  it('does not ingest FormData when _skipOfflineQueue is set', async () => {
    const form = new FormData()
    form.append('file', new File(['x'], 'a.jpg', { type: 'image/jpeg' }))

    const result = await enqueueOfflineMutation({
      method: 'POST',
      url: '/api/docs',
      data: form,
      _skipOfflineQueue: true,
    })

    expect(result).toBe('skipped')
    expect(mockIngest).not.toHaveBeenCalled()
    expect(mockAdd).not.toHaveBeenCalled()
  })

  it('enqueues FormData as formParts when ingest succeeds', async () => {
    mockIngest.mockResolvedValue({
      ok: true,
      formParts: [
        { name: 'type', kind: 'text', value: 'PV' },
        { name: 'file', kind: 'file', blobId: 'b1', filename: 'a.jpg', mimeType: 'image/jpeg' },
      ],
    })
    const form = new FormData()
    form.append('file', new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    form.append('type', 'PV')

    const result = await enqueueOfflineMutation({
      method: 'POST',
      url: '/api/permits-travail/1/documents',
      data: form,
    })

    expect(result).toBe('queued')
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: '/api/permits-travail/1/documents',
        formParts: expect.arrayContaining([
          expect.objectContaining({ name: 'file', kind: 'file', blobId: 'b1' }),
        ]),
      }),
    )
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'warning' }),
    )
  })

  it('returns quota and does not enqueue when ingest fails', async () => {
    mockIngest.mockResolvedValue({ ok: false, reason: 'quota' })
    const form = new FormData()
    form.append('file', new File(['x'], 'big.pdf', { type: 'application/pdf' }))

    const result = await enqueueOfflineMutation({
      method: 'POST',
      url: '/api/docs',
      data: form,
    })

    expect(result).toBe('quota')
    expect(mockAdd).not.toHaveBeenCalled()
    expect(mockAddToast).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' }),
    )
  })

  it('enqueues JSON mutations', async () => {
    const result = await enqueueOfflineMutation({
      method: 'PATCH',
      url: '/api/permits',
      data: { name: 'PT' },
    })

    expect(result).toBe('queued')
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PATCH',
        url: '/api/permits',
        body: { name: 'PT' },
      }),
    )
  })
})
