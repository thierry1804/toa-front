import { useState, useEffect } from 'react'
import { pingApiReachable } from './pingApiReachable'

const PING_INTERVAL_MS = 30_000

export function useOnline(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    let cancelled = false

    const confirm = async () => {
      if (!navigator.onLine) {
        setIsOnline(false)
        return
      }
      const reachable = await pingApiReachable()
      if (!cancelled) setIsOnline(reachable)
    }

    const handleOnline = () => {
      void confirm()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    void confirm()
    const id = window.setInterval(() => {
      void confirm()
    }, PING_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.clearInterval(id)
    }
  }, [])

  return isOnline
}
