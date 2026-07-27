import { describe, it, expect } from 'vitest'
import { OfflineQueuedError, isOfflineQueued } from './offlineError'

describe('OfflineQueuedError', () => {
  it('is instanceof Error', () => {
    expect(new OfflineQueuedError()).toBeInstanceOf(Error)
  })

  it('has queued = true', () => {
    expect(new OfflineQueuedError().queued).toBe(true)
  })

  it('has correct name', () => {
    expect(new OfflineQueuedError().name).toBe('OfflineQueuedError')
  })

  it('isOfflineQueued returns true for OfflineQueuedError', () => {
    expect(isOfflineQueued(new OfflineQueuedError())).toBe(true)
  })

  it('isOfflineQueued returns false for regular Error', () => {
    expect(isOfflineQueued(new Error('regular'))).toBe(false)
  })

  it('isOfflineQueued returns false for string', () => {
    expect(isOfflineQueued('offline')).toBe(false)
  })

  it('isOfflineQueued returns false for null', () => {
    expect(isOfflineQueued(null)).toBe(false)
  })
})
