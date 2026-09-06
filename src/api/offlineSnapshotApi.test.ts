import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('@/lib/axios', () => ({
  default: { get: mockGet },
}))

import { offlineSnapshotApi, SNAPSHOT_MANIFEST_PATH, SNAPSHOT_PATH } from './offlineSnapshotApi'

beforeEach(() => {
  vi.clearAllMocks()
  mockGet.mockResolvedValue({ data: {} })
})

describe('offlineSnapshotApi', () => {
  it('GET manifest without query params', async () => {
    mockGet.mockResolvedValue({ data: { generatedAt: '2026-01-01T00:00:00Z', userId: 1, modules: {} } })

    await offlineSnapshotApi.getManifest()

    expect(mockGet).toHaveBeenCalledWith(SNAPSHOT_MANIFEST_PATH)
  })

  it('GET snapshot without since or modules', async () => {
    await offlineSnapshotApi.getSnapshot()

    expect(mockGet).toHaveBeenCalledWith(SNAPSHOT_PATH, {
      params: {},
      onDownloadProgress: undefined,
    })
  })

  it('passes since and modules as CSV', async () => {
    await offlineSnapshotApi.getSnapshot({
      since: '2026-08-01T00:00:00Z',
      modules: ['plansPrevention', 'permitsTravail'],
    })

    expect(mockGet).toHaveBeenCalledWith(SNAPSHOT_PATH, {
      params: {
        since: '2026-08-01T00:00:00Z',
        modules: 'plansPrevention,permitsTravail',
      },
      onDownloadProgress: undefined,
    })
  })

  it('forwards onDownloadProgress to axios', async () => {
    const onDownloadProgress = vi.fn()
    await offlineSnapshotApi.getSnapshot({ onDownloadProgress })

    expect(mockGet).toHaveBeenCalledWith(SNAPSHOT_PATH, {
      params: {},
      onDownloadProgress,
    })
  })

  it('GET paginated module with page and itemsPerPage', async () => {
    await offlineSnapshotApi.getSnapshotModule('permits-travail', {
      page: 2,
      itemsPerPage: 50,
      since: '2026-08-01T00:00:00Z',
    })

    expect(mockGet).toHaveBeenCalledWith('/api/offline/snapshot/permits-travail', {
      params: {
        page: 2,
        itemsPerPage: 50,
        since: '2026-08-01T00:00:00Z',
      },
    })
  })
})
