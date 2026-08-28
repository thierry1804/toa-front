import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, FileArchive } from 'lucide-react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { ImportKmzSite } from '@/types/referentiel'

interface ImportKmzTableProps {
  imports: ImportKmzSite[]
  isLoading: boolean
  isDeleting: boolean
  onDelete: (id: string) => void
}

export default function ImportKmzTable({
  imports,
  isLoading,
  isDeleting,
  onDelete,
}: ImportKmzTableProps) {
  const { t, i18n } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<ImportKmzSite | null>(null)

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language === 'mg' ? 'mg-MG' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  if (isLoading) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        {t('referentiel.shared.loading')}
      </div>
    )
  }

  if (imports.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        {t('referentiel.sites.table.empty')}
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                {t('referentiel.sites.table.fichier')}
              </th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">
                {t('referentiel.sites.table.date')}
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600">
                {t('referentiel.sites.table.nbSites')}
              </th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">
                {t('referentiel.sites.table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {imports.map((imp) => (
              <tr key={imp.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <FileArchive className="h-4 w-4 shrink-0 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {imp.originalFilename ?? imp.nomFichier}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(imp.importedAt)}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    {imp.nombreSites}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setDeleteTarget(imp)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title={t('referentiel.sites.delete.confirm')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
