export type PreventionStatus =
  | 'brouillon'
  | 'en_attente_chef'
  | 'en_attente_hse'
  | 'valide'
  | 'refuse'

export interface PreventionPlan {
  id: string
  titre: string
  description: string
  status: PreventionStatus
  risques: Risque[]
  equipements: string[]
  created_at: string
  updated_at: string
}

export interface Risque {
  id: string
  libelle: string
  niveau: 'faible' | 'moyen' | 'eleve' | 'critique'
  mesures: Mesure[]
}

export interface Mesure {
  id: string
  description: string
  responsable: string
}
