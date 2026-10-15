import { useState } from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TypeDocumentPermitTravail, DocumentPermitTravail } from '@/types/permitTravail'
import { DOCUMENT_TYPE_LABELS } from '@/types/permitTravail'
import { permitTravailApi } from '@/api/permitTravailApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'
import DocumentTypeRow from '@/components/documents/DocumentTypeRow'

interface PermitDocumentUploadZoneProps {
  permitId: string
  documentTypes: TypeDocumentPermitTravail[]
  uploadedDocuments: DocumentPermitTravail[]
  onUpload: (type: TypeDocumentPermitTravail, file: File, capturedAt?: string) => Promise<void>
  onDelete?: (documentId: string) => Promise<void>
  onToggleNotApplicable?: (type: TypeDocumentPermitTravail, next: boolean) => Promise<void>
  missingTypes?: string[]
  disabled?: boolean
  allowDownload?: boolean
}

export default function PermitDocumentUploadZone({
  permitId,
  documentTypes,
  uploadedDocuments,
  onUpload,
  onDelete,
  onToggleNotApplicable,
  missingTypes = [],
  disabled = false,
  allowDownload = false,
}: PermitDocumentUploadZoneProps) {
  const { t } = useTranslation()
  const pendingUploads = usePendingUploads(
    permitId ? `/api/permits-travail/${permitId}/documents` : undefined,
  )
  const [viewingDoc, setViewingDoc] = useState<{ id: string; label: string } | null>(null)

  return (
    <div className="space-y-3">
      <div className="divide-y divide-gray-200 border-y border-gray-200">
      {documentTypes.map((type) => {
        const pending = pendingUploads.filter((item) => item.type === type)
        const label = DOCUMENT_TYPE_LABELS[type]
        return (
          <DocumentTypeRow
            key={type}
            label={label}
            docs={uploadedDocuments.filter((d) => d.type === type)}
            pending={pending}
            missing={missingTypes.includes(type) && pending.length === 0}
            disabled={disabled}
            loadBlob={(docId) => permitTravailApi.getDocumentBlob(permitId, docId)}
            onView={(doc) => setViewingDoc({ id: doc.id, label })}
            onCapture={({ file, capturedAt }) => onUpload(type, file, capturedAt)}
            onDelete={onDelete}
            onToggleNotApplicable={
              onToggleNotApplicable ? (next) => onToggleNotApplicable(type, next) : undefined
            }
            renderExtra={
              allowDownload
                ? (doc) => (
                    <button
                      type="button"
                      onClick={() =>
                        permitTravailApi.downloadDocument(
                          permitId,
                          doc.id,
                          `${type}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`,
                        )
                      }
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3.5 text-sm font-medium text-gray-800 transition-colors hover:border-gray-400 hover:bg-gray-50 sm:min-h-10"
                    >
                      <Download className="h-4 w-4 text-blue-600" aria-hidden />
                      {t('permitTravail.components.documentUploadZone.downloadButton')}
                    </button>
                  )
                : undefined
            }
          />
        )
      })}
      </div>
      <p className="text-xs text-gray-400">
        {t('permitTravail.components.documentUploadZone.footerNote')}
      </p>

      <DocumentViewerModal
        isOpen={viewingDoc !== null}
        onClose={() => setViewingDoc(null)}
        title={viewingDoc?.label ?? ''}
        blob={viewingDoc ? () => permitTravailApi.getDocumentBlob(permitId, viewingDoc.id) : null}
      />
    </div>
  )
}
