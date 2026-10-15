export { collectPages } from '@/lib/collectHydraPages'
import type { Intervention, SuiviJournalier } from '@/types/intervention'
import type { PermitTravail } from '@/types/permitTravail'

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function chantierKey(permit: PermitTravail): string {
  return JSON.stringify([permit.codeSite, permit.planPreventionId || `permit:${permit.id}`])
}

export type DayState = 'todo' | 'done' | 'pending' | 'prepare' | 'future' | 'review' | 'closing' | 'closed' | 'unknown'
export function dayState(intervention: Intervention, permit: PermitTravail | undefined, suivis: SuiviJournalier[] | undefined, today: string): DayState {
  if (!suivis) return 'unknown'
  const entry = suivis.find((suivi) => suivi.date.slice(0, 10) === today)
  if (entry) return entry.pendingSync ? 'pending' : 'done'
  // Terminé pour de bon : intervention terminée ou clôture du permis validée.
  if (intervention.statut === 'TERMINEE' || permit?.statut === 'PV_VALIDE') return 'closed'
  if (!permit) return 'unknown'
  // Clôture soumise (en attente de validation) ou refusée : le dossier reste visible, sans nouvelle saisie.
  if (['CLOTURE', 'PV_REFUSE'].includes(permit.statut)) return 'closing'
  if (permit.dateDebutPrevue && permit.dateDebutPrevue.slice(0, 10) > today) return 'future'
  if (permit.dateFinPrevue && permit.dateFinPrevue.slice(0, 10) < today) return 'review'
  if (!['VALIDE', 'VALIDE_HSE', 'EN_COURS'].includes(permit.statut)) return 'prepare'
  if (!['EVALUATION_COMPLETE', 'EN_COURS'].includes(intervention.statut)) return 'prepare'
  return 'todo'
}

export type TaskGroups<T extends { state: DayState }> = { todo: T[]; waiting: T[]; done: T[] }

/** Tâches de la journée : à faire d'abord, puis ce qui bloque ou attend, puis ce qui est déjà fait (les terminées disparaissent). */
export function groupTasks<T extends { state: DayState }>(rows: T[]): TaskGroups<T> {
  const groups: TaskGroups<T> = { todo: [], waiting: [], done: [] }
  for (const row of rows) {
    if (row.state === 'closed') continue
    if (row.state === 'todo') groups.todo.push(row)
    else if (row.state === 'done' || row.state === 'pending') groups.done.push(row)
    else groups.waiting.push(row)
  }
  return groups
}

export type TaskTarget = 'enter' | 'complete' | 'intervention' | 'permit' | 'notebook' | null

/** Geste unique proposé à l'agent pour une tâche, selon son état. */
export function taskTarget(state: DayState, intervention: Intervention, hasPermit: boolean): TaskTarget {
  switch (state) {
    case 'todo': return 'enter'
    case 'done':
    case 'pending': return 'complete'
    case 'prepare':
      return !['EVALUATION_COMPLETE', 'EN_COURS'].includes(intervention.statut) ? 'intervention' : hasPermit ? 'permit' : 'notebook'
    case 'review':
    case 'closing': return hasPermit ? 'permit' : 'notebook'
    case 'unknown': return hasPermit ? 'permit' : 'notebook'
    default: return null
  }
}

export function permitAction(permit: PermitTravail, today: string): 'draft' | 'correct' | 'closure' | 'expiry' | null {
  if (permit.statut === 'BROUILLON') return 'draft'
  if (['REJETE', 'REFUSE_HSE'].includes(permit.statut)) return 'correct'
  if (permit.statut === 'PV_REFUSE') return 'closure'
  if (['VALIDE', 'VALIDE_HSE', 'EN_COURS'].includes(permit.statut)) {
    const tomorrow = new Date(`${today}T12:00:00`)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (permit.dateFinPrevue && permit.dateFinPrevue.slice(0, 10) <= localDay(tomorrow)) return 'expiry'
  }
  return null
}
