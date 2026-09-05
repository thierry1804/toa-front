import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, X, Loader2, Clock } from 'lucide-react'
import type { SuiviJournalierDocument } from '@/types/intervention'
import { interventionApi } from '@/api/interventionApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf'

interface SuiviDocumentUploadZoneProps {
  suiviId: string
  documents: SuiviJournalierDocument[]
  onUpload: (file: File) => Promise<unknown>
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<SuiviJournalierDocument | null>(null)
  const pendingUploads = usePendingUploads(
    suiviId ? `/api/suivis-journaliers/${suiviId}/documents` : undefined,
  )

  const handleFiles = async (files: FileList | null) => {
    if (!files || disabled) return
    for (const file of Array.from(files)) {
      if (!ACCEPTED_MIME.includes(file.type)) continue
      setUploading(true)
      try {
        await onUpload(file)
      } finally {
        setUploading(false)
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDelete = async (docId: string) => {
    setDeletingId(docId)
    try {
      await onDelete(docId)
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
        <div
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            void handleFiles(e.dataTransfer.files)
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          className={`flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors ${
            dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          ) : (
            <Upload className="h-6 w-6 text-gray-400" />
          )}
          <div className="text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
            >
              {uploading
                ? t('intervention.components.suiviDocumentUploadZone.uploading')
                : t('intervention.components.suiviDocumentUploadZone.chooseFiles')}
            </button>
            <p className="mt-0.5 text-xs text-gray-500">
              {t('intervention.components.suiviDocumentUploadZone.dropHint')}
            </p>
          </div>
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
