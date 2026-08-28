import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Site } from '@/types/referentiel'

interface SiteTableProps {
  sites: Site[]
  isLoading: boolean
  page: number
  totalItems: number
  pageSize: number
  onPageChange: (p: number) => void
}

export default function SiteTable({
  sites,
  isLoading,
  page,
  totalItems,
  pageSize,
  onPageChange,
}: SiteTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (isLoading) {
    return <div className="py-8 text-center text-sm text-gray-400">Chargement...</div>
  }

  if (sites.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400 italic">
        Aucun site trouvé. Importez un fichier KMZ pour créer des sites.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nom du site</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Fokontany</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Commune</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">District</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Coordonnées</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Import source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {sites.map((site) => (
              <tr key={site.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <MapPin
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: site.couleurMarqueur ?? '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium text-gray-900">{site.nomSite}</p>
                      {site.codeSite !== site.nomSite && (
                        <p className="text-xs text-gray-400">{site.codeSite}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{site.fokontany ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{site.commune ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{site.district ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">
                  {site.latitude.toFixed(5)}, {site.longitude.toFixed(5)}
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {site.importKmz ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                      {site.importKmz.nomFichier}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {totalItems} site{totalItems > 1 ? 's' : ''} au total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
