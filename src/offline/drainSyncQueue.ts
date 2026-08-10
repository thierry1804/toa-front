import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { syncQueue } from './syncQueue'

const MAX_RETRIES = 5

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
      await api({
        method: item.method,
        url: item.url,
        data: item.body,
        headers: item.contentType ? { 'Content-Type': item.contentType } : undefined,
      })
      await syncQueue.remove(item.id)
      synced++
    } catch {
      const retries = await syncQueue.incrementRetries(item.id)
      if (retries >= MAX_RETRIES) {
        await syncQueue.remove(item.id)
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
