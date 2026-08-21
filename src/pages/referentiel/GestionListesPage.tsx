import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import {
  useCategoriesRisque,
  useCategoriesRisqueAll,
  useCreateCategorieRisque,
  useUpdateCategorieRisque,
  useDeleteCategorieRisque,
} from '@/features/referentiel/hooks/useCategorieRisque'
import type { CategorieRisque } from '@/types/referentiel'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardSectionHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/date'

const PAGE_SIZE = 20

export default function GestionListesPage() {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const perms = usePermissions('/referentiel/listes')

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategorieRisque | null>(null)
  const [nomInput, setNomInput] = useState('')
  const [nomError, setNomError] = useState('')
  const [typePermisInput, setTypePermisInput] = useState<'ELECTRIQUE' | 'HAUTEUR' | ''>('')
  const [parentIdInput, setParentIdInput] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<CategorieRisque | null>(null)

  const { data, isLoading } = useCategoriesRisque(page, search)
  const categories = data?.member ?? []
  const totalItems = data?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const { data: allCategoriesData } = useCategoriesRisqueAll()
  const parentOptions = (allCategoriesData?.member ?? []).filter(
    (c) => !c.parentId && c.id !== editTarget?.id,
  )

  const { mutate: create, isPending: creating } = useCreateCategorieRisque()
  const { mutate: update, isPending: updating } = useUpdateCategorieRisque()
  const { mutate: remove, isPending: deleting } = useDeleteCategorieRisque()

  const isSaving = creating || updating

  const openCreate = () => {
    setEditTarget(null)
    setNomInput('')
    setNomError('')
    setTypePermisInput('')
    setParentIdInput('')
    setModalOpen(true)
  }

  const openEdit = (cat: CategorieRisque) => {
    setEditTarget(cat)
    setNomInput(cat.nom)
    setNomError('')
    setTypePermisInput((cat.typePermis as 'ELECTRIQUE' | 'HAUTEUR' | '') ?? '')
    setParentIdInput(cat.parentId ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setNomInput('')
    setNomError('')
    setTypePermisInput('')
    setParentIdInput('')
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

    const payload = {
      nom: trimmed,
      typePermis: typePermisInput || null,
      parent: parentIdInput ? `/api/referentiel/categories-risque/${parentIdInput}` : null,
    }

    if (editTarget) {
      update(
        { id: editTarget.id, data: payload },
        {
          onSuccess: () => {
            addToast({ message: t('referentiel.listes.toast.updated'), type: 'success' })
            closeModal()
          },
          onError: () => {
            addToast({ message: t('referentiel.listes.toast.updateError'), type: 'error' })
          },
        },
      )
    } else {
      create(payload, {
        onSuccess: () => {
          addToast({ message: t('referentiel.listes.toast.created'), type: 'success' })
          closeModal()
        },
        onError: () => {
          addToast({ message: t('referentiel.listes.toast.createError'), type: 'error' })
        },
      })
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: t('referentiel.listes.toast.deleted'), type: 'success' })
        setDeleteTarget(null)
        if (page > 1 && categories.length === 1) setPage(page - 1)
      },
      onError: () => {
        addToast({ message: t('referentiel.listes.toast.deleteError'), type: 'error' })
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
        title={t('referentiel.listes.title')}
        description={t('referentiel.listes.subtitle')}
        actions={
          perms?.canCreate ? (
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t('referentiel.listes.newCategory')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardSectionHeader className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('referentiel.listes.listTitle')}
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
        <CardContent className={categories.length === 0 && !isLoading ? undefined : 'p-0'}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">{t('referentiel.shared.loading')}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">
                {search ? t('referentiel.shared.emptySearch') : t('referentiel.listes.empty')}
              </p>
              {perms?.canCreate && !search && (
                <Button className="mt-4" variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('referentiel.listes.createFirst')}
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
                        {t('referentiel.listes.headers.nom')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.listes.headers.parent')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.listes.headers.typePermis')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.listes.headers.createdAt')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                        {t('referentiel.listes.headers.updatedAt')}
                      </th>
                      {(perms?.canEdit || perms?.canDelete) && (
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {t('referentiel.shared.actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className={`flex items-center gap-2 ${cat.parentId ? 'pl-5' : ''}`}>
                            <Tag className="h-4 w-4 shrink-0 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{cat.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat.parentNom ? (
                            <span className="text-sm text-gray-600">{cat.parentNom}</span>
                          ) : (
                            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                              {t('referentiel.listes.rootCategory')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {cat.typePermis ? (
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                cat.typePermis === 'ELECTRIQUE'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {cat.typePermis === 'ELECTRIQUE'
                                ? t('referentiel.listes.typePermis.electrique')
                                : t('referentiel.listes.typePermis.hauteur')}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {t('referentiel.listes.typePermis.none')}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(cat.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {cat.updatedAt ? formatDate(cat.updatedAt) : '—'}
                        </td>
                        {(perms?.canEdit || perms?.canDelete) && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {perms?.canEdit && (
                                <button
                                  onClick={() => openEdit(cat)}
                                  className="rounded p-1.5 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                  title={t('referentiel.shared.edit')}
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {perms?.canDelete && (
                                <button
                                  onClick={() => setDeleteTarget(cat)}
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
            ? t('referentiel.listes.modal.editTitle')
            : t('referentiel.listes.modal.createTitle')
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('referentiel.listes.modal.nomLabel')}{' '}
              <span className="text-red-500">*</span>
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
              placeholder={t('referentiel.listes.modal.nomPlaceholder')}
              autoFocus
              className="shadow-none"
            />
            {nomError && <p className="mt-1 text-xs text-red-600">{nomError}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('referentiel.listes.modal.parentLabel')}
            </label>
            <select
              value={parentIdInput}
              onChange={(e) => setParentIdInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t('referentiel.listes.modal.parentNone')}</option>
              {parentOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">{t('referentiel.listes.modal.parentHint')}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('referentiel.listes.modal.typePermisLabel')}
            </label>
            <select
              value={typePermisInput}
              onChange={(e) => setTypePermisInput(e.target.value as 'ELECTRIQUE' | 'HAUTEUR' | '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">{t('referentiel.listes.modal.typePermisNone')}</option>
              <option value="ELECTRIQUE">{t('referentiel.listes.typePermis.electrique')}</option>
              <option value="HAUTEUR">{t('referentiel.listes.typePermis.hauteur')}</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">{t('referentiel.listes.modal.typePermisHint')}</p>
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
        title={t('referentiel.listes.deleteModal.title')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {t('referentiel.listes.deleteModal.message', { name: deleteTarget?.nom })}
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
