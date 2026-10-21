import { describe, expect, it } from 'vitest'
import { formatMissingRowPhotos } from './missingRowPhotos'


describe('formatMissingRowPhotos (R-09)', () => {
  it('turns the API detail into readable line numbers', () => {
    expect(formatMissingRowPhotos('photos_lignes_manquantes: installations:2; equipements:1,3')).toBe(
      'Installations : ligne 2 — Équipements : lignes 1, 3',
    )
  })

  it('ignores other errors', () => {
    expect(formatMissingRowPhotos('documents_manquants: FDS')).toBeNull()
  })
})
