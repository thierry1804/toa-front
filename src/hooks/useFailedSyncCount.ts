import { useEffect, useState } from 'react'
import { syncQueue } from '@/offline/syncQueue'

export function useFailedSyncCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const refresh = () => {
      syncQueue.getFailed().then((items) => {
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
