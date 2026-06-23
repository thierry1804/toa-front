import { useRef, useState } from 'react'
import { CheckCircle, XCircle, Upload } from 'lucide-react'
import type { TypeDocumentPrevention, DocumentPrevention } from '@/types/planPrevention'
import { TYPES_DOCUMENT_LABELS, ALL_DOCUMENT_TYPES } from '@/types/planPrevention'

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
}

export default function DocumentUploadZone({
  planId,
  uploadedDocuments,
  onUpload,
  missingTypes = [],
  disabled = false,
}: DocumentUploadZoneProps) {
  const [zoneStates, setZoneStates] = useState<Record<string, ZoneState>>(
    Object.fromEntries(ALL_DOCUMENT_TYPES.map((t) => [t, { dragging: false, uploading: false }])),
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.type))

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
        const missing = missingTypes.includes(type)
        const state = zoneStates[type]
        const label = TYPES_DOCUMENT_LABELS[type]

        return (
          <div
            key={type}
            onDrop={(e) => handleDrop(type, e)}
            onDragOver={(e) => handleDragOver(type, e)}
            onDragLeave={() => handleDragLeave(type)}
            className={`flex items-center gap-4 rounded-lg border-2 px-4 py-3 transition-all ${
              uploaded
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
              {uploaded ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className={`h-6 w-6 ${missing ? 'text-red-500' : 'text-gray-300'}`} />
              )}
            </div>

            {/* Label & info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${uploaded ? 'text-green-800' : missing ? 'text-red-800' : 'text-gray-800'}`}>
                {label}
              </p>
              {uploaded ? (
                <p className="text-xs text-green-600 mt-0.5">Document téléversé ✓</p>
              ) : (
                <p className="text-xs text-gray-500 mt-0.5">
                  PDF, JPG/JPEG — glissez-déposez ou cliquez pour sélectionner
                </p>
              )}
            </div>

            {/* Upload button */}
            {!disabled && (
              <div className="flex-shrink-0">
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
              </div>
            )}
          </div>
        )
      })}

      <p className="text-xs text-gray-400">
        Les 5 documents sont obligatoires pour soumettre le plan. Formats acceptés : PDF, JPG/JPEG.
      </p>
    </div>
  )
}
