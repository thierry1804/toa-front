import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'
import SiteImportPreviewModal from '@/components/referentiel/SiteImportPreviewModal'
import type { SiteImportPreview, SiteImportResponse } from '@/types/referentiel'
import { isOfflineQueued } from '@/offline/offlineError'

interface KmzImportSectionProps {
  onPreview: (file: File) => Promise<SiteImportPreview>
  onImport: (file: File) => Promise<SiteImportResponse>
  isPreviewing: boolean
  isImporting: boolean
}

export default function KmzImportSection({
  onPreview,
  onImport,
  isPreviewing,
  isImporting,
}: KmzImportSectionProps) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<SiteImportPreview | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file || isPreviewing) return

    setError(null)

    if (file.name.split('.').pop()?.toLowerCase() !== 'kmz') {
      setError(t('referentiel.sites.import.formatError'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    try {
      const result = await onPreview(file)
      setPendingFile(file)
      setPreview(result)
    } catch (err: unknown) {
      if (isOfflineQueued(err)) return
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      setError(detail || t('referentiel.sites.import.error'))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const closePreview = () => {
    setPendingFile(null)
    setPreview(null)
  }

  const handleConfirm = async () => {
    if (!pendingFile) return
    try {
      await onImport(pendingFile)
      closePreview()
    } catch (err: unknown) {
      if (isOfflineQueued(err)) {
        closePreview()
        return
      }
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      setError(detail || t('referentiel.sites.import.error'))
      closePreview()
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
        disabled={isPreviewing}
        loading={isPreviewing}
        onClick={() => fileInputRef.current?.click()}
        title={t('referentiel.sites.import.hint')}
      >
        <Upload className="mr-1.5 h-4 w-4" />
        {isPreviewing ? t('referentiel.sites.import.loading') : t('referentiel.sites.import.button')}
      </Button>
      {error && (
        <div className="flex max-w-sm items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <SiteImportPreviewModal
        isOpen={preview !== null}
        onClose={closePreview}
        preview={preview}
        isConfirming={isImporting}
        onConfirm={() => void handleConfirm()}
      />
    </div>
  )
}
