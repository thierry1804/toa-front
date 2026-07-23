import { useRef, useState } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import type { SuiviJournalierDocument } from '@/types/intervention'

const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.pdf'

interface SuiviDocumentUploadZoneProps {
  documents: SuiviJournalierDocument[]
  onUpload: (file: File) => Promise<void>
  onDelete: (docId: string) => Promise<void>
  disabled?: boolean
}

export default function SuiviDocumentUploadZone({
  documents,
  onUpload,
  onDelete,
  disabled = false,
}: SuiviDocumentUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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
        Pièces justificatives (photos, rapports...)
      </p>

      {/* Existing documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              {isImage(doc.mimeType) ? (
                <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden bg-gray-200">
                  <span className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                    IMG
                  </span>
                </div>
              ) : (
                <FileText className="h-8 w-8 flex-shrink-0 text-red-500" />
              )}
              <span className="flex-1 truncate text-sm text-gray-700">{doc.nom}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => void handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Supprimer"
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

      {/* Upload zone */}
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
              {uploading ? 'Envoi en cours...' : 'Choisir des fichiers'}
            </button>
            <p className="mt-0.5 text-xs text-gray-500">
              ou glissez-déposez — JPEG, PNG, WebP, PDF · max 10 Mo
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
