import { useState } from 'react'
import { X } from 'lucide-react'
import CaptureButtons, { type CapturedFile } from '@/components/documents/CaptureButtons'
import DocumentThumb from '@/components/documents/DocumentThumb'

interface RowPhotoCellProps {
  photoDocumentId?: string | null
  /** Récupère le blob de la photo (plan de prévention ou permis de travail selon l'appelant). */
  loadBlob?: (documentId: string) => Promise<Blob>
  /** R-09 : photo exigée (processus « Nouveau site ») ; sinon la ligne affiche « N/A ». */
  required: boolean
  readonly?: boolean
  /** Signale une photo manquante après une tentative de validation. */
  missing?: boolean
  onUpload?: (item: CapturedFile) => Promise<void>
  onRemove?: () => Promise<void>
  onView?: (documentId: string) => void
}

/** Photo d'une ligne des listes installations / équipements (plan de prévention ou permis Général). */
export default function RowPhotoCell({
  photoDocumentId,
  loadBlob,
  required,
  readonly = false,
  missing = false,
  onUpload,
  onRemove,
  onView,
}: RowPhotoCellProps) {
  const [busy, setBusy] = useState(false)

  if (photoDocumentId && loadBlob) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onView?.(photoDocumentId)}
          disabled={!onView}
          className="rounded-lg disabled:cursor-default"
          title="Voir la photo"
        >
          <DocumentThumb
            key={photoDocumentId}
            mimeType="image/jpeg"
            loadBlob={() => loadBlob(photoDocumentId)}
            openHint={!!onView}
          />
        </button>
        {!readonly && onRemove && (
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onRemove()
              } finally {
                setBusy(false)
              }
            }}
            className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
            title="Retirer la photo"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  if (!required) {
    return <span className="text-sm text-gray-400">N/A</span>
  }

  if (readonly || !onUpload) {
    return <span className="text-sm text-red-600">Photo manquante</span>
  }

  return (
    <div className={missing ? 'rounded-lg ring-1 ring-red-400 p-1' : undefined}>
      <CaptureButtons
        uploading={busy}
        onCapture={async (item) => {
          setBusy(true)
          try {
            await onUpload(item)
          } finally {
            setBusy(false)
          }
        }}
      />
      {missing && <p className="mt-1 text-xs text-red-600">Photo obligatoire</p>}
    </div>
  )
}
