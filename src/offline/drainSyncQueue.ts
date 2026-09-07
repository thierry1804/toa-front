import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import i18n from '@/lib/i18n'
import { syncQueue, type SyncItem } from './syncQueue'
import { isOfflineQueued } from './offlineError'
import { deleteBlobsForParts, getBlob, rebuildFormData } from './blobStore'
import { putCachedDocument } from './docCache'

const MAX_RETRIES = 5

function documentDownloadUrl(uploadUrl: string, docId: string): string | null {
  const path = uploadUrl.split('?')[0].replace(/\/$/, '')
  if (!/\/documents$/i.test(path)) return null
  return `${path}/${docId}/download`
}

async function seedDocCacheFromSyncedUpload(item: SyncItem, responseData: unknown): Promise<void> {
  if (!item.formParts?.length) return
  if (item.method !== 'POST') return
  const record = responseData && typeof responseData === 'object' ? (responseData as Record<string, unknown>) : null
  const docId =
    record && (typeof record.id === 'string' || typeof record.id === 'number') ? String(record.id) : null
  if (!docId) return
  const downloadUrl = documentDownloadUrl(item.url, docId)
  if (!downloadUrl) return
  const filePart = item.formParts.find((part) => part.kind === 'file' && part.blobId)
  if (!filePart?.blobId) return
  const stored = await getBlob(filePart.blobId)
  if (!stored) return
  await putCachedDocument(downloadUrl, stored.blob, filePart.filename ?? stored.filename).catch(() => false)
}

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
      const response = await replayItem(item)
      await seedDocCacheFromSyncedUpload(item, response?.data)
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
      message: i18n.t('offline.dropped', { count: dropped, max: MAX_RETRIES }),
      type: 'error',
    })
  }

  return synced
}
