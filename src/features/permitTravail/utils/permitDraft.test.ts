import { describe, expect, it } from 'vitest'
import { canEditDraft } from './permitDraft'
import type { PermitTravail } from '@/types/permitTravail'

const refus = [{ decision: 'REFUSE' }] as unknown as PermitTravail['decisionsHse']
const rights = { canEdit: true, canResoumettre: false }

describe('canEditDraft (R-24)', () => {
  it('lets a never-refused draft (e.g. a renewal) be completed with the edit right', () => {
    expect(canEditDraft({ statut: 'BROUILLON', decisionsHse: [] }, rights)).toBe(true)
    expect(canEditDraft({ statut: 'BROUILLON', decisionsHse: undefined }, rights)).toBe(true)
  })

  it('requires the edit right for a never-refused draft', () => {
    expect(canEditDraft({ statut: 'BROUILLON', decisionsHse: [] }, { canEdit: false, canResoumettre: true })).toBe(false)
  })

  it('keeps refused drafts behind the resubmit right', () => {
    expect(canEditDraft({ statut: 'BROUILLON', decisionsHse: refus }, rights)).toBe(false)
    expect(canEditDraft({ statut: 'BROUILLON', decisionsHse: refus }, { canEdit: false, canResoumettre: true })).toBe(true)
  })

  it('never allows editing outside the draft status', () => {
    expect(canEditDraft({ statut: 'SOUMIS', decisionsHse: [] }, { canEdit: true, canResoumettre: true })).toBe(false)
  })
})
