import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useMenuAccesses, useDeleteMenuAccess } from '@/features/menus/hooks/useMenuAccesses'
import { useMenus } from '@/features/menus/hooks/useMenus'
import { useUiStore } from '@/store/ui.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Shield, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { ROLE_LABELS } from '@/data/constant/roles'
import { PERM_LABELS } from '@/data/constant/permissions'

export default function MenuAccessesListPage() {
  const navigate = useNavigate()
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const { data: accesses, isLoading } = useMenuAccesses()
  const { data: menus } = useMenus()
  const { mutate: deleteAccess } = useDeleteMenuAccess()
  const { t } = useTranslation()
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null)

  if (!canAccessFeature('manage_menus')) {
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

  const menuById = (iri: string) => menus?.find((m) => m['@id'] === iri)

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteAccess(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t('menus.accesses.deleted'), type: 'success' })
        setDeleteTarget(null)
      },
      onError: () => addToast({ message: t('common.error'), type: 'error' }),
    })
  }

  const perms = ['canView', 'canCreate', 'canEdit', 'canDelete'] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('menus.accesses.title')}</h2>
          <p className="mt-1 text-sm text-gray-600">{t('menus.accesses.description')}</p>
        </div>
        <Link to="/menu-accesses/new" className="self-start sm:self-auto">
          <Button><Plus className="h-5 w-5 mr-2" />{t('menus.accesses.new')}</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">{t('menus.accesses.rules')} ({accesses?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {accesses?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('menus.accesses.empty')}</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('menus.accesses.table.menu')}</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">{t('menus.accesses.table.role')}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{t('menus.accesses.table.voir')}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{t('menus.accesses.table.creer')}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{t('menus.accesses.table.modifier')}</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{t('menus.accesses.table.supprimer')}</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">{t('menus.accesses.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(accesses ?? []).map((a) => {
                      const m = menuById(a.menu)
                      return (
                        <tr key={a.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{m?.name ?? a.menu}</td>
                          <td className="px-4 py-3">
                            <Badge>{ROLE_LABELS[a.role] ?? a.role}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">{a.canView ? <Check className="h-4 w-4 text-green-600 inline" /> : <X className="h-4 w-4 text-red-400 inline" />}</td>
                          <td className="px-4 py-3 text-center">{a.canCreate ? <Check className="h-4 w-4 text-green-600 inline" /> : <X className="h-4 w-4 text-red-400 inline" />}</td>
                          <td className="px-4 py-3 text-center">{a.canEdit ? <Check className="h-4 w-4 text-green-600 inline" /> : <X className="h-4 w-4 text-red-400 inline" />}</td>
                          <td className="px-4 py-3 text-center">{a.canDelete ? <Check className="h-4 w-4 text-green-600 inline" /> : <X className="h-4 w-4 text-red-400 inline" />}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => navigate(`/menu-accesses/${a.id}/edit`)} className="p-1.5 text-gray-600 hover:text-blue-600 rounded" title={t('common.edit')}>
                                <Edit className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeleteTarget({ id: a.id, label: `${m?.name ?? a.menu} - ${ROLE_LABELS[a.role] ?? a.role}` })} className="p-1.5 text-gray-600 hover:text-red-600 rounded" title={t('common.delete')}>
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden space-y-3">
                {(accesses ?? []).map((a) => {
                  const m = menuById(a.menu)
                  return (
                    <div key={a.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{m?.name ?? a.menu}</p>
                          <Badge>{ROLE_LABELS[a.role] ?? a.role}</Badge>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button onClick={() => navigate(`/menu-accesses/${a.id}/edit`)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50" title={t('common.edit')}>
                            <Edit className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteTarget({ id: a.id, label: `${m?.name ?? a.menu} - ${ROLE_LABELS[a.role] ?? a.role}` })} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" title={t('common.delete')}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {perms.map((p) => (
                          <span
                            key={p}
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              a[p]
                                ? 'bg-green-50 text-green-700'
                                : 'bg-gray-50 text-gray-400'
                            }`}
                          >
                            {a[p] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            {PERM_LABELS[p]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('common.confirm')}>
        <div className="space-y-4">
          <p className="text-gray-600">{t('menus.accesses.deleteConfirm.message', { label: deleteTarget?.label })}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
