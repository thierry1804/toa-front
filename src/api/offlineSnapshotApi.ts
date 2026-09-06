import api from '@/lib/axios'
import type { AxiosRequestConfig } from 'axios'
import type {
  OfflineSnapshot,
  OfflineSnapshotManifest,
  OfflineSnapshotPathModule,
} from '@/types/offlineSnapshot'

export const SNAPSHOT_MANIFEST_PATH = '/api/offline/snapshot/manifest'
export const SNAPSHOT_PATH = '/api/offline/snapshot'

export function snapshotModulePath(module: OfflineSnapshotPathModule): string {
  return `/api/offline/snapshot/${module}`
}

export const offlineSnapshotApi = {
  getManifest: () =>
    api.get<OfflineSnapshotManifest>(SNAPSHOT_MANIFEST_PATH).then((r) => r.data),

  getSnapshot: (opts?: {
    since?: string
    modules?: string[]
    onDownloadProgress?: AxiosRequestConfig['onDownloadProgress']
  }) => {
    const params: Record<string, string> = {}
    if (opts?.since) params.since = opts.since
    if (opts?.modules?.length) params.modules = opts.modules.join(',')
    return api
      .get<OfflineSnapshot>(SNAPSHOT_PATH, {
        params,
        onDownloadProgress: opts?.onDownloadProgress,
      })
      .then((r) => r.data)
  },

  getSnapshotModule: (
    module: OfflineSnapshotPathModule,
    opts?: { page?: number; itemsPerPage?: number; since?: string },
  ) => {
    const params: Record<string, string | number> = {
      page: opts?.page ?? 1,
      itemsPerPage: opts?.itemsPerPage ?? 100,
    }
    if (opts?.since) params.since = opts.since
    return api.get(snapshotModulePath(module), { params }).then((r) => r.data)
  },
}
