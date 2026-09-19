import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { offlineSnapshotApi } from '@/api/offlineSnapshotApi'
import type {
  OfflineSnapshot,
  OfflineSnapshotExtras,
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
import { hydrateExtras, hydrateFromSnapshot } from './hydrateFromSnapshot'
import { applyDelta, getSnapshotMeta, saveExtras, saveSnapshot } from './snapshotStore'
import { hydraMember, hydraTotalItems } from './asHydra'
import { collectExtrasPdfs, collectSnapshotDocuments } from './collectSnapshotDocuments'
import { prefetchSnapshotDocuments } from './prefetchSnapshotDocuments'
import {
  PULL_PROGRESS,
  documentsPullPercent,
  estimatedSnapshotBytes,
  modulePullPercent,
  snapshotDownloadPercent,
} from './pullProgress'

export interface PullProgress {
  phase: 'manifest' | 'snapshot' | 'module' | 'persist' | 'documents'
  module?: OfflineSnapshotModule
  page?: number
  loaded?: number
  total?: number
  /** Overall 0–100 progress for the UI bar. */
  percent: number
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
  onProgress: ((p: PullProgress) => void) | undefined,
  module: OfflineSnapshotModule | undefined,
  moduleIndex: number,
  moduleCount: number,
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
        onProgress?.({
          phase: 'module',
          module,
          page,
          loaded: 1,
          total: 1,
          percent: modulePullPercent(moduleIndex, moduleCount, 1, 1),
        })
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
      percent: modulePullPercent(moduleIndex, moduleCount, items.length, total),
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

  for (let i = 0; i < modules.length; i += 1) {
    const module = modules[i]
    const path = ENTITY_MODULE_TO_PATH[module]
    const items = await fetchModulePages(path, since, onProgress, module, i, modules.length)
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

/**
 * Pièces requises des permis, planifications disponibles et liste des PDF générés. Non bloquant : si cet
 * appel échoue, le snapshot principal reste valide (les écrans concernés retombent sur leur cache habituel).
 */
async function pullExtras(queryClient: QueryClient): Promise<OfflineSnapshotExtras | undefined> {
  try {
    const extras = await offlineSnapshotApi.getExtras()
    await saveExtras(extras)
    hydrateExtras(queryClient, extras)
    return extras
  } catch {
    return undefined
  }
}

async function prefetchDocumentsForSnapshot(
  snapshot: OfflineSnapshot,
  extras: OfflineSnapshotExtras | undefined,
  onProgress?: (p: PullProgress) => void,
): Promise<void> {
  const docs = [...collectSnapshotDocuments(snapshot), ...collectExtrasPdfs(extras)]
  // Do not clear the opportunistic cache: docs opened/uploaded earlier must
  // remain readable offline even if this dump prefetch is skipped or partial.
  if (docs.length === 0) {
    onProgress?.({
      phase: 'documents',
      loaded: 0,
      total: 0,
      percent: PULL_PROGRESS.done,
    })
    return
  }
  await prefetchSnapshotDocuments(docs, {
    concurrency: 3,
    onProgress: (p) => {
      onProgress?.({
        phase: 'documents',
        loaded: p.loaded,
        total: p.total,
        percent: documentsPullPercent(p.loaded, p.total),
      })
    },
    fetchBlob: (url) =>
      api.get(url, { responseType: 'blob', _skipOfflineQueue: true }).then((r) => r.data as Blob),
  })
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
  const report = (p: PullProgress) => opts?.onProgress?.(p)
  try {
    report({ phase: 'manifest', percent: 1 })
    let manifest: OfflineSnapshotManifest | undefined
    try {
      manifest = await offlineSnapshotApi.getManifest()
    } catch (err) {
      if (opts?.silent) return fail(err)
      const status = getHttpStatus(err)
      if (status === 403 || status === 429) return fail(err)
      // Manifest is optional if the dump itself works
    }

    report({ phase: 'manifest', percent: PULL_PROGRESS.manifestEnd })

    const modules =
      opts?.modules ??
      (manifest
        ? (Object.keys(manifest.modules) as OfflineSnapshotModule[])
        : [...SNAPSHOT_ENTITY_MODULES, 'referentiel'])

    const estimatedBytes = estimatedSnapshotBytes(manifest?.modules)
    report({
      phase: 'snapshot',
      loaded: 0,
      total: estimatedBytes || undefined,
      percent: PULL_PROGRESS.manifestEnd,
    })

    let snapshot: OfflineSnapshot
    try {
      snapshot = await offlineSnapshotApi.getSnapshot({
        since: opts?.since,
        modules,
        onDownloadProgress: (event) => {
          const total =
            event.total && event.total > 0
              ? event.total
              : estimatedBytes > 0
                ? estimatedBytes
                : 0
          report({
            phase: 'snapshot',
            loaded: event.loaded,
            total: total || undefined,
            percent: snapshotDownloadPercent(event.loaded, total),
          })
        },
      })
    } catch (err) {
      if (getHttpStatus(err) !== 413) return fail(err)
      snapshot = await pullPaginated(modules, opts?.since, opts?.onProgress)
    }

    report({
      phase: 'snapshot',
      loaded: estimatedBytes || undefined,
      total: estimatedBytes || undefined,
      percent: PULL_PROGRESS.snapshotEnd,
    })

    report({ phase: 'persist', percent: PULL_PROGRESS.snapshotEnd + 1 })
    if (incremental) {
      await applyDelta(snapshot)
    } else {
      await saveSnapshot(snapshot)
    }
    hydrateFromSnapshot(queryClient, snapshot)
    const extras = await pullExtras(queryClient)
    report({ phase: 'persist', percent: PULL_PROGRESS.persistEnd })

    if (!opts?.silent) {
      await prefetchDocumentsForSnapshot(snapshot, extras, opts?.onProgress)
    } else {
      report({ phase: 'persist', percent: PULL_PROGRESS.done })
    }

    report({
      phase: opts?.silent ? 'persist' : 'documents',
      percent: PULL_PROGRESS.done,
      loaded: 1,
      total: 1,
    })
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
