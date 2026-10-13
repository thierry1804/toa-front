import { describe, expect, it } from 'vitest'
import { chantierKey, collectPages, dayState, localDay, permitAction } from './model'
import type { Intervention, SuiviJournalier } from '@/types/intervention'
import type { PermitTravail } from '@/types/permitTravail'
import type { HydraCollection } from '@/types'

const intervention = { id: 'i1', statut: 'EN_COURS' } as Intervention
const permit = { id: 'p1', planPreventionId: 'plan1', codeSite: 'SITE1', statut: 'VALIDE_HSE', dateDebutPrevue: '2026-10-01', dateFinPrevue: '2026-10-20' } as PermitTravail
const today = '2026-10-13'
describe('field workday', () => {
  it('offers one daily report only and recognizes a teammate or offline entry', () => {
    expect(dayState(intervention, permit, [], today)).toBe('todo')
    const suivi = { date: today, nomResponsable: 'A colleague' } as SuiviJournalier
    expect(dayState(intervention, permit, [suivi], today)).toBe('done')
    expect(dayState(intervention, permit, [{ ...suivi, pendingSync: true }], today)).toBe('pending')
  })
  it('does not present missing data, future, expired, or unvalidated permits as actionable', () => {
    expect(dayState(intervention, permit, undefined, today)).toBe('unknown')
    expect(dayState(intervention, undefined, [], today)).toBe('unknown')
    expect(dayState(intervention, { ...permit, dateDebutPrevue: '2026-11-01' }, [], today)).toBe('future')
    expect(dayState(intervention, { ...permit, dateFinPrevue: '2026-10-07' }, [], today)).toBe('review')
    expect(dayState(intervention, { ...permit, statut: 'SOUMIS' }, [], today)).toBe('prepare')
    expect(dayState({ ...intervention, statut: 'EN_PREPARATION' }, permit, [], today)).toBe('prepare')
    expect(dayState({ ...intervention, statut: 'TERMINEE' }, permit, [], today)).toBe('closed')
  })
  it('does not merge unrelated projects at the same site or multi-site projects', () => {
    expect(chantierKey(permit)).toBe(chantierKey({ ...permit, id: 'renewal' }))
    expect(chantierKey(permit)).not.toBe(chantierKey({ ...permit, planPreventionId: 'plan2' }))
    expect(chantierKey(permit)).not.toBe(chantierKey({ ...permit, codeSite: 'SITE2' }))
    expect(chantierKey({ ...permit, planPreventionId: null })).not.toBe(chantierKey({ ...permit, id: 'p2', planPreventionId: null }))
  })
  it('uses the calendar date on the device, including after midnight', () => {
    expect(localDay(new Date(2026, 9, 13, 0, 1))).toBe(today)
  })
  it('does not turn a waiting validation into an action for the agent', () => {
    expect(permitAction({ ...permit, statut: 'SOUMIS' }, today)).toBeNull()
    expect(permitAction({ ...permit, dateFinPrevue: '2026-10-14' }, today)).toBe('expiry')
    expect(permitAction({ ...permit, dateFinPrevue: '2026-10-15' }, today)).toBeNull()
    expect(permitAction({ ...permit, statut: 'CLOTURE' }, today)).toBeNull()
  })
})

describe('complete collections', () => {
  const collection = (ids: string[], totalItems: number) => ({ member: ids.map((id) => ({ id })), totalItems }) as HydraCollection<{ id: string }>
  it('includes subsequent pages without duplicate rows', async () => {
    const pages = [collection(['1', '2'], 3), collection(['2', '3'], 3)]
    expect(await collectPages(async (page) => pages[page - 1])).toEqual([{ id: '1' }, { id: '2' }, { id: '3' }])
  })
  it('reports an incomplete collection instead of an infinite loop or false totals', async () => {
    await expect(collectPages(async () => collection(['1'], 2))).rejects.toThrow('Incomplete collection')
  })
})
