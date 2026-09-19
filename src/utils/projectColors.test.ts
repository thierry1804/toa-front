import { describe, it, expect } from 'vitest'
import { INTERVENTION_TYPES } from '@/data/constant/planning'
import { projectColor } from './projectColors'

describe('projectColor', () => {
  it('is stable for the same project type regardless of case/spacing', () => {
    expect(projectColor('Nouveau site')).toEqual(projectColor('  nouveau SITE '))
  })

  it('falls back to a neutral color when type is missing', () => {
    expect(projectColor(null)).toEqual(projectColor(''))
    expect(projectColor(undefined).bar).toBe('bg-gray-400')
  })

  it('gives every known project type a distinct color', () => {
    const bars = INTERVENTION_TYPES.map((type) => projectColor(type).bar)
    expect(new Set(bars).size).toBe(INTERVENTION_TYPES.length)
  })

  it('still returns a palette color for an unknown type', () => {
    expect(projectColor('Type inconnu').bar).not.toBe('bg-gray-400')
  })
})
