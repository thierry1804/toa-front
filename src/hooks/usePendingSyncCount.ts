import { useEffect, useState } from 'react'
import { syncQueue } from '@/offline/syncQueue'

// Number of offline mutations currently queued in IndexedDB, waiting to be
// replayed on reconnect. Lets the UI show the user their work was actually
// captured while offline, instead of a bare online/offline toggle.
export function usePendingSyncCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      syncQueue.getAll().then((items) => {
        if (!cancelled) setCount(items.length)
      })
    }
    refresh()
    const unsubscribe = syncQueue.subscribe(refresh)
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return count
}
