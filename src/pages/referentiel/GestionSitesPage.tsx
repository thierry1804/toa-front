import { useState } from 'react'
import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui.store'
import {
  useImportKmzList,
  usePreviewKmzImport,
  useImportKmz,
  useDeleteImportKmz,
  useImportSpreadsheetList,
  usePreviewSpreadsheetImport,
  useImportSpreadsheet,
  useDeleteImportSpreadsheet,
  useSiteList,
  useSitesGeoJson,
} from '@/features/referentiel/hooks/useReferentiel'
import KmzImportSection from '@/components/referentiel/KmzImportSection'
import SpreadsheetImportSection from '@/components/referentiel/SpreadsheetImportSection'
import ImportHistoryDrawer from '@/components/referentiel/ImportHistoryDrawer'
import SiteTable from '@/components/referentiel/SiteTable'
import ReferentielSitesMap from '@/components/referentiel/ReferentielSitesMap'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const PAGE_SIZE = 20

export default function GestionSitesPage() {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const [page, setPage] = useState(1)
  const [kmzHistoryOpen, setKmzHistoryOpen] = useState(false)
  const [spreadsheetHistoryOpen, setSpreadsheetHistoryOpen] = useState(false)

  const { data: kmzImports = [], isLoading: loadingKmzImports } = useImportKmzList()
  const { data: spreadsheetImports = [], isLoading: loadingSpreadsheetImports } =
    useImportSpreadsheetList()
  const { data: sitesData, isLoading: loadingSites } = useSiteList(page)
  const { data: sitesGeoJson } = useSitesGeoJson()

  const { mutateAsync: previewKmz, isPending: previewingKmz } = usePreviewKmzImport()
  const { mutateAsync: importKmz, isPending: importingKmz } = useImportKmz()
  const { mutate: deleteKmzImport, isPending: deletingKmzImport } = useDeleteImportKmz()

  const { mutateAsync: previewSpreadsheet, isPending: previewingSpreadsheet } =
    usePreviewSpreadsheetImport()
  const { mutateAsync: importSpreadsheet, isPending: importingSpreadsheet } = useImportSpreadsheet()
  const { mutate: deleteSpreadsheetImport, isPending: deletingSpreadsheetImport } =
    useDeleteImportSpreadsheet()

  const sites = sitesData?.member ?? []
  const totalItems = sitesData?.totalItems ?? 0

  const handleImportKmz = async (file: File) => {
    const result = await importKmz(file)
    addToast({
      type: 'success',
      message: t('referentiel.sites.importSuccess', { count: result.nombreSites }),
    })
    setPage(1)
    return result
  }

  const handleImportSpreadsheet = async (file: File) => {
    const result = await importSpreadsheet(file)
    addToast({
      type: 'success',
      message: t('referentiel.sites.importSpreadsheet.success', { count: result.nombreSites }),
    })
    setPage(1)
    return result
  }

  const handleDeleteKmzImport = (id: string) => {
    deleteKmzImport(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: t('referentiel.sites.deleteSuccess') })
        setPage(1)
      },
      onError: () => addToast({ type: 'error', message: t('referentiel.sites.deleteError') }),
    })
  }

  const handleDeleteSpreadsheetImport = (id: string) => {
    deleteSpreadsheetImport(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: t('referentiel.sites.deleteSuccess') })
        setPage(1)
      },
      onError: () => addToast({ type: 'error', message: t('referentiel.sites.deleteError') }),
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('referentiel.sites.title')}
        description={t('referentiel.sites.description')}
        actions={
          <div className="flex flex-wrap items-start gap-2">
            <KmzImportSection
              onPreview={previewKmz}
              onImport={handleImportKmz}
              isPreviewing={previewingKmz}
              isImporting={importingKmz}
            />
            <SpreadsheetImportSection
              onPreview={previewSpreadsheet}
              onImport={handleImportSpreadsheet}
              isPreviewing={previewingSpreadsheet}
              isImporting={importingSpreadsheet}
            />
            <Button variant="outline" size="sm" onClick={() => setKmzHistoryOpen(true)}>
              <History className="mr-1.5 h-4 w-4" />
              {t('referentiel.sites.historyTitle')}
              {kmzImports.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {kmzImports.length}
                </span>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSpreadsheetHistoryOpen(true)}>
              <History className="mr-1.5 h-4 w-4" />
              {t('referentiel.sites.importSpreadsheet.historyTitle')}
              {spreadsheetImports.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {spreadsheetImports.length}
                </span>
              )}
            </Button>
          </div>
        }
      />

      <ImportHistoryDrawer
        isOpen={kmzHistoryOpen}
        onClose={() => setKmzHistoryOpen(false)}
        title={t('referentiel.sites.historyTitle')}
        imports={kmzImports}
        isLoading={loadingKmzImports}
        isDeleting={deletingKmzImport}
        onDelete={handleDeleteKmzImport}
      />

      <ImportHistoryDrawer
        isOpen={spreadsheetHistoryOpen}
        onClose={() => setSpreadsheetHistoryOpen(false)}
        title={t('referentiel.sites.importSpreadsheet.historyTitle')}
        imports={spreadsheetImports}
        isLoading={loadingSpreadsheetImports}
        isDeleting={deletingSpreadsheetImport}
        onDelete={handleDeleteSpreadsheetImport}
      />

      <Card>
        <CardSectionHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            {t('referentiel.sites.mapTitle')}
            {(sitesGeoJson?.features?.length ?? 0) > 0 && (
              <span className="ml-1 font-normal text-gray-500">
                ({sitesGeoJson!.features.length})
              </span>
            )}
          </h2>
        </CardSectionHeader>
        <CardContent className="p-4">
          <ReferentielSitesMap geoJson={sitesGeoJson} height="420px" />
        </CardContent>
      </Card>

      <Card>
        <CardSectionHeader>
          <h2 className="text-sm font-semibold text-gray-900">
            {t('referentiel.sites.listTitle')}
            {totalItems > 0 && (
              <span className="ml-1 font-normal text-gray-500">({totalItems})</span>
            )}
          </h2>
        </CardSectionHeader>
        <CardContent className="p-0">
          <SiteTable
            sites={sites}
            isLoading={loadingSites}
            page={page}
            totalItems={totalItems}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
