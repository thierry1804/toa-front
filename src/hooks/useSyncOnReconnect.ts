import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useOnline } from './useOnline'
import { useUiStore } from '@/store/ui.store'
import { drainSyncQueue } from '@/offline/drainSyncQueue'
import { maybePullIncremental } from '@/offline/pullOfflineSnapshot'
import { getSyncing, setSyncing } from '@/offline/syncStatus'
import { shouldDrainSync } from './shouldDrainSync'

export function useSyncOnReconnect(): void {
  const isOnline = useOnline()
  const wasOnlineRef = useRef(isOnline)
  const isFirstRunRef = useRef(true)
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)
  const { t } = useTranslation()

  useEffect(() => {
    const shouldDrain = shouldDrainSync({
      isFirstRun: isFirstRunRef.current,
      wasOnline: wasOnlineRef.current,
      isOnline,
    })
    isFirstRunRef.current = false
    wasOnlineRef.current = isOnline

    if (!shouldDrain || getSyncing()) return

    void (async () => {
      setSyncing(true)
      try {
        const synced = await drainSyncQueue(queryClient, addToast)
        if (synced > 0) {
          addToast({
            message: t('offline.synced', { count: synced }),
            type: 'success',
          })
        }
      } finally {
        setSyncing(false)
      }
      await maybePullIncremental(queryClient)
    })()
  }, [isOnline, queryClient, addToast, t])
}
