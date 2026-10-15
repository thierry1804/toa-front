import { useTranslation } from 'react-i18next'
import { useOnline } from '@/hooks/useOnline'
import { usePendingSyncCount } from '@/hooks/usePendingSyncCount'
import { useFailedSyncCount } from '@/hooks/useFailedSyncCount'

/** Pastille sur l'onglet « Ma journée » : envois en attente / à vérifier / hors ligne (jamais la couleur seule : texte masqué lisible par lecteur d'écran, détail dans l'en-tête). */
export function TerrainSyncDot() {
  const { t } = useTranslation()
  const online = useOnline()
  const pending = usePendingSyncCount()
  const failed = useFailedSyncCount()
  if (online && !pending && !failed) return null
  const label = failed ? t('terrain.syncFailed', { count: failed }) : pending ? t('terrain.syncPending', { count: pending }) : t('terrain.offline')
  return (
    <span
      role="status"
      className={`absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white ${failed ? 'bg-red-600' : 'bg-amber-600'}`}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden>{failed || pending || '!'}</span>
    </span>
  )
}
