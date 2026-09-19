import { describe, it, expect } from 'vitest'
import type { SectionPlanifieeItem } from '@/types'
import { ownSections, planSections } from './planSections'

const section = (id: string): SectionPlanifieeItem => ({ id, libelle: id, ordre: 0, taches: [] })

describe('planSections (read-only display)', () => {
  it('returns [] without a plan', () => {
    expect(planSections(null)).toEqual([])
    expect(planSections(undefined)).toEqual([])
  })

  it("prefers the plan's own sections", () => {
    expect(planSections({ sections: [section('own')], planificationSections: [section('legacy')] })).toEqual([
      section('own'),
    ])
  })

  it('keeps an emptied plan empty instead of resurrecting the planification sections', () => {
    expect(planSections({ sections: [], planificationSections: [section('legacy')] })).toEqual([])
  })

  it('falls back to the planification sections only when the payload has no `sections` at all', () => {
    expect(planSections({ planificationSections: [section('legacy')] })).toEqual([section('legacy')])
    expect(planSections({ sections: null, planificationSections: [section('legacy')] })).toEqual([section('legacy')])
  })
})

describe('ownSections (edit forms and PATCH payloads)', () => {
  it('never returns planification ids', () => {
    expect(ownSections({ sections: undefined })).toEqual([])
    expect(ownSections({ sections: [section('own')] })).toEqual([section('own')])
    expect(ownSections(null)).toEqual([])
  })
})
