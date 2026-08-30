import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getSyncing,
  setSyncing,
  subscribeSyncing,
  resetSyncingForTests,
} from './syncStatus'

beforeEach(() => {
  resetSyncingForTests()
})

describe('syncStatus', () => {
  it('starts as not syncing', () => {
    expect(getSyncing()).toBe(false)
  })

  it('setSyncing notifies subscribers on change', () => {
    const listener = vi.fn()
    const unsub = subscribeSyncing(listener)

    setSyncing(true)
    expect(getSyncing()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)

    setSyncing(true)
    expect(listener).toHaveBeenCalledTimes(1)

    setSyncing(false)
    expect(getSyncing()).toBe(false)
    expect(listener).toHaveBeenCalledTimes(2)

    unsub()
    setSyncing(true)
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
