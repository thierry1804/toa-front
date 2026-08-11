import { useEffect, useMemo } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMenuStore } from '@/store/menu.store'
import { useUiStore } from '@/store/ui.store'
import { AlertTriangle, Loader2 } from 'lucide-react'
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
  const addToast = useUiStore((s) => s.addToast)
  const location = useLocation()

  const canView = useMemo(() => {
    if (!loaded || loading) return null
    if (error) return true  // API failure — don't lock users out
    const node = flattenMenu(items).find((n) => n.route === menuRoute)
    if (!node) return false
    return node.canView ?? true
  }, [items, loading, loaded, error, menuRoute])

  useEffect(() => {
    if (canView === false) {
      addToast({ message: 'Accès non autorisé à cette page', type: 'error' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, location.pathname])

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

  return (
    <>
      {error && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Vérification des permissions indisponible — accès temporairement non restreint.
        </div>
      )}
      <Outlet />
    </>
  )
}
