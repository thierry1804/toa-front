import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, FileArchive } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { ImportKmzSite } from '@/types/referentiel'

interface ImportKmzHistoryDrawerProps {
  isOpen: boolean
  onClose: () => void
  imports: ImportKmzSite[]
  isLoading: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
}

export default function ImportKmzHistoryDrawer({
  isOpen,
  onClose,
  imports,
  isLoading,
  isDeleting,
  onDelete,
}: ImportKmzHistoryDrawerProps) {
  const { t, i18n } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<ImportKmzSite | null>(null)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const subtitle =
    !isLoading && imports.length > 0
      ? t('referentiel.sites.historyCount', { count: imports.length })
      : undefined

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={t('referentiel.sites.historyTitle')}
        subtitle={subtitle}
        width="max-w-md"
      >
        {isLoading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t('referentiel.shared.loading')}
          </p>
        ) : imports.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
              <FileArchive className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              {t('referentiel.sites.table.empty')}
            </p>
            <p className="mt-1 max-w-xs text-xs text-gray-500">
              {t('referentiel.sites.historyEmptyHint')}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {imports.map((imp) => (
              <li
                key={imp.id}
                className="flex items-start gap-3 px-3 py-3 hover:bg-gray-50"
              >
                <FileArchive className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {imp.originalFilename ?? imp.nomFichier}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">{formatDate(imp.importedAt)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                  {imp.nombreSites}
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(imp)}
                  className="shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title={t('referentiel.sites.delete.confirm')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Drawer>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title={t('referentiel.sites.delete.title')}
      >
        <p className="text-sm text-gray-600">{t('referentiel.sites.delete.message')}</p>
        <p className="mt-2 text-sm font-medium text-gray-800">
          {t('referentiel.sites.table.fichier')} :{' '}
          {deleteTarget?.originalFilename ?? deleteTarget?.nomFichier}
        </p>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            {t('referentiel.sites.delete.cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={isDeleting}
            onClick={() => {
              if (deleteTarget) {
                onDelete(deleteTarget.id)
                setDeleteTarget(null)
              }
            }}
          >
            {t('referentiel.sites.delete.confirm')}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
