import { useRef, useState } from 'react'
import { MapPin, Upload } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { KmzImportResult, SitePrevention } from '@/types/planPrevention'

interface KmzImportButtonProps {
  planId: string
  sites: SitePrevention[]
  onImport: (file: File) => Promise<KmzImportResult>
  onImportSuccess?: (sites: SitePrevention[]) => void
  disabled?: boolean
}

export default function KmzImportButton({
  planId: _planId,
  sites,
  onImport,
  onImportSuccess,
  disabled = false,
}: KmzImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<{ imported: number; ignored: number } | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) return

    setError(null)
    setSummary(null)

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'kmz') {
      setError('Format KMZ requis')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsImporting(true)
    try {
      const result = await onImport(file)
      setSummary({ imported: result.sitesImportes, ignored: result.sitesIgnores })
      onImportSuccess?.(result.sites)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('Format KMZ')) {
        setError('Format KMZ requis')
      }
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept=".kmz"
          ref={fileInputRef}
          className="hidden"
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isImporting}
          loading={isImporting}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {isImporting ? 'Traitement du fichier KMZ...' : 'Importer un fichier KMZ'}
        </Button>
        <span className="text-xs text-gray-500">Format accepté : .kmz (Google Earth)</span>
      </div>

      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      {summary && (
        <p className="text-sm font-medium text-green-700">
          {summary.imported} site{summary.imported > 1 ? 's' : ''} importé
          {summary.imported > 1 ? 's' : ''}
          {summary.ignored > 0 &&
            `, ${summary.ignored} ignoré${summary.ignored > 1 ? 's' : ''}`}
        </p>
      )}

      {sites.length > 0 && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-700">
              {sites.length} site{sites.length > 1 ? 's' : ''} détecté{sites.length > 1 ? 's' : ''}
            </p>
          </div>
          <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {sites.map((site) => (
              <li key={site.id} className="flex items-start gap-3 px-4 py-3">
                <MapPin className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{site.nom}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                  </p>
                  {site.sourceKmz && (
                    <span className="inline-block mt-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      KMZ
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sites.length === 0 && !summary && (
        <p className="text-sm text-gray-400 italic">
          Aucun site importé. Importez un fichier KMZ pour détecter les sites automatiquement.
        </p>
      )}
    </div>
  )
}
