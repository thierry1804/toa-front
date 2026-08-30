import { useRef, useState } from 'react'
import { CheckCircle, XCircle, Upload, Download, Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TypeDocumentPermitTravail, DocumentPermitTravail } from '@/types/permitTravail'
import { DOCUMENT_TYPE_LABELS } from '@/types/permitTravail'
import { permitTravailApi } from '@/api/permitTravailApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'

const ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg']
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg'

interface PermitDocumentUploadZoneProps {
  permitId: string
  documentTypes: TypeDocumentPermitTravail[]
  uploadedDocuments: DocumentPermitTravail[]
  onUpload: (type: TypeDocumentPermitTravail, file: File) => Promise<void>
  missingTypes?: string[]
  disabled?: boolean
  allowDownload?: boolean
}

interface ZoneState {
  dragging: boolean
  uploading: boolean
}

export default function PermitDocumentUploadZone({
  permitId,
  documentTypes,
  uploadedDocuments,
  onUpload,
  missingTypes = [],
  disabled = false,
  allowDownload = false,
}: PermitDocumentUploadZoneProps) {
  const { t } = useTranslation()
  const pendingUploads = usePendingUploads(
    permitId ? `/api/permits-travail/${permitId}/documents` : undefined,
  )
  const [zoneStates, setZoneStates] = useState<Record<string, ZoneState>>(
    Object.fromEntries(documentTypes.map((t) => [t, { dragging: false, uploading: false }])),
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const uploadedByType = Object.fromEntries(uploadedDocuments.map((d) => [d.type, d]))
  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.type))

  const setZoneState = (type: string, partial: Partial<ZoneState>) => {
    setZoneStates((prev) => ({ ...prev, [type]: { ...prev[type], ...partial } }))
  }

  const handleFile = async (type: TypeDocumentPermitTravail, file: File | undefined) => {
    if (!file || disabled) return
    if (!ACCEPTED_MIME.includes(file.type)) return
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

  const handleDrop = (type: TypeDocumentPermitTravail, e: React.DragEvent) => {
    e.preventDefault()
    setZoneState(type, { dragging: false })
    handleFile(type, e.dataTransfer.files[0])
  }

  const handleDragOver = (type: TypeDocumentPermitTravail, e: React.DragEvent) => {
    e.preventDefault()
    setZoneState(type, { dragging: true })
  }

  const handleDragLeave = (type: TypeDocumentPermitTravail) => {
    setZoneState(type, { dragging: false })
  }

  return (
    <div className="space-y-3">
      {documentTypes.map((type) => {
        const uploaded = uploadedTypes.has(type)
        const pending = pendingUploads.find((item) => item.type === type)
        const missing = missingTypes.includes(type) && !pending
        const state = zoneStates[type] ?? { dragging: false, uploading: false }
        const label = DOCUMENT_TYPE_LABELS[type]

        const doc = uploadedByType[type]

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
            <div className="flex-shrink-0">
              {pending ? (
                <Clock className="h-6 w-6 text-amber-600" />
              ) : uploaded ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className={`h-6 w-6 ${missing ? 'text-red-500' : 'text-gray-300'}`} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  pending
                    ? 'text-amber-900'
                    : uploaded
                      ? 'text-green-800'
                      : missing
                        ? 'text-red-800'
                        : 'text-gray-800'
                }`}
              >
                {label}
              </p>
              {pending ? (
                <p className="text-xs text-amber-700 mt-0.5">
                  {t('offline.pendingUpload')}
                  {pending.filename ? ` — ${pending.filename}` : ''}
                </p>
              ) : uploaded ? (
                <p className="text-xs text-green-600 mt-0.5">
                  {t('permitTravail.components.documentUploadZone.uploadedCheck')}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  {t('permitTravail.components.documentUploadZone.formatsHint')}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 flex items-center gap-2">
              {allowDownload && uploaded && doc && (
                <button
                  type="button"
                  onClick={() => permitTravailApi.downloadDocument(permitId, doc.id, `${type}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('permitTravail.components.documentUploadZone.downloadButton')}
                </button>
              )}
              {!disabled && (
                <>
                  <input
                    type="file"
                    accept={ACCEPTED_EXTENSIONS}
                    ref={(el) => { fileInputRefs.current[type] = el }}
                    className="hidden"
                    onChange={(e) => handleFile(type, e.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[type]?.click()}
                    disabled={state.uploading}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      uploaded
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
                    {state.uploading
                      ? t('permitTravail.components.documentUploadZone.uploading')
                      : uploaded
                        ? t('permitTravail.components.documentUploadZone.replaceButton')
                        : t('permitTravail.components.documentUploadZone.chooseButton')}
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-400">
        {t('permitTravail.components.documentUploadZone.footerNote')}
      </p>
    </div>
  )
}
