import { useState } from 'react'
import { AlertTriangle, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal'
import Checkbox from '@/components/ui/Checkbox'
import PermitDocumentUploadZone from '@/components/permitTravail/PermitDocumentUploadZone'
import type { TypeDocumentPermitTravail, DocumentPermitTravail } from '@/types/permitTravail'

interface CloturerModalProps {
  isOpen: boolean
  permitId: string
  permitReference: string
  isCloturer: boolean
  onClose: () => void
  onCloturer: (id: string, commentaire?: string, accordClient?: boolean) => Promise<unknown>
  requiredDocumentTypes: TypeDocumentPermitTravail[]
  requiredDocumentsLoading?: boolean
  uploadedDocuments: DocumentPermitTravail[]
  onUploadDocument: (type: TypeDocumentPermitTravail, file: File, capturedAt?: string) => Promise<void>
  onDeleteDocument?: (documentId: string) => Promise<void>
  onToggleNotApplicable?: (type: TypeDocumentPermitTravail, next: boolean) => Promise<void>
}

export default function CloturerModal({
  isOpen,
  permitId,
  permitReference,
  isCloturer,
  onClose,
  onCloturer,
  requiredDocumentTypes,
  requiredDocumentsLoading = false,
  uploadedDocuments,
  onUploadDocument,
  onDeleteDocument,
  onToggleNotApplicable,
}: CloturerModalProps) {
  const { t } = useTranslation()
  const [accordClient, setAccordClient] = useState(false)

  const uploadedTypes = new Set(uploadedDocuments.map((d) => d.type))
  const missingTypes = requiredDocumentTypes.filter((type) => !uploadedTypes.has(type))

  return (
    <ConfirmActionModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('permitTravail.components.cloturerModal.title')}
      description={permitReference}
      banner={
        <div className="flex items-start gap-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
          <p
            className="text-xs text-orange-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('permitTravail.components.cloturerModal.banner') }}
          />
        </div>
      }
      commentPlaceholder={t('permitTravail.components.cloturerModal.commentPlaceholder')}
      extraContent={
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              {t('permitTravail.components.cloturerModal.documentsLabel')}
            </p>
            {requiredDocumentsLoading && (
              <p className="mb-2 text-xs text-amber-700">
                {t('permitTravail.components.cloturerModal.documentsLoading')}
              </p>
            )}
            <PermitDocumentUploadZone
              permitId={permitId}
              documentTypes={requiredDocumentTypes}
              uploadedDocuments={uploadedDocuments}
              onUpload={onUploadDocument}
              onDelete={onDeleteDocument}
              onToggleNotApplicable={onToggleNotApplicable}
            />
          </div>
          <Checkbox
            label={t('permitTravail.components.cloturerModal.accordClientLabel')}
            checked={accordClient}
            onChange={(e) => setAccordClient(e.target.checked)}
            disabled={isCloturer}
          />
        </div>
      }
      confirmLabel={t('permitTravail.components.cloturerModal.confirmLabel')}
      confirmVariant="danger"
      confirmIcon={<Lock className="mr-2 h-4 w-4" />}
      confirmDisabled={requiredDocumentsLoading || missingTypes.length > 0}
      isSubmitting={isCloturer}
      onConfirm={async (commentaire) => {
        await onCloturer(permitId, commentaire || undefined, accordClient)
      }}
      errorMessage={t('permitTravail.components.cloturerModal.errorMessage')}
    />
  )
}
