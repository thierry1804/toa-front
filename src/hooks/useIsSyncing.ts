import { useEffect, useState } from 'react'
import { getSyncing, subscribeSyncing } from '@/offline/syncStatus'

export function useIsSyncing(): boolean {
  const [syncing, setSyncingState] = useState(getSyncing)

  useEffect(() => subscribeSyncing(() => {
    setSyncingState(getSyncing())
  }), [])

  return syncing
}
