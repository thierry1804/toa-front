import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useOnline } from './useOnline'
import { useUiStore } from '@/store/ui.store'
import { drainSyncQueue } from '@/offline/drainSyncQueue'

export function useSyncOnReconnect(): void {
  const isOnline      = useOnline()
  const wasOnlineRef  = useRef(isOnline)
  const queryClient   = useQueryClient()
  const addToast      = useUiStore((s) => s.addToast)

  useEffect(() => {
    if (!wasOnlineRef.current && isOnline) {
      drainSyncQueue(queryClient, addToast).then((synced) => {
        if (synced > 0) {
          addToast({
            message: `${synced} action(s) synchronisée(s)`,
            type: 'success',
          })
        }
      })
    }
    wasOnlineRef.current = isOnline
  }, [isOnline, queryClient, addToast])
}
