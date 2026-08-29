import type { ProcessusPermit, TypePermit } from '@/types/permitTravail'

export type PermitCreationTransition = {
  step: 0 | 3
  typePermis: TypePermit
  resetDraft: boolean
}

export function getPermitCreationTransition(
  processus: ProcessusPermit,
  typePermis: TypePermit,
): PermitCreationTransition {
  if (processus === 'NOUVEAU_SITE' && typePermis === 'GENERAL') {
    return { step: 0, typePermis: 'ELECTRIQUE', resetDraft: true }
  }

  return { step: 3, typePermis, resetDraft: false }
}
