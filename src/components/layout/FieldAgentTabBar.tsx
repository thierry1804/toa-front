import { useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, type LucideIcon } from 'lucide-react'
import { useMenuStore } from '@/store/menu.store'
import { iconMap } from '@/data/constant/sidebar'
import { TerrainSyncDot } from '@/features/terrain/TerrainSyncDot'

const MAX_TABS = 4

/**
 * Navigation du profil terrain sur téléphone/tablette : les entrées racines que la matrice des rôles
 * accorde à l'agent (aucune liste figée ici), en barre d'onglets fixe en bas, cibles de 64 px.
 */
export function FieldAgentTabBar() {
  const { t } = useTranslation()
  const items = useMenuStore((s) => s.items)

  const tabs = useMemo(
    () =>
      items
        .filter((node) => node.route)
        .slice(0, MAX_TABS)
        .map((node) => {
          const isHome = node.route === '/dashboard'
          const Icon: LucideIcon = (node.icon && iconMap[node.icon]) || LayoutDashboard
          return { id: node.id, to: node.route as string, label: isHome ? t('terrain.myDay') : node.name, Icon, isHome }
        }),
    [items, t],
  )

  if (tabs.length === 0) return null

  return (
    <nav
      aria-label={t('terrain.tabs')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex">
        {tabs.map(({ id, to, label, Icon, isHome }) => (
          <li key={id} className="flex-1">
            <NavLink
              to={to}
              end={isHome}
              className={({ isActive }) =>
                `relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium ${
                  isActive ? 'text-blue-700' : 'text-gray-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`absolute inset-x-4 top-0 h-0.5 rounded-b ${isActive ? 'bg-blue-600' : 'bg-transparent'}`} aria-hidden />
                  <span className="relative">
                    <Icon className="h-6 w-6" aria-hidden />
                    {isHome && <TerrainSyncDot />}
                  </span>
                  <span className="max-w-full truncate">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default FieldAgentTabBar
