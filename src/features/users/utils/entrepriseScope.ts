import type { User } from '@/types'

/** Prestataire sans rôle admin — périmètre limité à son entreprise. */
export function isPrestataireEntrepriseScoped(roles: string[]): boolean {
  return (
    roles.includes('ROLE_PRESTATAIRE') &&
    !roles.some((r) => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN')
  )
}

export function usersShareEntreprise(a: User, b: User): boolean {
  const aIri = a.entreprise?.['@id']
  const bIri = b.entreprise?.['@id']
  if (aIri && bIri) return aIri === bIri

  const aId = a.entreprise?.id
  const bId = b.entreprise?.id
  if (aId && bId) return aId === bId

  const aName = normalizeEntrepriseName(a.entrepriseName ?? a.entreprise?.nom)
  const bName = normalizeEntrepriseName(b.entrepriseName ?? b.entreprise?.nom)
  if (aName && bName) return aName === bName

  return false
}

function normalizeEntrepriseName(value?: string | null): string | null {
  const trimmed = value?.trim().toLowerCase()
  return trimmed || null
}

export function userBelongsToEntreprise(
  user: User,
  entreprise?: User['entreprise'] | null,
  entrepriseName?: string | null,
): boolean {
  if (!entreprise && !entrepriseName?.trim()) return false

  const scopeUser: User = {
    '@id': '',
    id: 0,
    email: '',
    name: '',
    firstname: '',
    roles: [],
    isActive: true,
    createdAt: '',
    updatedAt: '',
    entreprise: entreprise ?? null,
    entrepriseName: entrepriseName ?? entreprise?.nom ?? null,
  }

  return usersShareEntreprise(user, scopeUser)
}
