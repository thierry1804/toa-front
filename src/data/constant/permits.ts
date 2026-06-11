import type { PermitStatus, UserRole } from '@/types'

export const STATUS_TRANSITIONS: Record<PermitStatus, PermitStatus[]> = {
  draft: ['awaiting_chef_validation'],
  awaiting_chef_validation: ['awaiting_hse_validation', 'rejected'],
  awaiting_hse_validation: ['validated', 'rejected'],
  validated: ['in_progress'],
  in_progress: ['closed'],
  closed: [],
  rejected: [],
  expired: [],
}

export const ROLE_TRANSITIONS: Record<UserRole, PermitStatus[]> = {
  operateur: ['draft'],
  chef: ['awaiting_chef_validation', 'awaiting_hse_validation'],
  hse: ['awaiting_hse_validation', 'validated', 'rejected'],
  admin: [
    'draft',
    'awaiting_chef_validation',
    'awaiting_hse_validation',
    'validated',
    'in_progress',
    'closed',
    'rejected',
  ],
}
