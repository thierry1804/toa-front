import { syncQueue } from './syncQueue'
import { clearBlobs } from './blobStore'
import { clearPersistedQueryCache } from './setupQueryPersistence'

export const API_CACHE_NAME = 'toa-api-cache'
export const DOC_CACHE_NAME = 'toa-doc-cache'

export async function clearOfflineState(): Promise<void> {
  await syncQueue.clear()
  await clearBlobs()
  await clearPersistedQueryCache()
  if (typeof caches !== 'undefined' && 'delete' in caches) {
    await caches.delete(API_CACHE_NAME)
    await caches.delete(DOC_CACHE_NAME)
  }
}
