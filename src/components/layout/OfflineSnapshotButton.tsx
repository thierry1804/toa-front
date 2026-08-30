import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { HardDriveDownload } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { useOfflineSnapshot } from '@/hooks/useOfflineSnapshot'
import { useOnline } from '@/hooks/useOnline'
import { usePendingSyncCount } from '@/hooks/usePendingSyncCount'
import { useFailedSyncCount } from '@/hooks/useFailedSyncCount'
import { useFailedSyncItems } from '@/hooks/useFailedSyncItems'
import { useIsSyncing } from '@/hooks/useIsSyncing'
import { retryFailedSync } from '@/offline/retryFailedSync'
import { useUiStore } from '@/store/ui.store'
import type { OfflineSnapshotModule, SnapshotPullErrorCode } from '@/types/offlineSnapshot'

const MODULE_ORDER: OfflineSnapshotModule[] = [
  'plansPrevention',
  'permitsTravail',
  'interventions',
  'activityPlannings',
  'sites',
  'users',
  'entreprises',
  'referentiel',
]

function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} Ko`
  return `${(n / (1024 * 1024)).toFixed(1)} Mo`
}

function formatSyncPath(url: string): string {
  const withoutQuery = url.split('?')[0]
  let path = withoutQuery
  try {
    if (/^https?:\/\//i.test(withoutQuery)) {
      path = new URL(withoutQuery).pathname
    }
  } catch {
    path = withoutQuery
  }
  return path.length > 48 ? `…${path.slice(-47)}` : path
}

function errorMessage(t: (key: string) => string, code: SnapshotPullErrorCode | null): string {
  if (code === 'forbidden') return t('offline.snapshot.forbidden')
  if (code === 'rateLimited') return t('offline.snapshot.rateLimited')
  if (code === 'tooLarge') return t('offline.snapshot.tooLarge')
  if (code === 'network') return t('offline.snapshot.network')
  return t('offline.snapshot.error')
}

export function OfflineSnapshotModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const isOnline = useOnline()
  const {
    meta,
    manifest,
    status,
    errorCode,
    manifestError,
    progress,
    loadManifest,
    pull,
  } = useOfflineSnapshot()

  useEffect(() => {
    if (isOpen) void loadManifest()
  }, [isOpen, loadManifest])

  const modules = manifest?.modules ?? {}
  const estimated = Object.values(modules).reduce((sum, m) => sum + (m?.estimatedBytes ?? 0), 0)
  const canDownload = isOnline && !manifestError && status !== 'loading'
  const lastSync = meta?.lastPulledAt
    ? new Date(meta.lastPulledAt).toLocaleString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR')
    : t('offline.snapshot.never')
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)
  const failedItems = useFailedSyncItems()
  const isSyncing = useIsSyncing()
  const canRetry = isOnline && !isSyncing && failedItems.length > 0

  const progressPct =
    progress?.total && progress.total > 0
      ? Math.min(100, Math.round(((progress.loaded ?? 0) / progress.total) * 100))
      : status === 'loading'
        ? 10
        : 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('offline.snapshot.title')} size="md">
      <p className="text-sm text-gray-600">{t('offline.snapshot.lastSync', { date: lastSync })}</p>

      {manifestError && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage(t, manifestError)}
        </p>
      )}

      {manifest && (
        <ul className="mt-4 divide-y divide-gray-200 border border-gray-200">
          {MODULE_ORDER.map((key) => {
            const stats = modules[key]
            if (!stats) return null
            return (
              <li key={key} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-gray-700">{t(`offline.snapshot.modules.${key}`)}</span>
                <span className="tabular-nums text-gray-900">{stats.count}</span>
              </li>
            )
          })}
        </ul>
      )}

      {estimated > 0 && (
        <p className="mt-3 text-sm text-gray-600">
          {t('offline.snapshot.estimatedSize', { size: formatBytes(estimated) })}
        </p>
      )}

      {failedItems.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-800">{t('offline.failedList')}</p>
          <ul className="mt-2 divide-y divide-gray-200 border border-gray-200">
            {failedItems.map((item) => (
              <li key={item.id} className="flex items-baseline gap-2 px-3 py-2 text-sm">
                <span className="shrink-0 font-medium text-gray-900">{item.method}</span>
                <span className="min-w-0 truncate text-gray-600">{formatSyncPath(item.url)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void retryFailedSync(queryClient, addToast)}
              disabled={!canRetry}
              isLoading={isSyncing}
            >
              {t('offline.retryFailed')}
            </Button>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded bg-gray-200">
            <div className="h-full bg-gray-800" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">{t('offline.snapshot.progress')}</p>
        </div>
      )}

      {errorCode && status === 'error' && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {errorMessage(t, errorCode)}
        </p>
      )}

      {status === 'ready' && (
        <p className="mt-3 text-sm text-gray-800">{t('offline.snapshot.success')}</p>
      )}

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
        <Button
          type="button"
          onClick={() => void pull()}
          disabled={!canDownload}
          isLoading={status === 'loading'}
        >
          {t('offline.snapshot.download')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export function OfflineSnapshotButton() {
  const { t } = useTranslation()
  const { meta } = useOfflineSnapshot()
  const [open, setOpen] = useState(false)
  const pendingCount = usePendingSyncCount()
  const failedCount = useFailedSyncCount()
  const isSyncing = useIsSyncing()

  const badgeCount = failedCount > 0 ? failedCount : pendingCount
  const badgeLabel =
    failedCount > 0
      ? t('offline.syncBadgeFailed', { count: failedCount })
      : pendingCount > 0
        ? t('offline.syncBadge', { count: pendingCount })
        : null
  const ariaLabel = [t('offline.snapshot.prepare'), isSyncing ? t('offline.syncing') : badgeLabel]
    .filter(Boolean)
    .join('. ')

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={ariaLabel}
        aria-label={ariaLabel}
        aria-busy={isSyncing || undefined}
        className="touch-target relative flex shrink-0 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-blue-100/60 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <HardDriveDownload
          className={`h-5 w-5 ${isSyncing ? 'text-gray-400' : ''}`}
          aria-hidden
        />
        {badgeCount > 0 && (
          <span
            className={`absolute -right-0.5 -top-0.5 min-w-[14px] rounded px-0.5 text-center text-[9px] font-medium leading-[14px] tabular-nums ${
              failedCount > 0 ? 'bg-red-50 text-red-800' : 'bg-gray-800 text-white'
            }`}
            aria-hidden
          >
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
        {meta ? <span className="sr-only">{t('offline.snapshot.readyHint')}</span> : null}
      </button>
      <OfflineSnapshotModal isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
