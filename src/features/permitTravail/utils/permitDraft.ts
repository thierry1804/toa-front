import type { PermitTravail } from '@/types/permitTravail'

type DraftPermit = Pick<PermitTravail, 'statut' | 'decisionsHse'>

export function wasRefused(permit: DraftPermit): boolean {
  return permit.decisionsHse?.some((d) => d.decision === 'REFUSE') ?? false
}

/**
 * R-24 : tout brouillon (création interrompue, renouvellement R1, R2…) doit
 * pouvoir être complété puis soumis, pas seulement un permis refusé par le
 * HSE. La correction d'un refus reste régie par le droit de resoumission.
 */
export function canEditDraft(
  permit: DraftPermit,
  rights: { canEdit: boolean; canResoumettre: boolean },
): boolean {
  if (permit.statut !== 'BROUILLON') return false
  return wasRefused(permit) ? rights.canResoumettre : rights.canEdit
}
