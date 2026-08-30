import { describe, it, expect } from 'vitest'
import { shouldDrainSync } from './shouldDrainSync'

describe('shouldDrainSync', () => {
  it('drains on first run when online', () => {
    expect(shouldDrainSync({ isFirstRun: true, wasOnline: true, isOnline: true })).toBe(true)
  })

  it('does not drain on first run when offline', () => {
    expect(shouldDrainSync({ isFirstRun: true, wasOnline: false, isOnline: false })).toBe(false)
  })

  it('drains on offline to online transition', () => {
    expect(shouldDrainSync({ isFirstRun: false, wasOnline: false, isOnline: true })).toBe(true)
  })

  it('does not drain when staying online', () => {
    expect(shouldDrainSync({ isFirstRun: false, wasOnline: true, isOnline: true })).toBe(false)
  })
})
