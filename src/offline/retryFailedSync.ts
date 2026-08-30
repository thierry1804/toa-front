import type { QueryClient } from '@tanstack/react-query'
import i18n from '@/lib/i18n'
import { drainSyncQueue } from './drainSyncQueue'
import { maybePullIncremental } from './pullOfflineSnapshot'
import { syncQueue } from './syncQueue'
import { getSyncing, setSyncing } from './syncStatus'

export async function retryFailedSync(
  queryClient: QueryClient,
  addToast: (t: { message: string; type: 'success' | 'error' | 'info' | 'warning' }) => void,
): Promise<number> {
  if (getSyncing()) return 0

  setSyncing(true)
  try {
    const moved = await syncQueue.requeueFailed()
    if (moved === 0) return 0

    const synced = await drainSyncQueue(queryClient, addToast)
    if (synced > 0) {
      addToast({
        message: i18n.t('offline.synced', { count: synced }),
        type: 'success',
      })
    }
    setSyncing(false)
    await maybePullIncremental(queryClient)
    return synced
  } finally {
    setSyncing(false)
  }
}
