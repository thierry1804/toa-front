import { useRegisterSW } from 'virtual:pwa-register/react'
import { useTranslation } from 'react-i18next'

export function PwaReloadBanner() {
  const { t } = useTranslation()
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 border-b border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900"
    >
      <span>{t('offline.updateAvailable')}</span>
      <button
        type="button"
        className="touch-target font-medium underline"
        onClick={() => updateServiceWorker(true)}
      >
        {t('offline.reload')}
      </button>
    </div>
  )
}
