export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "info" | "primary" | "success" | "danger" | "default" | "secondary" }
> = {
  brouillon: { label: "Brouillon", variant: "default" },
  planifie: { label: "Planifié", variant: "info" },
  en_cours: { label: "En cours", variant: "primary" },
  valide: { label: "Validé", variant: "success" },
  annule: { label: "Annulé", variant: "danger" },
  stand_by: { label: "Stand By", variant: "secondary" },
}

export const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "valide", label: "Validé" },
  { value: "annule", label: "Annulé" },
  { value: "stand_by", label: "Stand By" },
]

export const statusOptions = [
  { value: "brouillon", label: "Brouillon" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "valide", label: "Validé" },
  { value: "annule", label: "Annulé" },
  { value: "stand_by", label: "Stand By" },
]

export const INTERVENTION_TYPES = [
  'Nouveau site',
  'Vie de Réseau',
  'Infrastructure',
  'Opération et Mainténance',
  'Energie',
] as const

export type InterventionType = typeof INTERVENTION_TYPES[number]

export const interventionTypeOptions = [
  { value: '', label: '— Choisir un type —' },
  ...INTERVENTION_TYPES.map((t) => ({ value: t, label: t })),
]
