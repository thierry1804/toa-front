import { useState } from 'react'
import { History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUiStore } from '@/store/ui.store'
import {
  useImportKmzList,
  useImportKmz,
  useDeleteImportKmz,
  useSiteList,
  useSitesGeoJson,
} from '@/features/referentiel/hooks/useReferentiel'
import KmzImportSection from '@/components/referentiel/KmzImportSection'
import ImportKmzHistoryDrawer from '@/components/referentiel/ImportKmzHistoryDrawer'
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
  const [historyOpen, setHistoryOpen] = useState(false)

  const { data: imports = [], isLoading: loadingImports } = useImportKmzList()
  const { data: sitesData, isLoading: loadingSites } = useSiteList(page)
  const { data: sitesGeoJson } = useSitesGeoJson()
  const { mutateAsync: importKmz, isPending: importing } = useImportKmz()
  const { mutate: deleteImport, isPending: deleting } = useDeleteImportKmz()

  const sites = sitesData?.member ?? []
  const totalItems = sitesData?.totalItems ?? 0

  const handleImport = async (file: File) => {
    const result = await importKmz(file)
    addToast({
      type: 'success',
      message: t('referentiel.sites.importSuccess', { count: result.nombreSites }),
    })
    setPage(1)
    return result
  }

  const handleDelete = (id: string) => {
    deleteImport(id, {
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
            <KmzImportSection onImport={handleImport} isLoading={importing} />
            <Button variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="mr-1.5 h-4 w-4" />
              {t('referentiel.sites.historyTitle')}
              {imports.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                  {imports.length}
                </span>
              )}
            </Button>
          </div>
        }
      />

      <ImportKmzHistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        imports={imports}
        isLoading={loadingImports}
        isDeleting={deleting}
        onDelete={handleDelete}
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
