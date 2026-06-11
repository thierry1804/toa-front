import { useMemo } from 'react'
import { useMenuStore } from '@/store/menu.store'
import type { MenuNode } from '@/types'

export interface MenuPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

function flattenTree(items: MenuNode[]): MenuNode[] {
  const result: MenuNode[] = []
  function walk(nodes: MenuNode[]) {
    for (const n of nodes) {
      result.push(n)
      walk(n.children)
    }
  }
  walk(items)
  return result
}

export function usePermissions(menuRoute: string): MenuPermissions | null {
  const items = useMenuStore((s) => s.items)

  return useMemo(() => {
    const all = flattenTree(items)
    const node = all.find((n) => n.route === menuRoute)
    if (!node) return null
    return {
      canView: node.canView ?? true,
      canCreate: node.canCreate ?? false,
      canEdit: node.canEdit ?? false,
      canDelete: node.canDelete ?? false,
    }
  }, [items, menuRoute])
}
