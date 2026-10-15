import type { ProcessusPermit, TypePermit } from '@/types/permitTravail'

export type PermitCreationTransition = {
  step: 2
  typePermis: TypePermit
  resetDraft: boolean
}

export function getPermitCreationTransition(
  processus: ProcessusPermit,
  typePermis: TypePermit,
): PermitCreationTransition {
  if (processus === 'NOUVEAU_SITE' && typePermis === 'GENERAL') {
    return { step: 2, typePermis: 'GENERAL', resetDraft: false }
  }

  return { step: 2, typePermis, resetDraft: false }
}
