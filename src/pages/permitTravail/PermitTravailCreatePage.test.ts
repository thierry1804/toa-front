import { describe, expect, it } from 'vitest'
import type { TypeDocumentPermitTravail } from '@/types/permitTravail'
import { getMissingDocumentTypes } from '@/types/permitTravail'
import { getPermitCreationTransition } from './permitCreationTransition'

describe('getPermitCreationTransition', () => {
  it('shows documents and engagements after creating the General permit for a new site', () => {
    expect(getPermitCreationTransition('NOUVEAU_SITE', 'GENERAL')).toEqual({
      step: 2,
      typePermis: 'GENERAL',
      resetDraft: false,
    })
  })

  it('keeps the document step for an ordinary permit creation', () => {
    expect(getPermitCreationTransition('MAINTENANCE', 'ELECTRIQUE')).toEqual({
      step: 2,
      typePermis: 'ELECTRIQUE',
      resetDraft: false,
    })
  })

  it.each(['ELECTRIQUE', 'HAUTEUR'] as const)(
    'shows documents and engagements after creating the %s companion permit for a new site',
    (typePermis) => {
      expect(getPermitCreationTransition('NOUVEAU_SITE', typePermis)).toEqual({
        step: 2,
        typePermis,
        resetDraft: false,
      })
    },
  )
})

describe('getMissingDocumentTypes', () => {
  const required: TypeDocumentPermitTravail[] = ['TROUSSE_SECOURS', 'PHOTO_EPI_BASE']

  it('returns every required type when no document is uploaded', () => {
    expect(getMissingDocumentTypes(required, [])).toEqual(required)
  })

  it('returns only the required types that are not uploaded', () => {
    expect(getMissingDocumentTypes(required, [{ type: 'TROUSSE_SECOURS' }])).toEqual(['PHOTO_EPI_BASE'])
  })

  it('returns no missing type when all required documents are uploaded', () => {
    expect(
      getMissingDocumentTypes(required, [
        { type: 'TROUSSE_SECOURS' },
        { type: 'PHOTO_EPI_BASE' },
      ]),
    ).toEqual([])
  })
})
