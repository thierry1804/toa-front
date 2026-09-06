import { getOfflineDb, DOC_CACHE_STORE } from './offlineDb'
import { MAX_FILE_BYTES, MAX_TOTAL_BYTES } from './blobStore'

export type CachedDocument = {
  url: string
  blob: Blob
  filename: string
  mimeType: string
  size: number
  cachedAt: number
}

function normalizeUrl(url: string): string {
  try {
    if (/^https?:\/\//i.test(url)) {
      return new URL(url).pathname
    }
  } catch {
    // keep as-is
  }
  return url.split('?')[0]
}

async function totalDocCacheBytes(): Promise<number> {
  const db = await getOfflineDb()
  const all = (await db.getAll(DOC_CACHE_STORE)) as CachedDocument[]
  return all.reduce((sum, item) => sum + (item.size ?? 0), 0)
}

export async function putCachedDocument(
  url: string,
  blob: Blob,
  filename = 'document',
): Promise<boolean> {
  if (blob.size > MAX_FILE_BYTES) return false
  const key = normalizeUrl(url)
  const db = await getOfflineDb()
  const existing = (await db.get(DOC_CACHE_STORE, key)) as CachedDocument | undefined
  const extra = blob.size - (existing?.size ?? 0)
  if (extra > 0 && (await totalDocCacheBytes()) + extra > MAX_TOTAL_BYTES) return false

  const record: CachedDocument = {
    url: key,
    blob,
    filename,
    mimeType: blob.type || 'application/octet-stream',
    size: blob.size,
    cachedAt: Date.now(),
  }
  await db.put(DOC_CACHE_STORE, record)
  return true
}

export async function getCachedDocument(url: string): Promise<CachedDocument | undefined> {
  const db = await getOfflineDb()
  return (await db.get(DOC_CACHE_STORE, normalizeUrl(url))) as CachedDocument | undefined
}

export async function clearDocCache(): Promise<void> {
  const db = await getOfflineDb()
  await db.clear(DOC_CACHE_STORE)
}

export async function withCachedDocumentBlob(
  url: string,
  network: () => Promise<Blob>,
  opts?: { filename?: string },
): Promise<Blob> {
  const key = normalizeUrl(url)
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false

  if (offline) {
    const cached = await getCachedDocument(key)
    if (cached) return cached.blob
  }

  try {
    const blob = await network()
    await putCachedDocument(key, blob, opts?.filename).catch(() => false)
    return blob
  } catch (err) {
    const cached = await getCachedDocument(key)
    if (cached) return cached.blob
    throw err
  }
}
