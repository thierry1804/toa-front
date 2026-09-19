import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, X, Loader2, Clock } from 'lucide-react'
import type { SuiviJournalierDocument } from '@/types/intervention'
import { interventionApi } from '@/api/interventionApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'
import CaptureButtons, { type CapturedFile } from '@/components/documents/CaptureButtons'
import { isOfflineQueued } from '@/offline/offlineError'
import { formatCapturedAt } from '@/utils/capturedAt'

interface SuiviDocumentUploadZoneProps {
  suiviId: string
  documents: SuiviJournalierDocument[]
  onUpload: (file: File, capturedAt?: string) => Promise<unknown>
  onDelete: (docId: string) => Promise<unknown>
  disabled?: boolean
}

function SuiviImageThumb({
  suiviId,
  doc,
}: {
  suiviId: string
  doc: SuiviJournalierDocument
}) {
  const { t } = useTranslation()
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null
    interventionApi
      .getSuiviDocumentBlob(suiviId, doc.id)
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [suiviId, doc.id])

  if (!src) {
    return (
      <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-200">
        <span className="flex h-full w-full items-center justify-center text-xs text-gray-500">
          {t('intervention.components.suiviDocumentUploadZone.imgBadge')}
        </span>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="h-10 w-10 flex-shrink-0 rounded object-cover"
    />
  )
}

export default function SuiviDocumentUploadZone({
  suiviId,
  documents,
  onUpload,
  onDelete,
  disabled = false,
}: SuiviDocumentUploadZoneProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<SuiviJournalierDocument | null>(null)
  const pendingUploads = usePendingUploads(
    suiviId ? `/api/suivis-journaliers/${suiviId}/documents` : undefined,
  )

  const handleCapture = async ({ file, capturedAt }: CapturedFile) => {
    if (disabled) return
    setUploading(true)
    try {
      await onUpload(file, capturedAt)
    } catch (err) {
      if (!isOfflineQueued(err)) throw err
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    setDeletingId(docId)
    try {
      await onDelete(docId)
    } catch {
      // already toasted by the delete hook
    } finally {
      setDeletingId(null)
    }
  }

  const isImage = (mime: string) => mime.startsWith('image/')

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">
        {t('intervention.components.suiviDocumentUploadZone.title')}
      </p>

      {(documents.length > 0 || pendingUploads.length > 0) && (
        <div className="space-y-2">
          {pendingUploads.map((pending) => (
            <div
              key={pending.id}
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
            >
              {pending.previewUrl ? (
                <img
                  src={pending.previewUrl}
                  alt=""
                  className="h-10 w-10 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <Clock className="h-8 w-8 flex-shrink-0 text-amber-600" />
              )}
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm text-amber-900">
                  {pending.filename ?? t('offline.pendingUpload')}
                </span>
                <span className="text-xs text-amber-700">{t('offline.pendingUpload')}</span>
              </div>
            </div>
          ))}
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <button
                type="button"
                onClick={() => setViewingDoc(doc)}
                className="flex-shrink-0 cursor-pointer"
                title={t('intervention.components.suiviDocumentUploadZone.view', 'Visualiser')}
              >
                {isImage(doc.mimeType) ? (
                  <SuiviImageThumb suiviId={suiviId} doc={doc} />
                ) : (
                  <FileText className="h-8 w-8 text-red-500" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setViewingDoc(doc)}
                className="flex-1 cursor-pointer truncate text-left text-sm text-gray-700 hover:underline"
              >
                {doc.nom}
                {formatCapturedAt(doc.capturedAt, doc.uploadedAt) && (
                  <span className="block text-xs text-gray-500">
                    {t('documents.capturedAt', { date: formatCapturedAt(doc.capturedAt, doc.uploadedAt) })}
                  </span>
                )}
              </button>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => void handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title={t('intervention.components.suiviDocumentUploadZone.delete')}
                >
                  {deletingId === doc.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-4 py-6">
          <CaptureButtons
            onCapture={handleCapture}
            uploading={uploading}
            hasPhotos={documents.length > 0}
            multiple
          />
          <p className="text-xs text-gray-500">{t('documents.cameraHint')}</p>
        </div>
      )}

      <DocumentViewerModal
        isOpen={viewingDoc !== null}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.nom ?? ''}
        blob={viewingDoc ? () => interventionApi.getSuiviDocumentBlob(suiviId, viewingDoc.id) : null}
      />
    </div>
  )
}
