import type { InterventionStatus } from '@/types'
import type { Intervention, SuiviJournalier } from '@/types/intervention'

export function latestInterventionProgress(suivis: SuiviJournalier[]): number {
  return [...suivis].sort((a, b) => b.date.localeCompare(a.date))[0]?.avancementPourcentage ?? 0
}

export function interventionDisplayStatus(statut: string, progress = 0): InterventionStatus {
  const statuses: Record<string, InterventionStatus> = {
    EN_PREPARATION: 'planifiee', EVALUATION_COMPLETE: 'planifiee',
    EN_COURS: 'en_cours', TERMINEE: 'terminee',
  }
  const status = statuses[statut] ?? statut as InterventionStatus
  return status === 'planifiee' && progress > 0 ? 'en_cours' : status
}

export function interventionDates(intervention: Intervention) {
  const permit = typeof intervention.permitTravail === 'object' ? intervention.permitTravail : null
  return {
    dateDebut: permit?.dateDebutPrevue ?? intervention.createdAt,
    dateFin: permit?.dateFinPrevue ?? intervention.createdAt,
  }
}
