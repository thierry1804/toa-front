export interface SuiviDraft {
  realise: boolean
  motifNonRealisation: string
  avancementPourcentage: number
  commentaire: string
}

const key = (interventionIri: string, day: string) => `toa:suivi-draft:${interventionIri}:${day}`

/** Brouillon local du suivi du jour : une coupure réseau ou un retour en arrière ne fait pas perdre la saisie. */
export function readSuiviDraft(interventionIri: string, day: string): SuiviDraft | null {
  try {
    const raw = localStorage.getItem(key(interventionIri, day))
    return raw ? (JSON.parse(raw) as SuiviDraft) : null
  } catch {
    return null
  }
}

export function writeSuiviDraft(interventionIri: string, day: string, draft: SuiviDraft): void {
  try {
    localStorage.setItem(key(interventionIri, day), JSON.stringify(draft))
  } catch {
    /* stockage indisponible : le brouillon est un confort, pas une obligation */
  }
}

export function clearSuiviDraft(interventionIri: string, day: string): void {
  try {
    localStorage.removeItem(key(interventionIri, day))
  } catch {
    /* idem */
  }
}
