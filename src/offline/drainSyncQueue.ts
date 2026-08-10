import type { QueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import { syncQueue } from './syncQueue'

export async function drainSyncQueue(
  queryClient: QueryClient,
  addToast: (t: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void,
): Promise<number> {
  const items = await syncQueue.getAll()
  if (items.length === 0) return 0

  let synced = 0
  for (const item of items) {
    try {
      await api({ method: item.method, url: item.url, data: item.body })
      await syncQueue.remove(item.id)
      synced++
    } catch {
      await syncQueue.incrementRetries(item.id)
    }
  }

  if (synced > 0) {
    void queryClient.invalidateQueries()
  }
  return synced
}
