import type { PermitStatus, UserRole } from '@/types'

export const STATUS_TRANSITIONS: Record<PermitStatus, PermitStatus[]> = {
  brouillon: ['en_attente_validation_chef'],
  en_attente_validation_chef: ['en_attente_validation_hse', 'refuse'],
  en_attente_validation_hse: ['valide', 'refuse'],
  valide: ['en_cours'],
  en_cours: ['cloture'],
  cloture: [],
  refuse: [],
  expire: [],
}

export const ROLE_TRANSITIONS: Record<UserRole, PermitStatus[]> = {
  operateur: ['brouillon'],
  chef: ['en_attente_validation_chef', 'en_attente_validation_hse'],
  hse: ['en_attente_validation_hse', 'valide', 'refuse'],
  admin: [
    'brouillon',
    'en_attente_validation_chef',
    'en_attente_validation_hse',
    'valide',
    'en_cours',
    'cloture',
    'refuse',
  ],
}
