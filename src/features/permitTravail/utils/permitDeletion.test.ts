import { describe, expect, it } from 'vitest'
import type { PermitTravail } from '@/types/permitTravail'
import { canDeletePermit } from './permitDeletion'

const permit = (statut: PermitTravail['statut'], createdById: number) =>
  ({ statut, createdBy: { id: createdById } }) as Pick<PermitTravail, 'statut' | 'createdBy'>

describe('canDeletePermit', () => {
  it('autorise la suppression d’un brouillon créé par l’utilisateur courant', () => {
    expect(canDeletePermit(permit('BROUILLON', 42), '42')).toBe(true)
  })

  it('refuse la suppression d’un brouillon créé par un autre utilisateur', () => {
    expect(canDeletePermit(permit('BROUILLON', 42), '7')).toBe(false)
  })

  it('refuse la suppression d’un permis qui n’est pas un brouillon', () => {
    expect(canDeletePermit(permit('SOUMIS', 42), '42')).toBe(false)
  })

  it('refuse la suppression lorsque l’identifiant courant est absent', () => {
    expect(canDeletePermit(permit('BROUILLON', 42), '')).toBe(false)
    expect(canDeletePermit(permit('BROUILLON', 42), undefined)).toBe(false)
  })
})
