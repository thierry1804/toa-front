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
  return status === 'draft'
}

export function canEdit(status: PermitStatus): boolean {
  return status === 'draft'
}

export function getStatusColor(status: PermitStatus): string {
  const colors: Record<PermitStatus, string> = {
    draft: 'bg-gray-100 text-gray-700',
    awaiting_chef_validation: 'bg-yellow-100 text-yellow-700',
    awaiting_hse_validation: 'bg-orange-100 text-orange-700',
    validated: 'bg-green-100 text-green-700',
    in_progress: 'bg-blue-100 text-blue-700',
    closed: 'bg-gray-100 text-gray-500',
    rejected: 'bg-red-100 text-red-700',
    expired: 'bg-red-100 text-red-500',
  }
  return colors[status]
}
