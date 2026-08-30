import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOnline } from './useOnline'
import { useUiStore } from '@/store/ui.store'
import { drainSyncQueue } from '@/offline/drainSyncQueue'
import { maybePullIncremental } from '@/offline/pullOfflineSnapshot'
import { shouldDrainSync } from './shouldDrainSync'

export function useSyncOnReconnect(): void {
  const isOnline = useOnline()
  const wasOnlineRef = useRef(isOnline)
  const isFirstRunRef = useRef(true)
  const drainingRef = useRef(false)
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)

  useEffect(() => {
    const shouldDrain = shouldDrainSync({
      isFirstRun: isFirstRunRef.current,
      wasOnline: wasOnlineRef.current,
      isOnline,
    })
    isFirstRunRef.current = false
    wasOnlineRef.current = isOnline

    if (!shouldDrain || drainingRef.current) return

    drainingRef.current = true
    drainSyncQueue(queryClient, addToast)
      .then(async (synced) => {
        if (synced > 0) {
          addToast({
            message: `${synced} action(s) synchronisée(s)`,
            type: 'success',
          })
        }
        await maybePullIncremental(queryClient)
      })
      .finally(() => {
        drainingRef.current = false
      })
  }, [isOnline, queryClient, addToast])
}
