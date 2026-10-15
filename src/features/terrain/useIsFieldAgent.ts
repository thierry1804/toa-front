import { useAuthStore } from '@/store/auth.store'

const FIELD_ROLES = ['ROLE_AGENT_TERRAIN', 'ROLE_COLLABORATEUR']
const OFFICE_ROLES = ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN', 'ROLE_HSE', 'ROLE_CHEF_PROJET']

/** Profil « terrain » : agent (ou collaborateur) sans rôle de bureau — il n'a que ses tâches du jour. */
export function isFieldAgentRoles(roles: string[]): boolean {
  return roles.some((role) => FIELD_ROLES.includes(role)) && !roles.some((role) => OFFICE_ROLES.includes(role))
}

export function useIsFieldAgent(): boolean {
  return useAuthStore((state) => isFieldAgentRoles(state.roles))
}
