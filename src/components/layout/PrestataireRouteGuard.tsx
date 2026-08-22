import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { isPrestataireEntrepriseScoped } from '@/features/users/utils/entrepriseScope'

/** Accès réservé aux prestataires (hors admin) — indépendant du menu backend. */
export function PrestataireRouteGuard() {
  const roles = useAuthStore((s) => s.roles)
  const isScoped = isPrestataireEntrepriseScoped(roles)

  if (!isScoped) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
