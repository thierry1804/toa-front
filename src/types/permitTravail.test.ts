import { describe, it, expect } from 'vitest'
import {
  getRequiredClotureDocumentTypes,
  getRequiredDocumentTypes,
  resolveDocumentRequirements,
  type DocumentsRequisResult,
} from './permitTravail'

describe('permit document requirements', () => {
  it('requires the before-works photo, and no after-works photo, at closure for every process (R-26)', () => {
    for (const plan of ['Nouveau site', 'Maintenance']) {
      const types = getRequiredClotureDocumentTypes(plan)
      expect(types).toContain('PHOTO_AVANT_TRAVAUX')
      expect(types).not.toContain('PHOTO_APRES_TRAVAUX')
      expect(types).not.toContain('PV_FIN_TRAVAUX')
    }
  })

  it('adds environmental closure pieces only for the general permit of APN/API sites', () => {
    expect(getRequiredClotureDocumentTypes('Nouveau site', false, 'GENERAL')).not.toContain('ENV_REGISTRE_DECHETS')
    expect(getRequiredClotureDocumentTypes('Nouveau site', true, 'GENERAL')).toContain('ENV_REGISTRE_DECHETS')
    expect(getRequiredClotureDocumentTypes('Maintenance', true, 'GENERAL')).toContain('ENV_ENLEVEMENT_DECHETS')
  })

  it('does not require environmental closure pieces for electrical or height permits', () => {
    expect(getRequiredClotureDocumentTypes('Nouveau site', true, 'ELECTRIQUE')).not.toContain('ENV_REGISTRE_DECHETS')
    expect(getRequiredClotureDocumentTypes('Maintenance', true, 'HAUTEUR')).not.toContain('ENV_ENLEVEMENT_DECHETS')
    expect(getRequiredClotureDocumentTypes('Maintenance', true)).not.toContain('ENV_ENLEVEMENT_DECHETS')
  })

  it('adds environmental submission pieces only for the general permit of APN/API sites', () => {
    expect(getRequiredDocumentTypes('Nouveau site', 'GENERAL', 'NOUVEAU_SITE', false)).not.toContain('ENV_TRI_DECHETS')
    expect(getRequiredDocumentTypes('Nouveau site', 'GENERAL', 'NOUVEAU_SITE', true)).toContain('ENV_TRI_DECHETS')
    expect(getRequiredDocumentTypes('Maintenance', 'GENERAL', 'MAINTENANCE', true)).toContain('ENV_PROPRETE_AVANT')
    expect(getRequiredDocumentTypes('Nouveau site', 'HAUTEUR', 'NOUVEAU_SITE', true)).not.toContain('ENV_TRI_DECHETS')
  })
})

describe('resolveDocumentRequirements', () => {
  const permit = { planProcess: 'Maintenance', typePermis: 'ELECTRIQUE' as const, processus: 'MAINTENANCE' as const }

  it('trusts the server lists once they are loaded', () => {
    const requis: DocumentsRequisResult = {
      soumission: ['TROUSSE_SECOURS'],
      cloture: ['PV_FIN_TRAVAUX'],
      apnApi: true,
    }
    expect(resolveDocumentRequirements(permit, requis)).toEqual({
      soumission: ['TROUSSE_SECOURS'],
      cloture: ['PV_FIN_TRAVAUX'],
      apnApi: true,
    })
  })

  it('falls back to the local matrix, without APN/API pieces, while the server lists are missing', () => {
    const resolved = resolveDocumentRequirements(permit, undefined)
    expect(resolved.apnApi).toBe(false)
    expect(resolved.soumission).toContain('PHOTO_EQUIPEMENTS_ISOLANTS')
    expect(resolved.cloture).toContain('PHOTO_AVANT_TRAVAUX')
    expect(resolved.cloture).not.toContain('ENV_ENLEVEMENT_DECHETS')
  })
})
