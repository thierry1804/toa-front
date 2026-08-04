import { useRef, useState } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { KmzImportResponse } from '@/types/referentiel'

interface KmzImportSectionProps {
  onImport: (file: File) => Promise<KmzImportResponse>
  isLoading: boolean
}

export default function KmzImportSection({ onImport, isLoading }: KmzImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<KmzImportResponse | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || isLoading) return

    setError(null)
    setResult(null)

    if (file.name.split('.').pop()?.toLowerCase() !== 'kmz') {
      setError('Format KMZ requis (.kmz)')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const res = await onImport(file)
      setResult(res)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      setError(detail || 'Erreur lors de l\'import du fichier KMZ')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
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
          disabled={isLoading}
          loading={isLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1.5 h-4 w-4" />
          {isLoading ? 'Import en cours...' : 'Importer un fichier KMZ'}
        </Button>
        <span className="text-xs text-gray-500">Format accepté : .kmz (Google Earth) — max 20 MB</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
          <p className="text-sm text-green-700">
            {result.nombreSites} site{result.nombreSites > 1 ? 's' : ''} importé{result.nombreSites > 1 ? 's' : ''}
            {result.sitesIgnores > 0 && ` · ${result.sitesIgnores} ignoré${result.sitesIgnores > 1 ? 's' : ''} (sans coordonnées)`}
          </p>
        </div>
      )}
    </div>
  )
}
