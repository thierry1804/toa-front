export { collectPages } from '@/lib/collectHydraPages'
import type { Intervention, SuiviJournalier } from '@/types/intervention'
import type { PermitTravail } from '@/types/permitTravail'

export function localDay(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function chantierKey(permit: PermitTravail): string {
  return JSON.stringify([permit.codeSite, permit.planPreventionId || `permit:${permit.id}`])
}

export type DayState = 'todo' | 'done' | 'pending' | 'prepare' | 'future' | 'review' | 'closed' | 'unknown'
export function dayState(intervention: Intervention, permit: PermitTravail | undefined, suivis: SuiviJournalier[] | undefined, today: string): DayState {
  if (!suivis) return 'unknown'
  const entry = suivis.find((suivi) => suivi.date.slice(0, 10) === today)
  if (entry) return entry.pendingSync ? 'pending' : 'done'
  if (intervention.statut === 'TERMINEE' || (permit && ['CLOTURE', 'PV_VALIDE'].includes(permit.statut))) return 'closed'
  if (!permit) return 'unknown'
  if (permit.dateDebutPrevue && permit.dateDebutPrevue.slice(0, 10) > today) return 'future'
  if (permit.dateFinPrevue && permit.dateFinPrevue.slice(0, 10) < today) return 'review'
  if (!['VALIDE', 'VALIDE_HSE', 'EN_COURS'].includes(permit.statut)) return 'prepare'
  if (!['EVALUATION_COMPLETE', 'EN_COURS'].includes(intervention.statut)) return 'prepare'
  return 'todo'
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
