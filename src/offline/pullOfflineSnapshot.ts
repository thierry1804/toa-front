import type { QueryClient } from '@tanstack/react-query'
import { offlineSnapshotApi } from '@/api/offlineSnapshotApi'
import type {
  OfflineSnapshot,
  OfflineSnapshotManifest,
  OfflineSnapshotModule,
  OfflineSnapshotPathModule,
  SnapshotPullErrorCode,
} from '@/types/offlineSnapshot'
import {
  ENTITY_MODULE_TO_PATH,
  SNAPSHOT_ENTITY_MODULES,
} from '@/types/offlineSnapshot'
import { getHttpStatus, snapshotErrorCode } from './getHttpStatus'
import { hydrateFromSnapshot } from './hydrateFromSnapshot'
import { applyDelta, getSnapshotMeta, saveSnapshot } from './snapshotStore'
import { hydraMember, hydraTotalItems } from './asHydra'

export interface PullProgress {
  phase: 'manifest' | 'snapshot' | 'module'
  module?: OfflineSnapshotModule
  page?: number
  loaded?: number
  total?: number
}

export type PullSnapshotResult =
  | { ok: true; generatedAt: string; incremental: boolean }
  | { ok: false; code: SnapshotPullErrorCode }

const MODULE_PAGE_SIZE = 100

function fail(err: unknown): PullSnapshotResult {
  return { ok: false, code: snapshotErrorCode(err) }
}

async function fetchModulePages(
  path: OfflineSnapshotPathModule,
  since: string | undefined,
  onProgress?: (p: PullProgress) => void,
  module?: OfflineSnapshotModule,
): Promise<unknown[]> {
  const items: unknown[] = []
  let page = 1
  while (true) {
    const data = await offlineSnapshotApi.getSnapshotModule(path, {
      page,
      itemsPerPage: MODULE_PAGE_SIZE,
      since,
    })
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const record = data as Record<string, unknown>
      if (Array.isArray(record.categoriesRisque) || Array.isArray(record.installationsEquipements)) {
        return [data]
      }
    }
    const member = hydraMember(data)
    items.push(...member)
    const total = hydraTotalItems(data, items.length)
    onProgress?.({
      phase: 'module',
      module,
      page,
      loaded: items.length,
      total,
    })
    if (member.length === 0 || items.length >= total || member.length < MODULE_PAGE_SIZE) break
    page += 1
  }
  return items
}

async function pullPaginated(
  modules: OfflineSnapshotModule[],
  since: string | undefined,
  onProgress?: (p: PullProgress) => void,
): Promise<OfflineSnapshot> {
  const snapshot: OfflineSnapshot = {
    generatedAt: new Date().toISOString(),
    userId: '',
    since: since ?? null,
  }

  for (const module of modules) {
    const path = ENTITY_MODULE_TO_PATH[module]
    const items = await fetchModulePages(path, since, onProgress, module)
    if (module === 'referentiel') {
      const first = items[0]
      if (first && typeof first === 'object') {
        snapshot.referentiel = first as OfflineSnapshot['referentiel']
      }
      continue
    }
    snapshot[module] = items
  }

  return snapshot
}

export async function pullOfflineSnapshot(
  queryClient: QueryClient,
  opts?: {
    since?: string
    modules?: OfflineSnapshotModule[]
    silent?: boolean
    onProgress?: (p: PullProgress) => void
  },
): Promise<PullSnapshotResult> {
  const incremental = Boolean(opts?.since)
  try {
    opts?.onProgress?.({ phase: 'manifest' })
    let manifest: OfflineSnapshotManifest | undefined
    try {
      manifest = await offlineSnapshotApi.getManifest()
    } catch (err) {
      if (opts?.silent) return fail(err)
      const status = getHttpStatus(err)
      if (status === 403 || status === 429) return fail(err)
      // Manifest is optional if the dump itself works
    }

    const modules =
      opts?.modules ??
      (manifest
        ? (Object.keys(manifest.modules) as OfflineSnapshotModule[])
        : [...SNAPSHOT_ENTITY_MODULES, 'referentiel'])

    opts?.onProgress?.({ phase: 'snapshot' })
    let snapshot: OfflineSnapshot
    try {
      snapshot = await offlineSnapshotApi.getSnapshot({
        since: opts?.since,
        modules,
      })
    } catch (err) {
      if (getHttpStatus(err) !== 413) return fail(err)
      snapshot = await pullPaginated(modules, opts?.since, opts?.onProgress)
    }

    if (incremental) {
      await applyDelta(snapshot)
    } else {
      await saveSnapshot(snapshot)
    }
    hydrateFromSnapshot(queryClient, snapshot)
    return { ok: true, generatedAt: snapshot.generatedAt, incremental }
  } catch (err) {
    if (opts?.silent) return fail(err)
    return fail(err)
  }
}

export async function maybePullIncremental(queryClient: QueryClient): Promise<void> {
  const meta = await getSnapshotMeta()
  if (!meta?.generatedAt) return
  await pullOfflineSnapshot(queryClient, { since: meta.generatedAt, silent: true })
}
