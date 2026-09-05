import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Upload, Eye, Clock } from 'lucide-react'
import type { TypeDocumentPrevention, DocumentPrevention } from '@/types/planPrevention'
import { TYPES_DOCUMENT_LABELS, ALL_DOCUMENT_TYPES } from '@/types/planPrevention'
import { planPreventionApi } from '@/api/planPreventionApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg']
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg'

interface DocumentUploadZoneProps {
  planId: string
  uploadedDocuments: DocumentPrevention[]
  onUpload: (type: TypeDocumentPrevention, file: File) => Promise<void>
  missingTypes?: string[]
  disabled?: boolean
}

interface ZoneState {
  dragging: boolean
  uploading: boolean
  viewing: boolean
}

export default function DocumentUploadZone({
  planId,
  uploadedDocuments,
  onUpload,
  missingTypes = [],
  disabled = false,
}: DocumentUploadZoneProps) {
  const { t } = useTranslation()
  const pendingUploads = usePendingUploads(
    planId ? `/api/plans-prevention/${planId}/documents` : undefined,
  )
  const [zoneStates, setZoneStates] = useState<Record<string, ZoneState>>(
    Object.fromEntries(ALL_DOCUMENT_TYPES.map((type) => [type, { dragging: false, uploading: false, viewing: false }])),
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.type))
  const [viewingDoc, setViewingDoc] = useState<{ id: string; label: string } | null>(null)

  const setZoneState = (type: string, partial: Partial<ZoneState>) => {
    setZoneStates((prev) => ({ ...prev, [type]: { ...prev[type], ...partial } }))
  }

  const handleFile = async (type: TypeDocumentPrevention, file: File | undefined) => {
    if (!file || disabled) return

    if (!ACCEPTED_MIME.includes(file.type)) {
      return
    }

    setZoneState(type, { uploading: true })
    try {
      await onUpload(type, file)
    } finally {
      setZoneState(type, { uploading: false })
      if (fileInputRefs.current[type]) {
        fileInputRefs.current[type]!.value = ''
      }
    }
  }

  const handleView = (type: TypeDocumentPrevention) => {
    const doc = uploadedDocuments.find((d) => d.type === type)
    if (!doc) return
    setViewingDoc({ id: doc.id, label: TYPES_DOCUMENT_LABELS[type] })
  }

  const handleDrop = (type: TypeDocumentPrevention, e: React.DragEvent) => {
    e.preventDefault()
    setZoneState(type, { dragging: false })
    const file = e.dataTransfer.files[0]
    handleFile(type, file)
  }

  const handleDragOver = (type: TypeDocumentPrevention, e: React.DragEvent) => {
    e.preventDefault()
    setZoneState(type, { dragging: true })
  }

  const handleDragLeave = (type: TypeDocumentPrevention) => {
    setZoneState(type, { dragging: false })
  }

  const handleInputChange = (type: TypeDocumentPrevention, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(type, e.target.files?.[0])
  }

  return (
    <div className="space-y-3">
      {ALL_DOCUMENT_TYPES.map((type) => {
        const uploaded = uploadedTypes.has(type)
        const pending = pendingUploads.find((item) => item.type === type)
        const missing = missingTypes.includes(type) && !pending
        const state = zoneStates[type]
        const label = TYPES_DOCUMENT_LABELS[type]

        return (
          <div
            key={type}
            onDrop={(e) => handleDrop(type, e)}
            onDragOver={(e) => handleDragOver(type, e)}
            onDragLeave={() => handleDragLeave(type)}
            className={`flex items-center gap-4 rounded-lg border-2 px-4 py-3 transition-all ${
              pending
                ? 'border-amber-300 bg-amber-50'
                : uploaded
                  ? 'border-green-300 bg-green-50'
                  : missing
                    ? 'border-red-300 bg-red-50'
                    : state.dragging
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
            }`}
          >
            {/* Status icon */}
            <div className="flex-shrink-0">
              {pending ? (
                <Clock className="h-6 w-6 text-amber-600" />
              ) : uploaded ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className={`h-6 w-6 ${missing ? 'text-red-500' : 'text-gray-300'}`} />
              )}
            </div>

            {/* Label & info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                pending
                  ? 'text-amber-900'
                  : uploaded
                    ? 'text-green-800'
                    : missing
                      ? 'text-red-800'
                      : 'text-gray-800'
              }`}>
                {label}
              </p>
              {pending ? (
                <p className="text-xs text-amber-700 mt-0.5">
                  {t('offline.pendingUpload')}
                  {pending.filename ? ` — ${pending.filename}` : ''}
                </p>
              ) : uploaded ? (
                <p className="text-xs text-green-600 mt-0.5">Document téléversé ✓</p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  PDF, JPG/JPEG — glissez-déposez ou cliquez pour sélectionner
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {/* View button — shown when uploaded */}
              {uploaded && (
                <button
                  type="button"
                  onClick={() => handleView(type)}
                  disabled={state.viewing}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Visualiser le document"
                >
                  {state.viewing ? (
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  Voir
                </button>
              )}
              {/* Upload button */}
              {!disabled && (
                <>
                  <input
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    ref={(el) => { fileInputRefs.current[type] = el }}
                    className="hidden"
                    onChange={(e) => handleInputChange(type, e)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[type]?.click()}
                    disabled={state.uploading}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
                      ${uploaded
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {state.uploading ? (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {state.uploading ? 'Envoi...' : uploaded ? 'Remplacer' : 'Choisir'}
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}

      <p className="text-xs text-gray-500">
        {t('planPrevention.components.documentUpload.hint', { count: ALL_DOCUMENT_TYPES.length })}
      </p>

      <DocumentViewerModal
        isOpen={viewingDoc !== null}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.label ?? ''}
        blob={viewingDoc ? () => planPreventionApi.getDocumentBlob(planId, viewingDoc.id) : null}
      />
    </div>
  )
}
