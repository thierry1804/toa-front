import { describe, expect, it } from 'vitest'
import { interventionDates, interventionDisplayStatus, latestInterventionProgress } from './presentation'
import type { Intervention, SuiviJournalier } from '@/types/intervention'

describe('intervention presentation shared by dashboard and list', () => {
  it('shows a planned intervention with 21% progress as ongoing', () => {
    for (const status of ['EN_PREPARATION', 'EVALUATION_COMPLETE', 'planifiee']) {
      expect(interventionDisplayStatus(status, 21)).toBe('en_cours')
      expect(interventionDisplayStatus(status, 0)).toBe('planifiee')
    }
  })
  it('preserves explicit ongoing and terminal statuses', () => {
    expect(interventionDisplayStatus('EN_COURS', 0)).toBe('en_cours')
    expect(interventionDisplayStatus('TERMINEE', 21)).toBe('terminee')
    expect(interventionDisplayStatus('suspendue', 21)).toBe('suspendue')
  })
  it('uses the latest dated progress rather than the maximum or array order', () => {
    const suivis = [
      { date: '2026-10-02', avancementPourcentage: 55 },
      { date: '2026-10-08', avancementPourcentage: 21 },
    ] as SuiviJournalier[]
    expect(latestInterventionProgress(suivis)).toBe(21)
    expect(latestInterventionProgress([])).toBe(0)
    expect(suivis[0].date).toBe('2026-10-02')
  })
  it('uses planned dates in both views, with the same fallback', () => {
    const intervention = { createdAt: '2026-10-02', permitTravail: {
      dateDebutPrevue: '2026-10-08', dateFinPrevue: '2026-10-15',
    } } as Intervention
    expect(interventionDates(intervention)).toEqual({ dateDebut: '2026-10-08', dateFin: '2026-10-15' })
    expect(interventionDates({ ...intervention, permitTravail: '/api/permits/1' }))
      .toEqual({ dateDebut: '2026-10-02', dateFin: '2026-10-02' })
  })
})
