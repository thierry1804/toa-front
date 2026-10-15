import type { DangerEntry } from '@/types/permitTravail'

const RANK: Record<'rouge' | 'jaune' | 'vert', number> = { rouge: 3, jaune: 2, vert: 1 }

export type DangersFormIssue = 'empty' | 'incomplete' | 'no_reduction'

/** Une entrée est complète quand les quatre champs du formulaire sont renseignés. */
export function isDangerEntryComplete(entry: DangerEntry): boolean {
  return (
    entry.dangers.trim() !== '' &&
    entry.moyensMaitrise.trim() !== '' &&
    entry.evaluationPreliminaire !== '' &&
    entry.evaluationFinale !== ''
  )
}

/** Contrôle du 28/08/2026 : l'évaluation finale doit réduire le niveau de risque initial. */
export function dangerEntryReducesRisk(entry: DangerEntry): boolean {
  if (entry.evaluationPreliminaire === '' || entry.evaluationFinale === '') return true
  return RANK[entry.evaluationFinale] < RANK[entry.evaluationPreliminaire]
}

/**
 * Formulaire d'évaluation des dangers (réponse « Non » à la question de contrôle, R-22) :
 * au moins une entrée, entièrement renseignée, dont le risque final est inférieur au risque préliminaire.
 */
export function getDangersFormIssue(entries: DangerEntry[]): DangersFormIssue | null {
  const filled = entries.filter(
    (e) => e.dangers.trim() || e.moyensMaitrise.trim() || e.evaluationPreliminaire || e.evaluationFinale,
  )
  if (filled.length === 0) return 'empty'
  if (!filled.every(isDangerEntryComplete)) return 'incomplete'
  if (!filled.every(dangerEntryReducesRisk)) return 'no_reduction'
  return null
}
