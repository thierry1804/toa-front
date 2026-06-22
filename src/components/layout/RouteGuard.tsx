import { useMemo } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useMenuStore } from '@/store/menu.store'
import { Loader2 } from 'lucide-react'
import type { MenuNode } from '@/types'

function flattenMenu(nodes: MenuNode[]): MenuNode[] {
  const out: MenuNode[] = []
  const walk = (items: MenuNode[]) => {
    for (const n of items) { out.push(n); walk(n.children) }
  }
  walk(nodes)
  return out
}

interface RouteGuardProps {
  menuRoute: string
}

export function RouteGuard({ menuRoute }: RouteGuardProps) {
  const items = useMenuStore((s) => s.items)
  const loading = useMenuStore((s) => s.loading)
  const loaded = useMenuStore((s) => s.loaded)
  const error = useMenuStore((s) => s.error)

  const canView = useMemo(() => {
    if (!loaded || loading) return null
    if (error) return true  // API failure — don't lock users out
    const node = flattenMenu(items).find((n) => n.route === menuRoute)
    if (!node) return false
    return node.canView ?? true
  }, [items, loading, loaded, error, menuRoute])

  if (canView === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!canView) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
