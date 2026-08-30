import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMenus } from '@/features/menus/hooks/useMenus'
import { useMenuAccesses } from '@/features/menus/hooks/useMenuAccesses'
import { useRoles } from '@/features/roles/hooks/useRoles'
import { menuAccessesApi } from '@/api/menuAccessesApi'
import { useUiStore } from '@/store/ui.store'
import { ACCESSES_KEY } from '@/data/constant/query'
import type { Menu, Role } from '@/types'

export type AccessKey = string

export interface AccessEntry {
  key: AccessKey
  menu: string
  role: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  id?: number
}

export function makeKey(menu: string, role: string): AccessKey {
  return `${menu}|${role}`
}

export interface RoleManagementResult {
  menuItems: Menu[]
  roles: Role[]
  entries: Map<AccessKey, AccessEntry>
  toggling: AccessKey | null
  toggle: (key: AccessKey, perm: string) => Promise<void>
  isLoading: boolean
}

export function useRoleManagement(): RoleManagementResult {
  const addToast = useUiStore((s) => s.addToast)
  const queryClient = useQueryClient()

  const { data: menus, isLoading: menusLoading } = useMenus()
  const { data: accesses, isLoading: accessesLoading } = useMenuAccesses()
  const { data: rolesData, isLoading: rolesLoading } = useRoles(1, 200)

  const menuItems = useMemo(
    () => (menus ?? []).filter((m) => m.name !== 'Dashboard'),
    [menus],
  )
  const roles = useMemo(() => rolesData?.member ?? [], [rolesData?.member])

  const [entries, setEntries] = useState<Map<AccessKey, AccessEntry>>(new Map())
  const [loaded, setLoaded] = useState(false)
  const [toggling, setToggling] = useState<AccessKey | null>(null)

  useEffect(() => {
    if (!menus || !accesses || !roles.length || loaded) return
    const filtered = menus.filter((m) => m.name !== 'Dashboard')
    const map = new Map<AccessKey, AccessEntry>()
    for (const menu of filtered) {
      for (const roleObj of roles) {
        const key = makeKey(menu['@id'], roleObj.name)
        const existing = accesses.find((a) => a.menu === menu['@id'] && a.role === roleObj.name)
        const isSuperAdmin = roleObj.name === 'ROLE_SUPER_ADMIN'
        map.set(key, {
          key,
          menu: menu['@id'],
          role: roleObj.name,
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
  }, [menus, accesses, roles, loaded])

  const toggle = useCallback(async (key: AccessKey, perm: string) => {
    setToggling(key)
    const entry = entries.get(key)
    if (!entry) { setToggling(null); return }

    const updated = { ...entry, [perm]: !entry[perm as keyof AccessEntry] }
    setEntries((prev) => { const next = new Map(prev); next.set(key, updated); return next })

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
        queryClient.invalidateQueries({ queryKey: ACCESSES_KEY })
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
        queryClient.invalidateQueries({ queryKey: ACCESSES_KEY })
      }
    } catch {
      addToast({ message: 'Erreur lors de la mise à jour des permissions', type: 'error' })
      setEntries((prev) => { const next = new Map(prev); next.set(key, entry); return next })
    } finally {
      setToggling(null)
    }
  }, [entries, addToast, queryClient])

  return {
    menuItems,
    roles,
    entries,
    toggling,
    toggle,
    isLoading: menusLoading || accessesLoading || rolesLoading,
  }
}
