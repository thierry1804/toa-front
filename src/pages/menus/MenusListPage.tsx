import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { usePermission, useHasPermissions } from '@/features/auth/usePermission'
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
  const canManageMenus = usePermission('manage_menus')
  const hasPermissions = useHasPermissions()
  const addToast = useUiStore((s) => s.addToast)
  const { data: menus, isLoading } = useMenus()
  const { mutate: deleteMenu } = useDeleteMenu()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null)

  if (hasPermissions && !canManageMenus) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('common.error')}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">{t('common.loading')}</p>
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
        addToast({ message: t('menus.list.deleted'), type: 'success' })
        setDeleteTarget(null)
      },
      onError: () => addToast({ message: t('menus.list.deleteError'), type: 'error' }),
    })
  }

  const rootMenus = (menus ?? []).filter((m) => !m.parent)
  const childrenOf = (parentId: number) => (menus ?? []).filter((m) => m.parent === `/api/menus/${parentId}`)

  function renderTree(menuItem: MenuType) {
    const children = childrenOf(menuItem.id)
    const isExpanded = expanded.has(menuItem.id)
    const hasChildren = children.length > 0

    return (
      <div key={menuItem.id}>
        <div className="flex items-center gap-2 px-2 sm:px-4 py-2 hover:bg-gray-50 rounded overflow-x-auto scrollbar-thin">
          <button
            onClick={() => hasChildren && toggleExpand(menuItem.id)}
            className={`shrink-0 p-0.5 ${hasChildren ? '' : 'invisible'}`}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
          <span className="shrink-0">{hasChildren ? <Folder className="h-4 w-4 text-blue-500" /> : <File className="h-4 w-4 text-gray-400" />}</span>
          <span className="min-w-0 shrink text-sm text-gray-900 truncate">{menuItem.name}</span>
          <span className="hidden sm:inline text-xs text-gray-400 shrink-0 truncate max-w-[120px]">{menuItem.route ?? '—'}</span>
          <span className="hidden sm:inline text-xs text-gray-400 shrink-0">pos:{menuItem.position}</span>
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              onClick={() => navigate(`/menus/${menuItem.id}/edit`)}
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
              title={t('common.edit')}
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDeleteTarget({ id: menuItem.id, label: menuItem.name })}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
              title={t('common.delete')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4 sm:ml-6 border-l border-gray-200">
            {children.map(renderTree)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('menus.list.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('menus.list.description')}</p>
        </div>
        <Link to="/menus/new" className="self-start sm:self-auto">
          <Button><Plus className="h-5 w-5 mr-2" />{t('menus.list.newMenu')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">{t('menus.list.treeTitle')} ({menus?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {rootMenus.length === 0 ? (
            <div className="text-center py-8">
              <MenuIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('menus.list.empty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 min-w-[400px] sm:min-w-0">
              {rootMenus.map(renderTree)}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('common.confirmDelete')}>
        <div className="space-y-4">
          <p className="text-gray-600">
            Supprimer <strong>{deleteTarget?.label}</strong> ?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
