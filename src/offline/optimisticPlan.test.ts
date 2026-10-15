import { describe, expect, it } from 'vitest'
import type { PlanPrevention } from '@/types/planPrevention'
import { applyPlanAction } from './optimisticPlan'

const NOW = new Date('2026-09-19T10:00:00.000Z')

function plan(overrides: Partial<PlanPrevention> = {}): PlanPrevention {
  return {
    id: 'p1',
    reference: 'PP-1',
    statut: 'EXAMINE',
    documents: [
      { id: 'd1', type: 'FDS', consultedAt: null },
      { id: 'd2', type: 'PLAN_URGENCE', consultedAt: '2026-09-18T09:00:00.000Z' },
      { id: 'd3', type: 'LISTE_VEHICULES', nonApplicable: true, consultedAt: null },
    ],
    tousDocumentsConsultes: false,
    ...overrides,
  } as unknown as PlanPrevention
}

describe('applyPlanAction', () => {
  it('consulter : marque la pièce et débloque tousDocumentsConsultes quand tout est consulté (N/A ignoré)', () => {
    const next = applyPlanAction(plan(), { type: 'consulter', documentId: 'd1' }, NOW)
    expect(next.documents.find((d) => d.id === 'd1')?.consultedAt).toBe(NOW.toISOString())
    expect(next.tousDocumentsConsultes).toBe(true)
    expect(next.pendingSync).toBe(true)
  })

  it('consulter : garde la première consultation et reste bloqué s\'il reste une pièce', () => {
    const p = plan({
      documents: [
        { id: 'd1', type: 'FDS', consultedAt: null },
        { id: 'd2', type: 'PLAN_URGENCE', consultedAt: null },
      ] as PlanPrevention['documents'],
    })
    const once = applyPlanAction(p, { type: 'consulter', documentId: 'd1' }, NOW)
    expect(once.tousDocumentsConsultes).toBe(false)
    const again = applyPlanAction(once, { type: 'consulter', documentId: 'd1' }, new Date('2027-01-01'))
    expect(again.documents.find((d) => d.id === 'd1')?.consultedAt).toBe(NOW.toISOString())
  })

  it('examiner : passe à EXAMINE et remet les consultations à zéro (le HSE doit re-consulter)', () => {
    const next = applyPlanAction(plan({ statut: 'SOUMIS' }), { type: 'examiner' }, NOW)
    expect(next.statut).toBe('EXAMINE')
    expect(next.documents.filter((d) => !d.nonApplicable).every((d) => d.consultedAt === null)).toBe(true)
    expect(next.tousDocumentsConsultes).toBe(false)
  })

  it('soumettre / resoumettre : SOUMIS, soumisAt, consultations remises à zéro', () => {
    for (const type of ['soumettre', 'resoumettre'] as const) {
      const next = applyPlanAction(plan({ statut: 'BROUILLON' }), { type }, NOW)
      expect(next.statut).toBe('SOUMIS')
      expect(next.soumisAt).toBe(NOW.toISOString())
      expect(next.tousDocumentsConsultes).toBe(false)
    }
  })

  it('valider : VALIDE_HSE avec validatedAt ; refuser : A_CORRIGER', () => {
    const validated = applyPlanAction(plan(), { type: 'valider' }, NOW)
    expect(validated.statut).toBe('VALIDE_HSE')
    expect(validated.validatedAt).toBe(NOW.toISOString())
    expect(applyPlanAction(plan(), { type: 'refuser' }, NOW).statut).toBe('A_CORRIGER')
  })

  it("ne modifie pas le plan d'origine", () => {
    const original = plan()
    const snapshot = JSON.stringify(original)
    applyPlanAction(original, { type: 'examiner' }, NOW)
    expect(JSON.stringify(original)).toBe(snapshot)
  })
})
