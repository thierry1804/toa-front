import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSnapshotMeta } from '@/offline/snapshotStore'
import { pullOfflineSnapshot } from '@/offline/pullOfflineSnapshot'
import { getSyncing } from '@/offline/syncStatus'
import { useOnline } from './useOnline'
import { AUTO_SNAPSHOT_INTERVAL_MS, planAutoSnapshot } from './autoSnapshotPlan'

/**
 * Garde les données hors-ligne à jour sans action de l'utilisateur : tirage silencieux à l'ouverture, au
 * retour du réseau ou au retour au premier plan, puis toutes les 10 min tant que l'application est ouverte
 * et en ligne.
 */
export function useAutoSnapshot(): void {
  const isOnline = useOnline()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isOnline) return
    let stopped = false

    const run = async () => {
      if (stopped || getSyncing() || document.visibilityState === 'hidden') return
      const plan = planAutoSnapshot(await getSnapshotMeta(), Date.now())
      if (!plan) return
      const result = await pullOfflineSnapshot(queryClient, {
        silent: true,
        ...(plan.kind === 'incremental' ? { since: plan.since } : {}),
      })
      // Rôle sans accès au snapshot (ex. super admin) : inutile de réessayer en boucle.
      if (!result.ok && result.code === 'forbidden') stopped = true
    }

    // Aussi à la reprise de l'application (PWA remise au premier plan) : au montage l'onglet peut être masqué.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void run()
    }

    void run()
    const timer = window.setInterval(() => void run(), AUTO_SNAPSHOT_INTERVAL_MS)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isOnline, queryClient])
}
