import { describe, expect, it } from 'vitest'
import { getPermitCreationTransition } from './permitCreationTransition'

describe('getPermitCreationTransition', () => {
  it('returns to companion selection after creating the General permit for a new site', () => {
    expect(getPermitCreationTransition('NOUVEAU_SITE', 'GENERAL')).toEqual({
      step: 0,
      typePermis: 'ELECTRIQUE',
      resetDraft: true,
    })
  })

  it('keeps the document step for an ordinary permit creation', () => {
    expect(getPermitCreationTransition('MAINTENANCE', 'ELECTRIQUE')).toEqual({
      step: 3,
      typePermis: 'ELECTRIQUE',
      resetDraft: false,
    })
  })
})
