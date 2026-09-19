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
