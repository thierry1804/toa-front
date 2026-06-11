import { Eye, Plus, Edit, Trash2 } from "lucide-react"

export const PERMS = ['canView', 'canCreate', 'canEdit', 'canDelete'] as const

export const PERM_ICONS: Record<string, typeof Eye> = {
  canView: Eye,
  canCreate: Plus,
  canEdit: Edit,
  canDelete: Trash2,
}

export const PERM_TITLES: Record<string, string> = {
  canView: 'Voir',
  canCreate: 'Ajout',
  canEdit: 'Modification',
  canDelete: 'Suppression',
}

export const PERM_LABELS: Record<string, string> = {
  canView: 'Voir',
  canCreate: 'Créer',
  canEdit: 'Modifier',
  canDelete: 'Supprimer',
}
