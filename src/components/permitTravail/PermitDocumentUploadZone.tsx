import { useState } from 'react'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DocumentPermitTravail, DocumentRequisLigne } from '@/types/permitTravail'
import { permitTravailApi } from '@/api/permitTravailApi'
import { usePendingUploads } from '@/hooks/usePendingUploads'
import DocumentViewerModal from '@/components/documents/DocumentViewerModal'
import DocumentTypeRow from '@/components/documents/DocumentTypeRow'

interface PermitDocumentUploadZoneProps {
  permitId: string
  documentTypes: DocumentRequisLigne[]
  uploadedDocuments: DocumentPermitTravail[]
  onUpload: (type: string, file: File, capturedAt?: string) => Promise<void>
  onDelete?: (documentId: string) => Promise<void>
  onToggleNotApplicable?: (type: string, next: boolean) => Promise<void>
  missingTypes?: string[]
  disabled?: boolean
  allowDownload?: boolean
  /** Affiche l'état consulté / non consulté et enregistre l'ouverture. */
  showConsulted?: boolean
  onConsulted?: (documentId: string) => void
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
  showConsulted = false,
  onConsulted,
}: PermitDocumentUploadZoneProps) {
  const { t } = useTranslation()
  const pendingUploads = usePendingUploads(
    permitId ? `/api/permits-travail/${permitId}/documents` : undefined,
  )
  const [viewingDoc, setViewingDoc] = useState<{ id: string; label: string } | null>(null)

  return (
    <div className="space-y-3">
      <div className="divide-y divide-gray-200 border-y border-gray-200">
      {documentTypes.map((ligne) => {
        const pending = pendingUploads.filter((item) => item.type === ligne.code)
        const label = ligne.libelle || ligne.code
        return (
          <DocumentTypeRow
            key={ligne.code}
            label={label}
            docs={uploadedDocuments.filter((d) => d.type === ligne.code)}
            pending={pending}
            missing={missingTypes.includes(ligne.code) && pending.length === 0}
            disabled={disabled}
            showConsulted={showConsulted}
            loadBlob={(docId) => permitTravailApi.getDocumentBlob(permitId, docId)}
            onView={(doc) => setViewingDoc({ id: doc.id, label })}
            onCapture={({ file, capturedAt }) => onUpload(ligne.code, file, capturedAt)}
            onDelete={onDelete}
            onToggleNotApplicable={
              onToggleNotApplicable && !ligne.obligatoire ? (next) => onToggleNotApplicable(ligne.code, next) : undefined
            }
            renderExtra={
              allowDownload
                ? (doc) => (
                    <button
                      type="button"
                      onClick={() => {
                        onConsulted?.(doc.id)
                        void permitTravailApi.downloadDocument(
                          permitId,
                          doc.id,
                          `${ligne.code}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`,
                        )
                      }}
                      title={t('permitTravail.components.documentUploadZone.downloadButton')}
                      aria-label={t('permitTravail.components.documentUploadZone.downloadButton')}
                      className="flex items-center justify-center text-gray-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Download className="h-[18px] w-[18px]" aria-hidden />
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
        onLoaded={viewingDoc && onConsulted ? () => onConsulted(viewingDoc.id) : undefined}
      />
    </div>
  )
}
