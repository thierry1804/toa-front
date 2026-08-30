import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { syncQueue, type SyncItem } from './syncQueue'
import { isOfflineQueued } from './offlineError'
import { deleteBlobsForParts, rebuildFormData } from './blobStore'

const MAX_RETRIES = 5

async function replayItem(item: SyncItem) {
  if (item.formParts?.length) {
    const form = await rebuildFormData(item.formParts)
    return api({
      method: item.method,
      url: item.url,
      data: form,
      _skipOfflineQueue: true,
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  }

  return api({
    method: item.method,
    url: item.url,
    data: item.body,
    _skipOfflineQueue: true,
    ...(item.contentType ? { headers: { 'Content-Type': item.contentType } } : {}),
  })
}

export async function drainSyncQueue(
  queryClient: QueryClient,
  addToast: (t: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void,
): Promise<number> {
  const items = await syncQueue.getAll()
  if (items.length === 0) return 0

  let synced = 0
  let dropped = 0

  for (const item of items) {
    try {
      await replayItem(item)
      await deleteBlobsForParts(item.formParts)
      await syncQueue.remove(item.id)
      synced++
    } catch (error) {
      if (isOfflineQueued(error)) continue
      const retries = await syncQueue.incrementRetries(item.id)
      if (retries >= MAX_RETRIES) {
        await syncQueue.moveToFailed(item.id)
        dropped++
      }
    }
  }

  if (synced > 0) {
    void queryClient.invalidateQueries()
  }

  if (dropped > 0) {
    addToast({
      message: `${dropped} action(s) non synchronisée(s) après ${MAX_RETRIES} tentatives`,
      type: 'error',
    })
  }

  return synced
}
