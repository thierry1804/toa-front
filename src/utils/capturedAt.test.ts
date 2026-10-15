import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveCapturedAt, formatCapturedAt, capturedAtErrorKey } from './capturedAt'

const NOW = new Date('2026-09-15T10:00:00.000Z').getTime()

function fileModifiedAt(ts: number): File {
  return new File(['x'], 'photo.jpg', { type: 'image/jpeg', lastModified: ts })
}

describe('resolveCapturedAt', () => {
  afterEach(() => vi.useRealTimers())

  it('uses the current time for a camera capture', () => {
    vi.useFakeTimers().setSystemTime(NOW)
    expect(resolveCapturedAt('camera', fileModifiedAt(NOW - 86_400_000))).toBe('2026-09-15T10:00:00.000Z')
  })

  it('uses the file modification time for an imported file', () => {
    vi.useFakeTimers().setSystemTime(NOW)
    const ts = new Date('2026-09-10T08:30:00.000Z').getTime()
    expect(resolveCapturedAt('file', fileModifiedAt(ts))).toBe('2026-09-10T08:30:00.000Z')
  })

  it('never sends a future modification time for an imported file', () => {
    vi.useFakeTimers().setSystemTime(NOW)
    expect(resolveCapturedAt('file', fileModifiedAt(NOW + 3_600_000))).toBe('2026-09-15T10:00:00.000Z')
  })

  it('falls back to now when the file has no modification time', () => {
    vi.useFakeTimers().setSystemTime(NOW)
    expect(resolveCapturedAt('file', fileModifiedAt(0))).toBe('2026-09-15T10:00:00.000Z')
  })
})

describe('formatCapturedAt', () => {
  it('prefers capturedAt over uploadedAt', () => {
    const out = formatCapturedAt('2026-09-10T08:30:00.000Z', '2026-09-15T10:00:00.000Z')
    expect(out).toBe(new Date('2026-09-10T08:30:00.000Z').toLocaleString('fr-FR'))
  })

  it('falls back to uploadedAt then null', () => {
    expect(formatCapturedAt(null, '2026-09-15T10:00:00.000Z')).not.toBeNull()
    expect(formatCapturedAt(null, null)).toBeNull()
    expect(formatCapturedAt('not-a-date', null)).toBeNull()
  })
})

describe('capturedAtErrorKey', () => {
  const apiError = (detail: string) => ({ response: { data: { detail } } })

  it('maps each back captured_at_* code to its i18n key', () => {
    expect(capturedAtErrorKey(apiError('captured_at_invalid'))).toBe('documents.uploadErrors.capturedAtInvalid')
    expect(capturedAtErrorKey(apiError('captured_at_in_future'))).toBe('documents.uploadErrors.capturedAtInFuture')
    expect(capturedAtErrorKey(apiError('captured_at_too_old'))).toBe('documents.uploadErrors.capturedAtTooOld')
  })

  it('reads the hydra description too', () => {
    const err = { response: { data: { 'hydra:description': 'captured_at_too_old' } } }
    expect(capturedAtErrorKey(err)).toBe('documents.uploadErrors.capturedAtTooOld')
  })

  it('returns null for any other error', () => {
    expect(capturedAtErrorKey(apiError('Type de document invalide'))).toBeNull()
    expect(capturedAtErrorKey(new Error('boom'))).toBeNull()
    expect(capturedAtErrorKey(undefined)).toBeNull()
  })
})

describe('formatCaptureParts', () => {
  it('splits a capture time into a spelled-out day and the time, and says whether it was captured or only uploaded', async () => {
    const { formatCaptureParts } = await import('./capturedAt')
    const captured = formatCaptureParts('2026-10-02T13:49:32.000Z', null, 'fr-FR')
    expect(captured?.day).toBe('2 octobre 2026')
    expect(captured?.time).toMatch(/^\d{2}:\d{2}$/)
    expect(captured?.captured).toBe(true)
    expect(formatCaptureParts(null, '2026-10-02T13:49:32.000Z', 'fr-FR')?.captured).toBe(false)
  })
  it('returns null when there is no usable date', async () => {
    const { formatCaptureParts } = await import('./capturedAt')
    expect(formatCaptureParts(null, null)).toBeNull()
    expect(formatCaptureParts('not a date', null)).toBeNull()
  })
})
