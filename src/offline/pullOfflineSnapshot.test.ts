import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'

const { mockGetManifest, mockGetSnapshot, mockGetSnapshotModule, mockSave, mockDelta, mockHydrate } =
  vi.hoisted(() => ({
    mockGetManifest: vi.fn(),
    mockGetSnapshot: vi.fn(),
    mockGetSnapshotModule: vi.fn(),
    mockSave: vi.fn().mockResolvedValue(undefined),
    mockDelta: vi.fn().mockResolvedValue(undefined),
    mockHydrate: vi.fn(),
  }))

vi.mock('@/api/offlineSnapshotApi', () => ({
  offlineSnapshotApi: {
    getManifest: mockGetManifest,
    getSnapshot: mockGetSnapshot,
    getSnapshotModule: mockGetSnapshotModule,
  },
}))

vi.mock('./snapshotStore', () => ({
  saveSnapshot: mockSave,
  applyDelta: mockDelta,
  getSnapshotMeta: vi.fn(),
}))

vi.mock('./hydrateFromSnapshot', () => ({
  hydrateFromSnapshot: mockHydrate,
}))

import { pullOfflineSnapshot } from './pullOfflineSnapshot'
import { getSnapshotMeta } from './snapshotStore'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } })

beforeEach(() => {
  vi.clearAllMocks()
  mockSave.mockResolvedValue(undefined)
  mockDelta.mockResolvedValue(undefined)
})

describe('pullOfflineSnapshot', () => {
  it('saves a full JSON dump and hydrates React Query', async () => {
    const snapshot = {
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      permitsTravail: [{ id: 'p1' }],
    }
    mockGetManifest.mockResolvedValue({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      modules: { permitsTravail: { count: 1, estimatedBytes: 10 } },
    })
    mockGetSnapshot.mockResolvedValue(snapshot)

    const result = await pullOfflineSnapshot(qc)

    expect(result).toEqual({ ok: true, generatedAt: '2026-08-30T12:00:00Z', incremental: false })
    expect(mockSave).toHaveBeenCalledWith(snapshot)
    expect(mockDelta).not.toHaveBeenCalled()
    expect(mockHydrate).toHaveBeenCalledWith(qc, snapshot)
  })

  it('uses applyDelta when since is set', async () => {
    const snapshot = { generatedAt: '2026-08-30T13:00:00Z', userId: 1, since: 'prev' }
    mockGetManifest.mockResolvedValue({ generatedAt: '', userId: 1, modules: {} })
    mockGetSnapshot.mockResolvedValue(snapshot)

    const result = await pullOfflineSnapshot(qc, { since: 'prev' })

    expect(result.ok).toBe(true)
    expect(mockDelta).toHaveBeenCalledWith(snapshot)
    expect(mockSave).not.toHaveBeenCalled()
  })

  it('falls back to paginated modules on 413', async () => {
    mockGetManifest.mockResolvedValue({
      generatedAt: '2026-08-30T12:00:00Z',
      userId: 1,
      modules: { permitsTravail: { count: 2, estimatedBytes: 10 } },
    })
    mockGetSnapshot.mockRejectedValue({ response: { status: 413 } })
    mockGetSnapshotModule.mockResolvedValue({
      member: [{ id: 'p1' }, { id: 'p2' }],
      totalItems: 2,
    })

    const result = await pullOfflineSnapshot(qc)

    expect(result.ok).toBe(true)
    expect(mockGetSnapshotModule).toHaveBeenCalledWith(
      'permits-travail',
      expect.objectContaining({ page: 1, itemsPerPage: 100 }),
    )
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        permitsTravail: [{ id: 'p1' }, { id: 'p2' }],
      }),
    )
  })

  it('returns forbidden on 403', async () => {
    mockGetManifest.mockRejectedValue({ response: { status: 403 } })

    const result = await pullOfflineSnapshot(qc)

    expect(result).toEqual({ ok: false, code: 'forbidden' })
    expect(mockGetSnapshot).not.toHaveBeenCalled()
  })

  it('returns rateLimited on 429', async () => {
    mockGetManifest.mockRejectedValue({ response: { status: 429 } })

    const result = await pullOfflineSnapshot(qc)

    expect(result).toEqual({ ok: false, code: 'rateLimited' })
  })
})

describe('maybePullIncremental', () => {
  it('no-ops without a local snapshot', async () => {
    vi.mocked(getSnapshotMeta).mockResolvedValue(null)
    const { maybePullIncremental } = await import('./pullOfflineSnapshot')
    await maybePullIncremental(qc)
    expect(mockGetSnapshot).not.toHaveBeenCalled()
  })
})
