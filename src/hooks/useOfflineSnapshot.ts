import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { offlineSnapshotApi } from '@/api/offlineSnapshotApi'
import { snapshotErrorCode } from '@/offline/getHttpStatus'
import {
  pullOfflineSnapshot,
  type PullProgress,
  type PullSnapshotResult,
} from '@/offline/pullOfflineSnapshot'
import { getSnapshotMeta, subscribeSnapshot } from '@/offline/snapshotStore'
import type { OfflineSnapshotManifest, OfflineSnapshotMeta, SnapshotPullErrorCode } from '@/types/offlineSnapshot'

export function useOfflineSnapshot() {
  const queryClient = useQueryClient()
  const [meta, setMeta] = useState<OfflineSnapshotMeta | null>(null)
  const [manifest, setManifest] = useState<OfflineSnapshotManifest | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle')
  const [errorCode, setErrorCode] = useState<SnapshotPullErrorCode | null>(null)
  const [manifestError, setManifestError] = useState<SnapshotPullErrorCode | null>(null)
  const [progress, setProgress] = useState<PullProgress | null>(null)

  useEffect(() => {
    void getSnapshotMeta().then(setMeta)
    return subscribeSnapshot(() => {
      void getSnapshotMeta().then(setMeta)
    })
  }, [])

  const loadManifest = useCallback(async () => {
    setManifestError(null)
    try {
      const data = await offlineSnapshotApi.getManifest()
      setManifest(data)
      return data
    } catch (err) {
      const code = snapshotErrorCode(err)
      setManifestError(code)
      setManifest(null)
      return null
    }
  }, [])

  const pull = useCallback(async (): Promise<PullSnapshotResult> => {
    setStatus('loading')
    setErrorCode(null)
    setProgress({ phase: 'manifest', percent: 0 })
    const result = await pullOfflineSnapshot(queryClient, {
      since: meta?.generatedAt,
      onProgress: setProgress,
    })
    if (result.ok) {
      setProgress({ phase: 'documents', percent: 100, loaded: 1, total: 1 })
      setStatus('ready')
    } else {
      setProgress(null)
      setStatus('error')
      setErrorCode(result.code)
    }
    return result
  }, [queryClient, meta?.generatedAt])

  return {
    meta,
    manifest,
    status,
    errorCode,
    manifestError,
    progress,
    loadManifest,
    pull,
  }
}
