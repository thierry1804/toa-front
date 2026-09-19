import type { OfflineSnapshotMeta } from '@/types/offlineSnapshot'

// Le back limite le snapshot à 1 appel / 5 min / utilisateur : on reste nettement au-dessus.
export const AUTO_SNAPSHOT_INTERVAL_MS = 10 * 60 * 1000

export type AutoSnapshotPlan = { kind: 'full' } | { kind: 'incremental'; since: string } | null

/**
 * Quand rafraîchir automatiquement les données hors-ligne : premier tirage complet dès qu'il n'y a pas de
 * snapshot (première connexion), puis incrémental si le dernier a plus de 10 min. Les fichiers (pièces,
 * photos, PDF) ne sont pas téléchargés en arrière-plan : ils restent à la charge du bouton « Préparer le
 * hors-ligne » ou de la consultation en ligne (ils sont alors mis en cache).
 */
export function planAutoSnapshot(meta: OfflineSnapshotMeta | null, now: number): AutoSnapshotPlan {
  if (!meta) return { kind: 'full' }
  if (now - meta.lastPulledAt < AUTO_SNAPSHOT_INTERVAL_MS) return null
  return { kind: 'incremental', since: meta.generatedAt }
}
