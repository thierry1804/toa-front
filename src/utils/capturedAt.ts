export type CaptureSource = 'camera' | 'file'

export function resolveCapturedAt(source: CaptureSource, file: File): string {
  const now = Date.now()
  const at = source === 'file' && file.lastModified > 0 && file.lastModified <= now ? file.lastModified : now
  return new Date(at).toISOString()
}

export function formatCapturedAt(capturedAt?: string | null, uploadedAt?: string | null): string | null {
  const value = capturedAt ?? uploadedAt
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('fr-FR')
}

export interface CaptureParts {
  /** Jour en toutes lettres, ex. « 2 octobre 2026 ». */
  day: string
  /** Jour abrégé pour les écrans étroits, ex. « 2 oct. 2026 ». */
  dayShort: string
  /** Heure et minutes, ex. « 16:49 ». */
  time: string
  /** Vrai si l'horodatage vient de la prise de vue, faux s'il s'agit de la date d'ajout du fichier. */
  captured: boolean
}

/** Date lisible d'un document en deux parties (jour, heure), pour un affichage soigné plutôt qu'un horodatage brut. */
export function formatCaptureParts(capturedAt?: string | null, uploadedAt?: string | null, locale = 'fr-FR'): CaptureParts | null {
  const value = capturedAt ?? uploadedAt
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return {
    day: d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' }),
    dayShort: d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }),
    captured: Boolean(capturedAt),
  }
}

const CAPTURED_AT_ERROR_KEYS: Record<string, string> = {
  captured_at_invalid: 'documents.uploadErrors.capturedAtInvalid',
  captured_at_in_future: 'documents.uploadErrors.capturedAtInFuture',
  captured_at_too_old: 'documents.uploadErrors.capturedAtTooOld',
}

/** i18n key of the message matching a back `captured_at_*` 422, or null for any other error. */
export function capturedAtErrorKey(err: unknown): string | null {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
  if (!data) return null
  const text = [data.detail, data['hydra:description'], data.message, data.error_key]
    .filter((v): v is string => typeof v === 'string')
    .join(' ')
  const code = Object.keys(CAPTURED_AT_ERROR_KEYS).find((c) => text.includes(c))
  return code ? CAPTURED_AT_ERROR_KEYS[code] : null
}
