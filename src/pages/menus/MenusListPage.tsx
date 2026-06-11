import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useMenus, useDeleteMenu } from '@/features/menus/hooks/useMenus'
import { useUiStore } from '@/store/ui.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import type { Menu as MenuType } from '@/types'
import {
  Menu as MenuIcon,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Folder,
  File,
} from 'lucide-react'

export default function MenusListPage() {
  const navigate = useNavigate()
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const { data: menus, isLoading } = useMenus()
  const { mutate: deleteMenu } = useDeleteMenu()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null)

  if (!canAccessFeature('manage_menus')) {
    return (
      <div className= "flex items-center justify-center py-12" >
      <p className="text-gray-500" > Accès non autorisé </p>
        </div>
    )
  }

  if (isLoading) {
    return (
      <div className= "flex items-center justify-center py-12" >
      <p className="text-gray-500" > Chargement...</p>
        </div>
    )
  }

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteMenu(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: 'Menu supprimé', type: 'success' })
        setDeleteTarget(null)
      },
      onError: () => addToast({ message: 'Erreur de suppression', type: 'error' }),
    })
  }

  const rootMenus = (menus ?? []).filter((m) => !m.parent)
  const childrenOf = (parentId: number) => (menus ?? []).filter((m) => m.parent === `/api/menus/${parentId}`)

  function renderTree(menuItem: MenuType) {
    const children = childrenOf(menuItem.id)
    const isExpanded = expanded.has(menuItem.id)
    const hasChildren = children.length > 0

    return (
      <div key= { menuItem.id } >
      <div className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded group" >
        <button
            onClick={ () => hasChildren && toggleExpand(menuItem.id) }
    className = {`p-0.5 ${hasChildren ? '' : 'invisible'}`
  }
          >
    { isExpanded?<ChevronDown className = "h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
</button>
{ hasChildren ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-gray-400" />}
<span className="flex-1 text-sm text-gray-900" > { menuItem.name } </span>
  < span className = "text-xs text-gray-400" > { menuItem.route ?? '—' } </span>
    < span className = "text-xs text-gray-400" > pos: { menuItem.position } </span>
      < div className = "hidden group-hover:flex items-center gap-1" >
        <button
              onClick={ () => navigate(`/menus/${menuItem.id}/edit`) }
className = "p-1 text-gray-400 hover:text-blue-600"
title = "Modifier"
  >
  <Edit className="h-3.5 w-3.5" />
    </button>
    < button
onClick = {() => setDeleteTarget({ id: menuItem.id, label: menuItem.name })}
className = "p-1 text-gray-400 hover:text-red-600"
title = "Supprimer"
  >
  <Trash2 className="h-3.5 w-3.5" />
    </button>
    </div>
    </div>
{
  hasChildren && isExpanded && (
    <div className="ml-6 border-l border-gray-200" >
      { children.map(renderTree) }
      </div>
        )
}
</div>
    )
  }

return (
  <div className= "space-y-6" >
  <div className="flex items-center justify-between" >
    <div>
    <h2 className="text-3xl font-bold text-gray-900" > Gestion des menus </h2>
      < p className = "mt-1 text-gray-600" > Configuration de l'arborescence de navigation</p>
        </div>
        < Link to = "/menus/new" >
          <Button><Plus className="h-5 w-5 mr-2" /> Nouveau menu </Button>
            </Link>
            </div>

            < Card >
            <CardHeader>
            <CardTitle className="text-gray-900" > Arborescence({ menus?.length ?? 0}) </CardTitle>
              </CardHeader>
              <CardContent>
{
  rootMenus.length === 0 ? (
    <div className= "text-center py-8" >
    <MenuIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-500" > Aucun menu </p>
        </div>
          ) : (
    <div className= "divide-y divide-gray-100" >
    { rootMenus.map(renderTree) }
    </div>
          )
}
</CardContent>
  </Card>

  < Modal isOpen = {!!deleteTarget} onClose = {() => setDeleteTarget(null)} title = "Confirmer la suppression" >
    <div className="space-y-4" >
      <p className="text-gray-600" >
        Supprimer < strong > { deleteTarget?.label } </strong> ?
        </p>
        < div className = "flex justify-end gap-3" >
          <Button variant="secondary" onClick = {() => setDeleteTarget(null)}> Annuler </Button>
            < Button variant = "danger" onClick = { handleDelete } > Supprimer </Button>
              </div>
              </div>
              </Modal>
              </div>
  )
}
