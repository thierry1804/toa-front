import { describe, expect, it } from 'vitest'
import { chantierKey, collectPages, dayState, groupTasks, localDay, permitAction, permitClosureNote, taskTarget } from './model'
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
  it('follows the intervention, like the server and the follow-ups list, not the permit status', () => {
    expect(dayState(intervention, undefined, undefined, today)).toBe('unknown')
    expect(dayState(intervention, undefined, [], today)).toBe('todo')
    expect(dayState({ ...intervention, statut: 'EVALUATION_COMPLETE' }, permit, [], today)).toBe('todo')
    expect(dayState({ ...intervention, statut: 'EN_PREPARATION' }, permit, [], today)).toBe('prepare')
    expect(dayState({ ...intervention, statut: 'TERMINEE' }, permit, [], today)).toBe('closed')
    // Permis clôturé ou expiré : la saisie reste proposée tant que l'intervention est en cours.
    for (const statut of ['CLOTURE', 'PV_VALIDE', 'PV_REFUSE', 'SOUMIS'] as const) {
      expect(dayState(intervention, { ...permit, statut }, [], today)).toBe('todo')
    }
    expect(dayState(intervention, { ...permit, dateFinPrevue: '2026-10-07' }, [], today)).toBe('todo')
  })
  it('flags a closed permit without blocking the entry', () => {
    expect(permitClosureNote({ ...permit, statut: 'CLOTURE' })).toBe(true)
    expect(permitClosureNote({ ...permit, statut: 'PV_VALIDE' })).toBe(true)
    expect(permitClosureNote(permit)).toBe(false)
    expect(permitClosureNote(undefined)).toBe(false)
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

describe('field task list', () => {
  it('puts what is to do first, hides closed work and folds what is done', () => {
    const rows = ['done', 'todo', 'closed', 'prepare', 'pending', 'unknown'].map((state) => ({ state: state as never }))
    const groups = groupTasks(rows)
    expect(groups.todo).toHaveLength(1)
    expect(groups.done).toHaveLength(2)
    expect(groups.waiting).toHaveLength(2)
  })
  it('offers a single next gesture per state', () => {
    expect(taskTarget('todo', intervention, true)).toBe('enter')
    expect(taskTarget('done', intervention, true)).toBe('complete')
    expect(taskTarget('prepare', { ...intervention, statut: 'EN_PREPARATION' }, true)).toBe('intervention')
    expect(taskTarget('unknown', intervention, true)).toBe('permit')
    expect(taskTarget('unknown', intervention, false)).toBe('notebook')
  })
})
