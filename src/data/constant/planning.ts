export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "warning" | "info" | "success" | "danger" | "default" }
> = {
  brouillon: { label: "Brouillon", variant: "warning" },
  planifie: { label: "Planifié", variant: "info" },
  en_cours: { label: "En cours", variant: "default" },
  valide: { label: "Validé", variant: "success" },
  annule: { label: "Annulé", variant: "danger" },
}

export const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "brouillon", label: "Brouillon" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "valide", label: "Validé" },
  { value: "annule", label: "Annulé" },
]

export const statusOptions = [
  { value: "brouillon", label: "Brouillon" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "valide", label: "Validé" },
  { value: "annule", label: "Annulé" },
]
