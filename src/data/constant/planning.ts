// Labels are resolved at render time via t('planning.status.<value>') /
// t('planning.interventionTypes.values.<value>') — this file only owns the
// stable data values and their visual variant, not display strings.
export const STATUS_CONFIG: Record<
  string,
  { variant: "warning" | "info" | "primary" | "success" | "danger" | "default" | "secondary" }
> = {
  brouillon: { variant: "default" },
  planifie: { variant: "info" },
  en_cours: { variant: "primary" },
  valide: { variant: "success" },
  annule: { variant: "danger" },
  stand_by: { variant: "secondary" },
}

export const STATUS_VALUES = [
  "brouillon",
  "planifie",
  "en_cours",
  "valide",
  "annule",
  "stand_by",
] as const

export const INTERVENTION_TYPES = [
  'Nouveau site',
  'Vie de Réseau',
  'Infrastructure',
  'Opération et Mainténance',
  'Energie',
] as const

export type InterventionType = typeof INTERVENTION_TYPES[number]
