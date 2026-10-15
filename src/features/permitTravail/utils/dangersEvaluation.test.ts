import { describe, expect, it } from 'vitest'
import type { DangerEntry } from '@/types/permitTravail'
import { getDangersFormIssue } from './dangersEvaluation'

const entry = (patch: Partial<DangerEntry> = {}): DangerEntry => ({
  dangers: 'Chute',
  moyensMaitrise: 'Harnais',
  evaluationPreliminaire: 'rouge',
  evaluationFinale: 'vert',
  ...patch,
})

describe('getDangersFormIssue (R-22)', () => {
  it('requires at least one filled entry', () => {
    expect(getDangersFormIssue([entry({ dangers: '', moyensMaitrise: '', evaluationPreliminaire: '', evaluationFinale: '' })])).toBe('empty')
  })
  it('blocks an incomplete entry', () => {
    expect(getDangersFormIssue([entry({ moyensMaitrise: '' })])).toBe('incomplete')
    expect(getDangersFormIssue([entry({ evaluationFinale: '' })])).toBe('incomplete')
  })
  it('blocks a final level that does not reduce the risk', () => {
    expect(getDangersFormIssue([entry({ evaluationPreliminaire: 'jaune', evaluationFinale: 'jaune' })])).toBe('no_reduction')
    expect(getDangersFormIssue([entry({ evaluationPreliminaire: 'vert', evaluationFinale: 'rouge' })])).toBe('no_reduction')
  })
  it('accepts a complete entry with a lower final level', () => {
    expect(getDangersFormIssue([entry()])).toBeNull()
    expect(getDangersFormIssue([entry({ evaluationPreliminaire: 'jaune', evaluationFinale: 'vert' })])).toBeNull()
  })
})
