import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { SiteImportPreview } from '@/types/referentiel'

interface SiteImportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  preview: SiteImportPreview | null
  isConfirming: boolean
  onConfirm: () => void
}

export default function SiteImportPreviewModal({
  isOpen,
  onClose,
  preview,
  isConfirming,
  onConfirm,
}: SiteImportPreviewModalProps) {
  const { t } = useTranslation()

  const toCreate = preview?.toCreate ?? []
  const toUpdate = preview?.toUpdate ?? []
  const errors = preview?.errors ?? []
  const hasRows = toCreate.length > 0 || toUpdate.length > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('referentiel.sites.preview.title')} size="lg">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          {t('referentiel.sites.preview.toCreate', { count: toCreate.length })}
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {t('referentiel.sites.preview.toUpdate', { count: toUpdate.length })}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${
            errors.length > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t('referentiel.sites.preview.errors', { count: errors.length })}
        </span>
      </div>

      {!hasRows && errors.length === 0 && (
        <p className="mt-4 text-sm text-gray-500">{t('referentiel.sites.preview.empty')}</p>
      )}

      {errors.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto rounded-lg border border-red-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-red-50 text-xs font-medium uppercase text-red-700">
              <tr>
                <th className="px-3 py-2">{t('referentiel.sites.preview.lineLabel')}</th>
                <th className="px-3 py-2">{t('referentiel.sites.preview.codeSiteLabel')}</th>
                <th className="px-3 py-2">{t('referentiel.sites.preview.nomSiteLabel')}</th>
                <th className="px-3 py-2">{t('referentiel.sites.preview.reasonLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-100">
              {errors.map((err, index) => (
                <tr key={index}>
                  <td className="px-3 py-2 text-gray-500">{err.line ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{err.codeSite ?? '—'}</td>
                  <td className="px-3 py-2 text-gray-700">{err.nomSite ?? err.name ?? '—'}</td>
                  <td className="px-3 py-2 text-red-700">
                    {t(`referentiel.sites.preview.reason.${err.reason}`, { defaultValue: err.reason })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ModalFooter>
        <Button variant="outline" size="sm" onClick={onClose} disabled={isConfirming}>
          {t('referentiel.sites.preview.cancel')}
        </Button>
        <Button variant="primary" size="sm" loading={isConfirming} disabled={!hasRows} onClick={onConfirm}>
          {t('referentiel.sites.preview.confirm')}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
