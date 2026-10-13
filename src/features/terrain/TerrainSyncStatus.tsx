import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
import { useOnline } from '@/hooks/useOnline'
import { usePendingSyncCount } from '@/hooks/usePendingSyncCount'
import { useFailedSyncCount } from '@/hooks/useFailedSyncCount'
import { useIsSyncing } from '@/hooks/useIsSyncing'
import { OfflineSnapshotModal } from '@/components/layout/OfflineSnapshotButton'

export function TerrainSyncStatus() {
  const { t } = useTranslation()
  const online = useOnline()
  const pending = usePendingSyncCount()
  const failed = useFailedSyncCount()
  const syncing = useIsSyncing()
  const [open, setOpen] = useState(false)
  const Icon = syncing ? RefreshCw : !online || pending || failed ? CloudOff : CloudCheck
  return <>
    <button type="button" onClick={() => setOpen(true)} className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700">
      <Icon className={`h-4 w-4 shrink-0 ${syncing ? 'animate-spin' : ''}`} />
      <span role="status">{failed ? t('terrain.syncFailed', { count: failed }) : syncing ? t('terrain.syncing') : pending ? t('terrain.syncPending', { count: pending }) : online ? t('terrain.online') : t('terrain.offline')}</span>
    </button>
    <OfflineSnapshotModal isOpen={open} onClose={() => setOpen(false)} />
  </>
}
