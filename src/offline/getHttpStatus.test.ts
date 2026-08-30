import { describe, it, expect } from 'vitest'
import { getHttpStatus, snapshotErrorCode } from './getHttpStatus'

describe('getHttpStatus', () => {
  it('reads Axios-style response.status', () => {
    expect(getHttpStatus({ response: { status: 413 } })).toBe(413)
  })

  it('returns undefined for network errors', () => {
    expect(getHttpStatus(new Error('offline'))).toBeUndefined()
  })
})

describe('snapshotErrorCode', () => {
  it('maps 403 / 429 / 413 / network', () => {
    expect(snapshotErrorCode({ response: { status: 403 } })).toBe('forbidden')
    expect(snapshotErrorCode({ response: { status: 429 } })).toBe('rateLimited')
    expect(snapshotErrorCode({ response: { status: 413 } })).toBe('tooLarge')
    expect(snapshotErrorCode(new Error('fail'))).toBe('network')
    expect(snapshotErrorCode({ response: { status: 500 } })).toBe('unknown')
  })
})
