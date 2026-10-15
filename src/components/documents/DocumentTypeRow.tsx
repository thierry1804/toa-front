import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, XCircle, Clock, Trash2, Loader2 } from 'lucide-react'
import { PressableCard } from '@/components/ui/PressableCard'
import CaptureButtons, { type CapturedFile } from '@/components/documents/CaptureButtons'
import DocumentThumb from '@/components/documents/DocumentThumb'
import { isOfflineQueued } from '@/offline/offlineError'
import type { PendingUpload } from '@/hooks/usePendingUploads'
import { formatCapturedAt } from '@/utils/capturedAt'

export interface TypedDocument {
  id: string
  mimeType: string
  uploadedAt: string
  capturedAt?: string | null
  nonApplicable?: boolean
  consultedAt?: string | null
}

interface DocumentTypeRowProps {
  label: string
  docs: TypedDocument[]
  pending: PendingUpload[]
  missing: boolean
  disabled: boolean
  loadBlob: (docId: string) => Promise<Blob>
  onView: (doc: TypedDocument) => void
  onCapture: (item: CapturedFile) => Promise<void>
  onDelete?: (docId: string) => Promise<void>
  onToggleNotApplicable?: (next: boolean) => Promise<void>
  showConsulted?: boolean
  renderExtra?: (doc: TypedDocument) => ReactNode
  footnote?: string
}

export default function DocumentTypeRow({
  label,
  docs,
  pending,
  missing,
  disabled,
  loadBlob,
  onView,
  onCapture,
  onDelete,
  onToggleNotApplicable,
  showConsulted = false,
  renderExtra,
  footnote,
}: DocumentTypeRowProps) {
  const { t } = useTranslation()
  const [uploading, setUploading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)

  const isNotApplicable = docs.some((d) => d.nonApplicable)
  const photos = docs.filter((d) => !d.nonApplicable)
  const satisfied = isNotApplicable || photos.length > 0
  const hasPending = pending.length > 0

  // The mutation hooks toast API failures; an offline-queued call is not an error. Callers only need the busy state reset.
  const handleCapture = async (item: CapturedFile) => {
    setUploading(true)
    try {
      await onCapture(item)
    } catch (err) {
      if (!isOfflineQueued(err)) throw err
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!onDelete) return
    setBusyId(docId)
    try {
      await onDelete(docId)
    } catch {
      // already toasted by the delete hook
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleNa = async (next: boolean) => {
    if (!onToggleNotApplicable) return
    setBusyId('na')
    try {
      await onToggleNotApplicable(next)
    } catch {
      // already toasted by the non-applicable hook
    } finally {
      setBusyId(null)
    }
  }

  const tone = hasPending
    ? 'border-amber-300 bg-amber-50'
    : satisfied
      ? 'border-green-300 bg-green-50'
      : missing && !isNotApplicable
        ? 'border-red-300 bg-red-50'
        : 'border-dashed border-gray-300 bg-white'

  return (
    <div className={`rounded-lg border-2 px-4 py-3 transition-all ${tone}`}>
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {hasPending ? (
            <Clock className="h-6 w-6 text-amber-600" />
          ) : satisfied ? (
            <CheckCircle className="h-6 w-6 text-green-500" />
          ) : (
            <XCircle className={`h-6 w-6 ${missing ? 'text-red-500' : 'text-gray-300'}`} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800">{label}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {hasPending
              ? t('offline.pendingUpload')
              : isNotApplicable
                ? t('documents.notApplicableDone')
                : photos.length > 0
                  ? t('documents.photoCount', { count: photos.length })
                  : disabled
                    ? '—'
                    : t('documents.cameraHint')}
          </p>
        </div>

        {!disabled && !isNotApplicable && (
          <div className="flex-shrink-0">
            <CaptureButtons
              onCapture={handleCapture}
              uploading={uploading}
              hasPhotos={photos.length > 0}
              multiple
            />
          </div>
        )}

        {onToggleNotApplicable && (!disabled || isNotApplicable) && (
          <label
            title={t('documents.notApplicableTitle')}
            className="flex flex-shrink-0 cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600"
          >
            {busyId === 'na' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <input
                type="checkbox"
                checked={isNotApplicable}
                disabled={disabled || busyId === 'na'}
                onChange={(e) => void handleToggleNa(e.target.checked)}
              />
            )}
            {t('documents.notApplicable')}
          </label>
        )}
      </div>

      {(photos.length > 0 || hasPending) && (
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-md border border-amber-200 bg-white px-2 py-1.5">
              {p.previewUrl ? (
                <img src={p.previewUrl} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
              ) : (
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              )}
              <span className="min-w-0 truncate text-xs text-amber-800">
                {p.filename ?? t('offline.pendingUpload')}
              </span>
            </li>
          ))}
          {photos.map((doc) => {
            const when = formatCapturedAt(doc.capturedAt, doc.uploadedAt)
            return (
              <li key={doc.id} className="sm:col-span-1">
                {/* Toute la ligne ouvre le document (plus de bouton « Voir ») ; les boutons Télécharger et Supprimer
                    restent sur leur propre ligne d'actions, sans ouvrir le document. */}
                <PressableCard
                  onOpen={() => onView(doc)}
                  label={`${t('documents.view')} — ${label}`}
                  chevron={false}
                  className="items-start gap-3 rounded-md p-2.5"
                >
                  <div className="flex items-start gap-3">
                    <DocumentThumb mimeType={doc.mimeType} loadBlob={() => loadBlob(doc.id)} sizeClass="h-16 w-16" />
                    <div className="min-w-0 flex-1">
                      {when && <p className="text-sm text-gray-700">{t('documents.capturedAt', { date: when })}</p>}
                      {showConsulted && (
                        <p className={`text-xs ${doc.consultedAt ? 'text-green-600' : 'text-amber-600'}`}>
                          {doc.consultedAt ? t('documents.consulted') : t('documents.notConsulted')}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {renderExtra?.(doc)}
                        {!disabled && onDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(doc.id)}
                            disabled={busyId === doc.id}
                            title={t('documents.delete')}
                            aria-label={t('documents.delete')}
                            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 sm:h-9 sm:w-9"
                          >
                            {busyId === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </PressableCard>
              </li>
            )
          })}
        </ul>
      )}
      {footnote && <p className="mt-2 text-xs text-gray-400">{footnote}</p>}
    </div>
  )
}
