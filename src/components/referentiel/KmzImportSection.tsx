import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { KmzImportResponse } from '@/types/referentiel'
import { isOfflineQueued } from '@/offline/offlineError'

interface KmzImportSectionProps {
  onImport: (file: File) => Promise<KmzImportResponse>
  isLoading: boolean
}

export default function KmzImportSection({ onImport, isLoading }: KmzImportSectionProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || isLoading) return

    setError(null)

    if (file.name.split('.').pop()?.toLowerCase() !== 'kmz') {
      setError(t('referentiel.sites.import.formatError'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      await onImport(file)
    } catch (err: unknown) {
      if (isOfflineQueued(err)) return
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      setError(detail || t('referentiel.sites.import.error'))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
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
        title={t('referentiel.sites.import.hint')}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        {isLoading ? t('referentiel.sites.import.loading') : t('referentiel.sites.import.button')}
      </Button>
      {error && (
        <div className="flex max-w-sm items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
