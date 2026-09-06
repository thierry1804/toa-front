import { putCachedDocument } from './docCache'
import type { SnapshotDocRef } from './collectSnapshotDocuments'

export type DocumentPrefetchProgress = {
  phase: 'documents'
  loaded: number
  total: number
}

export type PrefetchDocumentsResult = {
  total: number
  cached: number
  skipped: number
  failed: number
}

type PrefetchOptions = {
  fetchBlob: (url: string) => Promise<Blob>
  putCachedDocument?: typeof putCachedDocument
  onProgress?: (progress: DocumentPrefetchProgress) => void
  concurrency?: number
}

async function mapPool<T>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (next < items.length) {
      const index = next
      next += 1
      await worker(items[index], index)
    }
  })
  await Promise.all(runners)
}

export async function prefetchSnapshotDocuments(
  docs: SnapshotDocRef[],
  opts: PrefetchOptions,
): Promise<PrefetchDocumentsResult> {
  const put = opts.putCachedDocument ?? putCachedDocument
  const concurrency = opts.concurrency ?? 3
  const total = docs.length
  let cached = 0
  let skipped = 0
  let failed = 0
  let loaded = 0

  opts.onProgress?.({ phase: 'documents', loaded: 0, total })

  await mapPool(docs, concurrency, async (doc) => {
    try {
      const blob = await opts.fetchBlob(doc.url)
      const ok = await put(doc.url, blob, doc.filename)
      if (ok) cached += 1
      else skipped += 1
    } catch {
      failed += 1
    } finally {
      loaded += 1
      opts.onProgress?.({ phase: 'documents', loaded, total })
    }
  })

  return { total, cached, skipped, failed }
}
