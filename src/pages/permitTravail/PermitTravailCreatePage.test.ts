import { describe, expect, it } from 'vitest'
import { getMissingDocumentTypes, type DocumentRequisLigne } from '@/types/permitTravail'
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
  const required: DocumentRequisLigne[] = [
    { code: 'TROUSSE_SECOURS', libelle: 'Trousse', obligatoire: true, autoriseNA: false, ordre: 0 },
    { code: 'PHOTO_EPI_BASE', libelle: 'EPI', obligatoire: true, autoriseNA: false, ordre: 1 },
  ]

  it('returns every required type when no document is uploaded', () => {
    expect(getMissingDocumentTypes(required, [])).toEqual(['TROUSSE_SECOURS', 'PHOTO_EPI_BASE'])
  })

  it('returns only the required types that are not uploaded', () => {
    expect(getMissingDocumentTypes(required, [{ type: 'TROUSSE_SECOURS', filePath: 'a.pdf' }])).toEqual(['PHOTO_EPI_BASE'])
  })

  it('returns no missing type when all required documents are uploaded', () => {
    expect(
      getMissingDocumentTypes(required, [
        { type: 'TROUSSE_SECOURS', filePath: 'a.pdf' },
        { type: 'PHOTO_EPI_BASE', filePath: 'b.pdf' },
      ]),
    ).toEqual([])
  })

  it('does not accept a not-applicable marker for an obligatory document', () => {
    expect(
      getMissingDocumentTypes(required, [{ type: 'TROUSSE_SECOURS', filePath: '', nonApplicable: true }]),
    ).toEqual(['TROUSSE_SECOURS', 'PHOTO_EPI_BASE'])
  })

  it('accepts a not-applicable marker when the rule allows it (autoriseNA)', () => {
    const withNAOverride: DocumentRequisLigne[] = [
      { ...required[0], autoriseNA: true },
      required[1],
    ]
    expect(
      getMissingDocumentTypes(withNAOverride, [
        { type: 'TROUSSE_SECOURS', filePath: '', nonApplicable: true },
        { type: 'PHOTO_EPI_BASE', filePath: 'b.pdf' },
      ]),
    ).toEqual([])
  })
})
