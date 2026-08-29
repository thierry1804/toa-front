import type { PermitTravail } from '@/types/permitTravail'

type DeletablePermit = Pick<PermitTravail, 'statut' | 'createdBy'>

export function canDeletePermit(permit: DeletablePermit, currentUserId?: string | null): boolean {
  return (
    permit.statut === 'BROUILLON' &&
    typeof currentUserId === 'string' &&
    currentUserId.trim() !== '' &&
    String(permit.createdBy.id) === currentUserId
  )
}
