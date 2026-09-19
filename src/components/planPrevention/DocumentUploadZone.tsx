import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TypeDocumentPrevention, DocumentPrevention } from '@/types/planPrevention'
import { TYPES_DOCUMENT_LABELS, ALL_DOCUMENT_TYPES } from '@/types/planPrevention'
import { planPreventionApi } from '@/api/planPreventionApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'
import DocumentTypeRow from '@/components/documents/DocumentTypeRow'

interface DocumentUploadZoneProps {
  planId: string
  uploadedDocuments: DocumentPrevention[]
  onUpload: (type: TypeDocumentPrevention, file: File, capturedAt?: string) => Promise<void>
  onDelete?: (documentId: string) => Promise<void>
  onToggleNotApplicable?: (type: TypeDocumentPrevention, next: boolean) => Promise<void>
  missingTypes?: string[]
  disabled?: boolean
}

export default function DocumentUploadZone({
  planId,
  uploadedDocuments,
  onUpload,
  onDelete,
  onToggleNotApplicable,
  missingTypes = [],
  disabled = false,
}: DocumentUploadZoneProps) {
  const { t } = useTranslation()
  const pendingUploads = usePendingUploads(
    planId ? `/api/plans-prevention/${planId}/documents` : undefined,
  )
  const [viewingDoc, setViewingDoc] = useState<{ id: string; label: string } | null>(null)

  return (
    <div className="space-y-3">
      {ALL_DOCUMENT_TYPES.map((type) => {
        const pending = pendingUploads.filter((item) => item.type === type)
        const label = TYPES_DOCUMENT_LABELS[type]
        return (
          <DocumentTypeRow
            key={type}
            label={label}
            docs={uploadedDocuments.filter((d) => d.type === type)}
            pending={pending}
            missing={missingTypes.includes(type) && pending.length === 0}
            disabled={disabled || !planId}
            loadBlob={(docId) => planPreventionApi.getDocumentBlob(planId, docId)}
            onView={(doc) => setViewingDoc({ id: doc.id, label })}
            onCapture={({ file, capturedAt }) => onUpload(type, file, capturedAt)}
            onDelete={onDelete}
            onToggleNotApplicable={
              onToggleNotApplicable ? (next) => onToggleNotApplicable(type, next) : undefined
            }
          />
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
