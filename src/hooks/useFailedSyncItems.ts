import { useEffect, useState } from 'react'
import { syncQueue, type SyncItem } from '@/offline/syncQueue'

export function useFailedSyncItems(): SyncItem[] {
  const [items, setItems] = useState<SyncItem[]>([])

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      syncQueue.getFailed().then((next) => {
        if (!cancelled) setItems(next)
      })
    }
    refresh()
    const unsubscribe = syncQueue.subscribe(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return items
}
