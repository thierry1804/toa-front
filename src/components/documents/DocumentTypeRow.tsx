import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle2, CircleDashed, Clock, MinusCircle, Trash2, Loader2 } from 'lucide-react'
import { PressableCard } from '@/components/ui/PressableCard'
import CaptureButtons, { type CapturedFile } from '@/components/documents/CaptureButtons'
import DocumentThumb from '@/components/documents/DocumentThumb'
import { isOfflineQueued } from '@/offline/offlineError'
import type { PendingUpload } from '@/hooks/usePendingUploads'
import { formatCaptureParts } from '@/utils/capturedAt'

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
  const { t, i18n } = useTranslation()
  const locale = i18n?.language?.startsWith('mg') ? 'mg-MG' : 'fr-FR'
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

  // Ligne à plat (pas de cadre coloré ni de carte dans la carte) : l'état se lit par l'icône et par un mot,
  // la couleur n'est jamais seule. Les zones parentes posent le conteneur et les filets entre lignes.
  const StatusIcon = hasPending ? Clock : isNotApplicable ? MinusCircle : satisfied ? CheckCircle2 : missing ? AlertCircle : CircleDashed
  const iconTone = hasPending
    ? 'text-amber-600'
    : isNotApplicable
      ? 'text-gray-400'
      : satisfied
        ? 'text-green-600'
        : missing
          ? 'text-red-600'
          : 'text-gray-300'
  const statusText = hasPending
    ? t('offline.pendingUpload')
    : isNotApplicable
      ? t('documents.notApplicableDone')
      : photos.length > 0
        ? t('documents.photoCount', { count: photos.length })
        : missing
          ? t('documents.missing')
          : disabled
            ? '—'
            : ''
  const statusTone = hasPending ? 'text-amber-700' : !satisfied && missing && !isNotApplicable ? 'font-medium text-red-700' : 'text-gray-500'

  return (
    <div className="py-3.5">
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 gap-y-2">
        <StatusIcon className={`mt-0.5 h-5 w-5 ${iconTone}`} aria-hidden />

        <div className="min-w-0">
          <p className="text-[15px] font-medium leading-snug text-gray-900">{label}</p>
          {statusText && <p className={`mt-0.5 text-sm ${statusTone}`}>{statusText}</p>}
        </div>

        {onToggleNotApplicable && (!disabled || isNotApplicable) ? (
          <label
            title={t('documents.notApplicableTitle')}
            className="-my-1.5 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            {busyId === 'na' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isNotApplicable}
                disabled={disabled || busyId === 'na'}
                onChange={(e) => void handleToggleNa(e.target.checked)}
              />
            )}
            {t('documents.notApplicable')}
          </label>
        ) : (
          <span />
        )}

        {!disabled && !isNotApplicable && (
          <div className="col-start-2 col-end-4">
            <CaptureButtons
              onCapture={handleCapture}
              uploading={uploading}
              hasPhotos={photos.length > 0}
              multiple
            />
          </div>
        )}

        {(photos.length > 0 || hasPending) && (
          <ul className="col-start-2 col-end-4 space-y-1">
            {pending.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-1">
                {p.previewUrl ? (
                  <img src={p.previewUrl} alt="" className="h-14 w-14 flex-shrink-0 rounded-md object-cover" />
                ) : (
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                )}
                <span className="min-w-0 truncate text-sm text-amber-800">{p.filename ?? t('offline.pendingUpload')}</span>
              </li>
            ))}
            {photos.map((doc) => {
              const when = formatCaptureParts(doc.capturedAt, doc.uploadedAt, locale)
              return (
                <li key={doc.id}>
                  {/* Toute la ligne ouvre le document (pas de bouton « Voir ») ; Télécharger et Supprimer
                      gardent leur propre zone et n'ouvrent pas le document. */}
                  <PressableCard
                    onOpen={() => onView(doc)}
                    label={`${t('documents.view')} — ${label}`}
                    chevron={false}
                    className="-mx-2 items-center rounded-lg border-0 bg-transparent p-2 hover:bg-gray-50"
                  >
                    {/* Trois zones : vignette | métadonnées | actions d'icônes à l'extrême droite. La ligne entière ouvre
                        le document ; les icônes (télécharger, supprimer) ont leur propre cible de 44 px. */}
                    <div className="flex items-center gap-3.5">
                      <DocumentThumb mimeType={doc.mimeType} loadBlob={() => loadBlob(doc.id)} sizeClass="h-16 w-16 sm:h-[72px] sm:w-[72px]" openHint />
                      <div className="min-w-0 flex-1">
                        {when && (
                          <>
                            <p className="text-[15px] font-medium leading-tight text-gray-900">
                              <span className="sm:hidden">{when.dayShort}</span>
                              <span className="hidden sm:inline">{when.day}</span>
                            </p>
                            <p className="mt-0.5 text-sm text-gray-500">
                              {t(when.captured ? 'documents.capturedAtTime' : 'documents.uploadedAtTime', { time: when.time })}
                            </p>
                          </>
                        )}
                        {showConsulted && (
                          <p className={`text-xs ${doc.consultedAt ? 'text-green-600' : 'text-amber-600'}`}>
                            {doc.consultedAt ? t('documents.consulted') : t('documents.notConsulted')}
                          </p>
                        )}
                      </div>
                      <div className="-mr-2 flex flex-shrink-0 items-center">
                        {renderExtra?.(doc)}
                        {!disabled && onDelete && (
                          <button
                            type="button"
                            onClick={() => void handleDelete(doc.id)}
                            disabled={busyId === doc.id}
                            title={t('documents.delete')}
                            aria-label={t('documents.delete')}
                            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            {busyId === doc.id ? <Loader2 className="h-[18px] w-[18px] animate-spin" /> : <Trash2 className="h-[18px] w-[18px]" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </PressableCard>
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {footnote && <p className="mt-2 text-xs text-gray-400">{footnote}</p>}
    </div>
  )
}
