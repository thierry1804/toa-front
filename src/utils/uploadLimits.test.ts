import { describe, it, expect } from 'vitest'
import { checkUploadFile, MAX_UPLOAD_BYTES } from './uploadLimits'

describe('checkUploadFile', () => {
  it('accepts PDF and common image formats within the size limit', () => {
    for (const type of ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']) {
      expect(checkUploadFile({ type, size: 1024 })).toBeNull()
    }
  })

  it('rejects unsupported types such as HEIC', () => {
    expect(checkUploadFile({ type: 'image/heic', size: 1024 })).toBe('unsupportedType')
    expect(checkUploadFile({ type: '', size: 1024 })).toBe('unsupportedType')
  })

  it('rejects files over the back limit but accepts the exact limit', () => {
    expect(checkUploadFile({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES })).toBeNull()
    expect(checkUploadFile({ type: 'image/jpeg', size: MAX_UPLOAD_BYTES + 1 })).toBe('tooLarge')
  })
})
