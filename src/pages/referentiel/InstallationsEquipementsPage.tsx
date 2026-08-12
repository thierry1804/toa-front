import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Wrench, Plus, Edit, Trash2, Search } from 'lucide-react'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import {
  useInstallationsEquipements,
  useCreateInstallationEquipement,
  useUpdateInstallationEquipement,
  useDeleteInstallationEquipement,
} from '@/features/referentiel/hooks/useInstallationEquipement'
import type { InstallationEquipement } from '@/types/referentiel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/date'

const PAGE_SIZE = 20

export default function InstallationsEquipementsPage() {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const perms = usePermissions('/referentiel/installations')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<InstallationEquipement | null>(null)
  const [nomInput, setNomInput] = useState('')
  const [nomError, setNomError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<InstallationEquipement | null>(null)

  const { data, isLoading } = useInstallationsEquipements(page, search)
  const items = data?.member ?? []
  const totalItems = data?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const { mutate: create, isPending: creating } = useCreateInstallationEquipement()
  const { mutate: update, isPending: updating } = useUpdateInstallationEquipement()
  const { mutate: remove, isPending: deleting } = useDeleteInstallationEquipement()

  const isSaving = creating || updating

  const openCreate = () => {
    setEditTarget(null)
    setNomInput('')
    setNomError('')
    setModalOpen(true)
  }

  const openEdit = (item: InstallationEquipement) => {
    setEditTarget(item)
    setNomInput(item.nom)
    setNomError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setNomInput('')
    setNomError('')
  }

  const handleSave = () => {
    const trimmed = nomInput.trim()
    if (!trimmed) {
      setNomError(t('referentiel.shared.nomRequired'))
      return
    }
    if (trimmed.length > 255) {
      setNomError(t('referentiel.shared.nomMaxLength'))
      return
    }

    if (editTarget) {
      update(
        { id: editTarget.id, data: { nom: trimmed } },
        {
          onSuccess: () => {
            addToast({ message: t('referentiel.installations.toast.updated'), type: 'success' })
            closeModal()
          },
          onError: () => {
            addToast({ message: t('referentiel.installations.toast.updateError'), type: 'error' })
          },
        },
      )
    } else {
      create(
        { nom: trimmed },
        {
          onSuccess: () => {
            addToast({ message: t('referentiel.installations.toast.created'), type: 'success' })
            closeModal()
          },
          onError: () => {
            addToast({ message: t('referentiel.installations.toast.createError'), type: 'error' })
          },
        },
      )
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t('referentiel.installations.toast.deleted'), type: 'success' })
        setDeleteTarget(null)
        if (page > 1 && items.length === 1) setPage(page - 1)
      },
      onError: () => {
        addToast({ message: t('referentiel.installations.toast.deleteError'), type: 'error' })
        setDeleteTarget(null)
      },
    })
  }

  const handleSearch = () => {
    setPage(1)
    setSearch(searchInput)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleSearchClear = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('referentiel.installations.title')}
        description={t('referentiel.installations.subtitle')}
        actions={
          perms?.canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('referentiel.installations.new')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardSectionHeader className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('referentiel.installations.listTitle')}
            <span className="ml-1 font-normal text-gray-500">({totalItems})</span>
          </h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9 shadow-none"
                placeholder={t('referentiel.shared.searchPlaceholder')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              {t('referentiel.shared.search')}
            </Button>
            {search && (
              <Button onClick={handleSearchClear} variant="secondary">
                {t('referentiel.shared.clear')}
              </Button>
            )}
          </div>
        </CardSectionHeader>
        <CardContent className={items.length === 0 && !isLoading ? undefined : 'p-0'}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">{t('referentiel.shared.loading')}</p>
            </div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                {search ? t('referentiel.shared.emptySearch') : t('referentiel.installations.empty')}
              </p>
              {perms?.canCreate && !search && (
                <Button className="mt-4" variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('referentiel.installations.createFirst')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.shared.nom')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.shared.createdAt')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.shared.updatedAt')}
                      </th>
                      {(perms?.canEdit || perms?.canDelete) && (
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {t('referentiel.shared.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Wrench className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{item.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(item.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {item.updatedAt ? formatDate(item.updatedAt) : '—'}
                        </td>
                        {(perms?.canEdit || perms?.canDelete) && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {perms?.canEdit && (
                                <button
                                  onClick={() => openEdit(item)}
                                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                  title={t('referentiel.shared.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {perms?.canDelete && (
                                <button
                                  onClick={() => setDeleteTarget(item)}
                                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
                                  title={t('referentiel.shared.delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    {t('referentiel.shared.pagination', {
                      page,
                      totalPages,
                      count: totalItems,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                      {t('referentiel.shared.prev')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      {t('referentiel.shared.next')}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={
          editTarget
            ? t('referentiel.installations.modal.editTitle')
            : t('referentiel.installations.modal.createTitle')
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('referentiel.shared.nom')} <span className="text-red-500">*</span>
            </label>
            <Input
              value={nomInput}
              onChange={(e) => {
                setNomInput(e.target.value)
                if (nomError) setNomError('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
              }}
              placeholder={t('referentiel.installations.modal.nomPlaceholder')}
              autoFocus
              className="shadow-none"
            />
            {nomError && <p className="mt-1 text-xs text-red-600">{nomError}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={isSaving}>
              {t('referentiel.shared.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? t('referentiel.shared.saving')
                : editTarget
                  ? t('referentiel.shared.update')
                  : t('referentiel.shared.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('referentiel.installations.deleteModal.title')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('referentiel.installations.deleteModal.message', { name: deleteTarget?.nom })}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              {t('referentiel.shared.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('referentiel.shared.deleting') : t('referentiel.shared.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
