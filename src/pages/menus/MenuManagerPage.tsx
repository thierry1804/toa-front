import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { useMenus } from '@/features/menus/hooks/useMenus'
import { useMenuAccesses } from '@/features/menus/hooks/useMenuAccesses'
import { menuAccessesApi } from '@/api/menuAccessesApi'
import { useUiStore } from '@/store/ui.store'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Shield,
  Loader2,
  Eye,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react'

type AccessKey = string

interface AccessEntry {
  key: AccessKey
  menu: string
  role: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  id?: number
}

const ROLES = [
  'ROLE_SUPER_ADMIN',
  'ROLE_ADMIN',
  'ROLE_CHEF_PROJET',
  'ROLE_HSE',
  'ROLE_PRESTATAIRE',
  'ROLE_DG',
]

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super Admin',
  ROLE_ADMIN: 'Admin',
  ROLE_CHEF_PROJET: 'Chef de Projet',
  ROLE_HSE: 'HSE',
  ROLE_PRESTATAIRE: 'Prestataire',
  ROLE_DG: 'DG',
}

const PERMS = ['canView', 'canCreate', 'canEdit', 'canDelete'] as const
const PERM_ICONS: Record<string, typeof Eye> = {
  canView: Eye,
  canCreate: Plus,
  canEdit: Edit,
  canDelete: Trash2,
}
const PERM_TITLES: Record<string, string> = {
  canView: 'Voir',
  canCreate: 'Ajout',
  canEdit: 'Modification',
  canDelete: 'Suppression',
}

function makeKey(menu: string, role: string): AccessKey {
  return `${menu}|${role}`
}

export default function MenuManagerPage() {
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const queryClient = useQueryClient()
  const { data: menus, isLoading: menusLoading } = useMenus()
  const { data: accesses, isLoading: accessesLoading } = useMenuAccesses()
  const [entries, setEntries] = useState<Map<AccessKey, AccessEntry>>(new Map())

  const menuItems = (menus ?? []).filter((m) => m.name !== 'Dashboard')
  const [loaded, setLoaded] = useState(false)
  const [toggling, setToggling] = useState<AccessKey | null>(null)

  useEffect(() => {
    if (!menus || !accesses || loaded) return
    const map = new Map<AccessKey, AccessEntry>()
    for (const menu of menuItems) {
      for (const role of ROLES) {
        const key = makeKey(menu['@id'], role)
        const existing = accesses.find((a) => a.menu === menu['@id'] && a.role === role)
        const isSuperAdmin = role === 'ROLE_SUPER_ADMIN'
        map.set(key, {
          key,
          menu: menu['@id'],
          role,
          canView: existing?.canView ?? isSuperAdmin,
          canCreate: existing?.canCreate ?? isSuperAdmin,
          canEdit: existing?.canEdit ?? isSuperAdmin,
          canDelete: existing?.canDelete ?? isSuperAdmin,
          id: existing?.id,
        })
      }
    }
    setEntries(map)
    setLoaded(true)
  }, [menus, accesses, loaded])

  const toggle = useCallback(async (key: AccessKey, perm: string) => {
    setToggling(key)

    const entry = entries.get(key)
    if (!entry) return

    const updated = { ...entry, [perm]: !entry[perm as keyof AccessEntry] }

    setEntries((prev) => {
      const next = new Map(prev)
      next.set(key, updated)
      return next
    })

    try {
      const hasAny = updated.canView || updated.canCreate || updated.canEdit || updated.canDelete

      if (entry.id) {
        if (hasAny) {
          await menuAccessesApi.update(entry.id, {
            menu: entry.menu,
            role: entry.role,
            canView: updated.canView,
            canCreate: updated.canCreate,
            canEdit: updated.canEdit,
            canDelete: updated.canDelete,
          })
        } else {
          await menuAccessesApi.delete(entry.id)
          setEntries((prev) => {
            const next = new Map(prev)
            const e = next.get(key)
            if (e) next.set(key, { ...e, id: undefined })
            return next
          })
        }
        queryClient.invalidateQueries({ queryKey: ['menu-accesses'] })
      } else if (hasAny) {
        const result = await menuAccessesApi.create({
          menu: entry.menu,
          role: entry.role,
          canView: updated.canView,
          canCreate: updated.canCreate,
          canEdit: updated.canEdit,
          canDelete: updated.canDelete,
        })
        setEntries((prev) => {
          const next = new Map(prev)
          const e = next.get(key)
          if (e) next.set(key, { ...e, id: result.id })
          return next
        })
        queryClient.invalidateQueries({ queryKey: ['menu-accesses'] })
      }
    } catch {
      addToast({ message: 'Erreur lors de la mise à jour', type: 'error' })
      setEntries((prev) => {
        const next = new Map(prev)
        next.set(key, entry)
        return next
      })
    } finally {
      setToggling(null)
    }
  }, [entries, addToast])

  if (!canAccessFeature('manage_menus')) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    )
  }

  if (menusLoading || accessesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Gestion des accès</h2>
        <p className="mt-1 text-gray-600">
          Matrice des permissions par rôle et par menu
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Shield className="h-5 w-5 text-blue-600" />
            Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {/* Desktop table */}
          <table className="hidden lg:table w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left font-semibold text-gray-900 sticky left-0 bg-white min-w-[160px] z-10">Menu</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-semibold text-gray-900 min-w-[160px]">
                    {ROLE_LABELS[role] ?? role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {menuItems.map((menu) => (
                <tr key={menu.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-900 sticky left-0 bg-white">
                    {menu.name}
                  </td>
                  {ROLES.map((role) => {
                    const key = makeKey(menu['@id'], role)
                    return (
                      <td key={key} className="px-3 py-3">
                        <div className="flex items-center justify-center gap-3">
                          {PERMS.map((p) => {
                            const Icon = PERM_ICONS[p]
                            const active = entries.get(key)?.[p as keyof AccessEntry] as boolean
                            const isToggling = toggling === key
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => toggle(key, p)}
                                disabled={isToggling}
                                className={`p-1.5 rounded-md transition-colors ${
                                  active
                                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={PERM_TITLES[p]}
                              >
                                <Icon className="h-4 w-4" />
                              </button>
                            )
                          })}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile card layout */}
          <div className="lg:hidden space-y-4">
            {menuItems.map((menu) => (
              <div key={menu.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-gray-900 text-sm">{menu.name}</h4>
                {ROLES.map((role) => {
                  const key = makeKey(menu['@id'], role)
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 min-w-[100px]">{ROLE_LABELS[role] ?? role}</span>
                      <div className="flex items-center gap-2">
                        {PERMS.map((p) => {
                          const Icon = PERM_ICONS[p]
                          const active = entries.get(key)?.[p as keyof AccessEntry] as boolean
                          const isToggling = toggling === key
                          return (
                            <button
                              key={p}
                              type="button"
                              onClick={() => toggle(key, p)}
                              disabled={isToggling}
                              className={`p-1.5 rounded-md transition-colors ${
                                active
                                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                                  : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={PERM_TITLES[p]}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
