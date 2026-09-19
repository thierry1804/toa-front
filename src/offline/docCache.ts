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

const SW_DOC_CACHE = 'toa-doc-cache'

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

/** Best-effort read from the Workbox runtime cache (previous online downloads). */
export async function getDocumentBlobFromSwCache(url: string): Promise<Blob | undefined> {
  if (typeof caches === 'undefined') return undefined
  const path = normalizeUrl(url)
  try {
    const cache = await caches.open(SW_DOC_CACHE)
    const candidates = [path]
    try {
      const base = import.meta.env.VITE_API_URL as string | undefined
      if (base) candidates.unshift(new URL(path, base).href)
    } catch {
      // ignore invalid base URL
    }
    for (const candidate of candidates) {
      const match = await cache.match(candidate)
      if (match && match.ok) return match.blob()
    }
  } catch {
    return undefined
  }
  return undefined
}

/**
 * Serves a document blob for viewing/download.
 * Offline (or after network failure): IndexedDB first, then Workbox cache.
 * Online: network, then seed IndexedDB for later offline use (no dump prefetch required).
 */
export async function withCachedDocumentBlob(
  url: string,
  network: () => Promise<Blob>,
  opts?: { filename?: string },
): Promise<Blob> {
  const key = normalizeUrl(url)
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false

  const fromLocal = async (): Promise<Blob | undefined> => {
    const cached = await getCachedDocument(key)
    if (cached) return cached.blob
    return getDocumentBlobFromSwCache(key)
  }

  if (offline) {
    const local = await fromLocal()
    if (local) return local
  }

  try {
    const blob = await network()
    await putCachedDocument(key, blob, opts?.filename).catch(() => false)
    return blob
  } catch (err) {
    const local = await fromLocal()
    if (local) return local
    throw err
  }
}

/**
 * Statut d'un PDF généré déduit du cache local : hors-ligne, le statut serveur est inaccessible ; si le PDF
 * a été téléchargé ou préchargé, l'écran doit proposer « Télécharger » et non « Générer ».
 */
export async function cachedPdfStatus(url: string): Promise<{
  statut: 'GENERE'
  jobId: string
  genereAt: string
  tailleFichier: number
} | undefined> {
  const cached = await getCachedDocument(url)
  if (!cached) return undefined
  return {
    statut: 'GENERE',
    jobId: 'offline-cache',
    genereAt: new Date(cached.cachedAt).toISOString(),
    tailleFichier: cached.size,
  }
}

