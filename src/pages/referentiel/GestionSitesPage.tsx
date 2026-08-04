import { useState } from 'react'
import { Map } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import {
  useImportKmzList,
  useImportKmz,
  useDeleteImportKmz,
  useSiteList,
  useSitesGeoJson,
} from '@/features/referentiel/hooks/useReferentiel'
import KmzImportSection from '@/components/referentiel/KmzImportSection'
import ImportKmzTable from '@/components/referentiel/ImportKmzTable'
import SiteTable from '@/components/referentiel/SiteTable'
import ReferentielSitesMap from '@/components/referentiel/ReferentielSitesMap'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

const PAGE_SIZE = 20

export default function GestionSitesPage() {
  const addToast = useUiStore((s) => s.addToast)
  const [page, setPage] = useState(1)

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
      message: `${result.nombreSites} site${result.nombreSites > 1 ? 's' : ''} importé${result.nombreSites > 1 ? 's' : ''} avec succès`,
    })
    setPage(1)
    return result
  }

  const handleDelete = (id: string) => {
    deleteImport(id, {
      onSuccess: () => {
        addToast({ type: 'success', message: 'Import KMZ supprimé avec succès' })
        setPage(1)
      },
      onError: () => addToast({ type: 'error', message: 'Erreur lors de la suppression' }),
    })
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
          <Map className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gestion de sites</h1>
          <p className="text-sm text-gray-500">Import et gestion des sites depuis fichiers KMZ</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importer un fichier KMZ</CardTitle>
        </CardHeader>
        <CardContent>
          <KmzImportSection onImport={handleImport} isLoading={importing} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique des imports</CardTitle>
        </CardHeader>
        <CardContent>
          <ImportKmzTable
            imports={imports}
            isLoading={loadingImports}
            isDeleting={deleting}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Carte des sites
            {(sitesGeoJson?.features?.length ?? 0) > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({sitesGeoJson!.features.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReferentielSitesMap geoJson={sitesGeoJson} height="420px" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Liste des sites
            {totalItems > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({totalItems})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
