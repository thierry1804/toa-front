import type { PermitStatus, UserRole } from '@/types'
import { STATUS_TRANSITIONS, ROLE_TRANSITIONS } from '@/data/constant/permits'

export function getAllowedTransitions(
  status: PermitStatus,
  role: UserRole,
): PermitStatus[] {
  const fromStatus = STATUS_TRANSITIONS[status] ?? []
  const fromRole = ROLE_TRANSITIONS[role] ?? []
  return fromStatus.filter((s) => fromRole.includes(s))
}

export function canDelete(status: PermitStatus): boolean {
  return status === 'brouillon'
}

export function canEdit(status: PermitStatus): boolean {
  return status === 'brouillon'
}

export function getStatusColor(status: PermitStatus): string {
  const colors: Record<PermitStatus, string> = {
    brouillon: 'bg-gray-100 text-gray-700',
    en_attente_validation_chef: 'bg-yellow-100 text-yellow-700',
    en_attente_validation_hse: 'bg-orange-100 text-orange-700',
    valide: 'bg-green-100 text-green-700',
    en_cours: 'bg-blue-100 text-blue-700',
    cloture: 'bg-gray-100 text-gray-500',
    refuse: 'bg-red-100 text-red-700',
    expire: 'bg-red-100 text-red-500',
  }
  return colors[status]
}
