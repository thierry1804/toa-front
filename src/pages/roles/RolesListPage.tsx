import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRoles, useDeleteRole } from '@/features/roles/hooks/useRoles'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { StatStrip } from '@/components/ui/StatStrip'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { Plus, Edit, Trash2, Lock } from 'lucide-react'
import { formatDate } from '@/utils/date'

export default function RolesListPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const addToast = useUiStore((s) => s.addToast)
  const { mutate: deleteRole } = useDeleteRole()
  const perms = usePermissions('/roles')

  const [searchQuery, setSearchQuery] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number
    label: string
  } | null>(null)

  const { data: hydraData, isLoading } = useRoles(1, 100)
  const roles = hydraData?.member ?? []
  const totalItems = hydraData?.totalItems ?? 0

  const filtered = roles.filter((role) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      role.name.toLowerCase().includes(q) ||
      role.label.toLowerCase().includes(q) ||
      (role.description ?? '').toLowerCase().includes(q)
    )
  })

  const stats = {
    total: totalItems,
    system: roles.filter((r) => r.isSystem).length,
    custom: roles.filter((r) => !r.isSystem).length,
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteRole(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t('roles.toast.deleted'), type: 'success' })
        setDeleteTarget(null)
      },
      onError: (err: unknown) => {
        const key = (err as { response?: { data?: { error_key?: string } } })?.response?.data
          ?.error_key
        if (key === 'role_in_use') {
          addToast({ message: t('roles.toast.deleteErrorInUse'), type: 'error' })
        } else {
          addToast({ message: t('roles.toast.deleteError'), type: 'error' })
        }
        setDeleteTarget(null)
      },
    })
  }

  if (isLoading) {
    return <ListPageSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.description')}
        actions={
          perms?.canCreate ? (
            <Link to="/roles/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                {t('roles.newRole')}
              </Button>
            </Link>
          ) : undefined
        }
      />

      <StatStrip
        items={[
          { label: t('roles.stats.total'), value: stats.total },
          { label: t('roles.stats.system'), value: stats.system },
          { label: t('roles.stats.custom'), value: stats.custom },
        ]}
      />

      <Card>
        <CardSectionHeader className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {t('roles.listTitle', { count: filtered.length })}
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{t('roles.tableDescription')}</p>
          </div>
          <Input
            placeholder={t('roles.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="shadow-none"
          />
        </CardSectionHeader>

        <CardContent className={filtered.length === 0 ? undefined : 'p-0'}>
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">{t('roles.empty')}</p>
              {perms?.canCreate && (
                <Link to="/roles/new">
                  <Button className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('roles.createAction')}
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('roles.table.label')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('roles.table.name')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('roles.table.type')}
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-semibold text-gray-900 xl:table-cell">
                        {t('roles.table.description')}
                      </th>
                      <th className="hidden px-4 py-3 text-left text-sm font-semibold text-gray-900 md:table-cell">
                        {t('users.table.createdAt')}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                        {t('users.table.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{role.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                            {role.name}
                          </code>
                        </td>
                        <td className="px-4 py-3">
                          {role.isSystem ? (
                            <Badge variant="info">
                              <Lock className="mr-1 h-3 w-3" />
                              {t('roles.badge.system')}
                            </Badge>
                          ) : (
                            <Badge variant="success">{t('roles.badge.custom')}</Badge>
                          )}
                        </td>
                        <td className="hidden px-4 py-3 xl:table-cell">
                          <span className="text-sm text-gray-500">{role.description ?? '—'}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-sm text-gray-600 md:table-cell">
                          {formatDate(role.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {perms?.canEdit && (
                              <button
                                type="button"
                                onClick={() => navigate(`/roles/${role.id}/edit`)}
                                className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                title={t('common.edit')}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {perms?.canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  setDeleteTarget({ id: role.id, label: role.label })
                                }
                                disabled={role.isSystem}
                                className="rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30 enabled:text-gray-500 enabled:hover:bg-red-50 enabled:hover:text-red-600"
                                title={
                                  role.isSystem
                                    ? t('roles.systemRoleProtected')
                                    : t('common.delete')
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-gray-200 lg:hidden">
                {filtered.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-start justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">{role.label}</p>
                      <code className="mt-0.5 block truncate font-mono text-xs text-gray-500">
                        {role.name}
                      </code>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {role.isSystem ? (
                          <Badge variant="info">
                            <Lock className="mr-1 h-3 w-3" />
                            {t('roles.badge.system')}
                          </Badge>
                        ) : (
                          <Badge variant="success">{t('roles.badge.custom')}</Badge>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(role.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {perms?.canEdit && (
                        <button
                          type="button"
                          onClick={() => navigate(`/roles/${role.id}/edit`)}
                          className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                          title={t('common.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {perms?.canDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({ id: role.id, label: role.label })
                          }
                          disabled={role.isSystem}
                          className="rounded p-1.5 disabled:cursor-not-allowed disabled:opacity-30 enabled:text-gray-500 enabled:hover:bg-red-50 enabled:hover:text-red-600"
                          title={
                            role.isSystem
                              ? t('roles.systemRoleProtected')
                              : t('common.delete')
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('roles.deleteConfirm.title')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('roles.deleteConfirm.message')}{' '}
            <strong>{deleteTarget?.label}</strong> ? {t('roles.deleteConfirm.irreversible')}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
