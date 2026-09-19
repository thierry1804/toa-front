import { describe, it, expect } from 'vitest'
import { missingApnApiRiskTypes, presentApnApiRiskTypes, requiredApnApiTypes } from './apnApiRisk'

const categories = [
  { id: 'root-apn', nom: 'Risques APN', typeSite: 'APN' as const, parentId: null },
  { id: 'child-apn', nom: 'Atteinte à la faune et à la flore (APN)', typeSite: null, parentId: 'root-apn' },
  { id: 'generic-apn', nom: 'Autre(s) risque(s) APN à préciser', typeSite: null, parentId: 'root-apn' },
  { id: 'root-api', nom: 'Risques API', typeSite: 'API' as const, parentId: null },
  { id: 'child-api', nom: 'Perturbation des espèces (API)', typeSite: null, parentId: 'root-api' },
  { id: 'other', nom: 'Chute de hauteur', typeSite: null, parentId: null },
]

describe('requiredApnApiTypes', () => {
  it('collects every protected-area type across the sites', () => {
    expect(requiredApnApiTypes([{ apn: true }, { api: true }, {}])).toEqual(['APN', 'API'])
    expect(requiredApnApiTypes([{ apn: true, api: false }])).toEqual(['APN'])
    expect(requiredApnApiTypes([{}, { apn: false }])).toEqual([])
  })
})

describe('presentApnApiRiskTypes', () => {
  it('inherits the type from the parent category', () => {
    expect(presentApnApiRiskTypes([{ categorieIds: ['child-apn'] }], categories)).toEqual(['APN'])
  })

  it('accepts a root category that carries the type itself', () => {
    expect(presentApnApiRiskTypes([{ categorieIds: ['root-api'] }], categories)).toEqual(['API'])
  })

  it('ignores the generic « Autre(s) risque(s) » entries and unrelated categories', () => {
    expect(presentApnApiRiskTypes([{ categorieIds: ['generic-apn', 'other', 'unknown'] }], categories)).toEqual([])
  })

  it('survives a cyclic parent chain', () => {
    const cyclic = [
      { id: 'a', nom: 'A', typeSite: null, parentId: 'b' },
      { id: 'b', nom: 'B', typeSite: null, parentId: 'a' },
    ]
    expect(presentApnApiRiskTypes([{ categorieIds: ['a'] }], cyclic)).toEqual([])
  })
})

describe('missingApnApiRiskTypes', () => {
  it('requires nothing for a plan without protected-area site', () => {
    expect(missingApnApiRiskTypes([{}], [], categories)).toEqual([])
  })

  it('requires an APN risk for an APN site and rejects an API risk', () => {
    expect(missingApnApiRiskTypes([{ apn: true }], [{ categorieIds: ['child-api'] }], categories)).toEqual(['APN'])
    expect(missingApnApiRiskTypes([{ apn: true }], [{ categorieIds: ['child-apn'] }], categories)).toEqual([])
  })

  it('requires both types when the plan covers an APN and an API site', () => {
    expect(missingApnApiRiskTypes([{ apn: true }, { api: true }], [{ categorieIds: ['child-apn'] }], categories)).toEqual(['API'])
    expect(
      missingApnApiRiskTypes([{ apn: true }, { api: true }], [{ categorieIds: ['child-apn'] }, { categorieIds: ['root-api'] }], categories),
    ).toEqual([])
  })
})
