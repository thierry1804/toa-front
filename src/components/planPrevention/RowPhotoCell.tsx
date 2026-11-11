import { useState } from 'react'
import { X } from 'lucide-react'
import CaptureButtons, { type CapturedFile } from '@/components/documents/CaptureButtons'
import DocumentThumb from '@/components/documents/DocumentThumb'

interface RowPhotoCellProps {
  photoDocumentId?: string | null
  /** Récupère le blob de la photo (plan de prévention ou permis de travail selon l'appelant). */
  loadBlob?: (documentId: string) => Promise<Blob>
  /** R-09 : photo exigée (processus « Nouveau site ») ; sinon optionnelle, avec case N/A explicite. */
  required: boolean
  readonly?: boolean
  /** Signale une photo manquante après une tentative de validation. */
  missing?: boolean
  /** Ligne marquée explicitement « non applicable » (uniquement quand !required). */
  nonApplicable?: boolean
  onUpload?: (item: CapturedFile) => Promise<void>
  onRemove?: () => Promise<void>
  onView?: (documentId: string) => void
  onToggleNonApplicable?: (next: boolean) => Promise<void>
}

/** Photo d'une ligne des listes installations / équipements (plan de prévention ou permis Général). */
export default function RowPhotoCell({
  photoDocumentId,
  loadBlob,
  required,
  readonly = false,
  missing = false,
  nonApplicable = false,
  onUpload,
  onRemove,
  onView,
  onToggleNonApplicable,
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

  if (readonly || !onUpload) {
    if (!required) {
      return <span className="text-sm text-gray-400">N/A</span>
    }
    return <span className="text-sm text-red-600">Photo manquante</span>
  }

  const handleToggleNa = async (next: boolean) => {
    if (!onToggleNonApplicable) return
    setBusy(true)
    try {
      await onToggleNonApplicable(next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {nonApplicable ? (
        <span className="text-sm text-gray-400">N/A</span>
      ) : (
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
      )}
      {!required && onToggleNonApplicable && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
          <input
            type="checkbox"
            className="h-3.5 w-3.5"
            checked={nonApplicable}
            disabled={busy}
            onChange={(e) => void handleToggleNa(e.target.checked)}
          />
          N/A
        </label>
      )}
    </div>
  )
}
