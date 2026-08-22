import { useAuthStore } from '@/store/auth.store'
import { useUser } from '@/features/users/hooks/useUsers'
import {
  isPrestataireEntrepriseScoped,
  userBelongsToEntreprise,
  usersShareEntreprise,
} from '@/features/users/utils/entrepriseScope'
import type { User } from '@/types'

export function usePrestataireEntrepriseScope() {
  const roles = useAuthStore((s) => s.roles)
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isScoped = isPrestataireEntrepriseScoped(roles)

  const { data: profile, isLoading: isProfileLoading, isError: isProfileError } = useUser(
    isScoped && currentUserId ? Number(currentUserId) : 0,
  )

  const matchesEntreprise = (user: User): boolean => {
    if (!isScoped) return true
    if (!profile) return false
    return usersShareEntreprise(profile, user)
  }

  const entrepriseId = profile?.entreprise?.id ?? null
  const entrepriseIri = profile?.entreprise?.['@id'] ?? null
  const hasEntreprise = !!(entrepriseId || entrepriseIri)

  return {
    isScoped,
    profile,
    isProfileLoading: isScoped && isProfileLoading,
    isProfileError: isScoped && isProfileError,
    matchesEntreprise,
    hasEntreprise,
    entrepriseId,
    entrepriseIri,
    entrepriseName: profile?.entrepriseName ?? profile?.entreprise?.nom ?? null,
    canManageUser: (user: User) =>
      !isScoped ||
      (!!profile &&
        userBelongsToEntreprise(
          user,
          profile.entreprise,
          profile.entrepriseName ?? profile.entreprise?.nom,
        )),
  }
}
