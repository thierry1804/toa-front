import { useState } from 'react'
import { List, Plus, Edit, Trash2, Search, Tag } from 'lucide-react'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import {
  useCategoriesRisque,
  useCreateCategorieRisque,
  useUpdateCategorieRisque,
  useDeleteCategorieRisque,
} from '@/features/referentiel/hooks/useCategorieRisque'
import type { CategorieRisque } from '@/types/referentiel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import { formatDate } from '@/utils/date'

const PAGE_SIZE = 20

export default function GestionListesPage() {
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

  const [deleteTarget, setDeleteTarget] = useState<CategorieRisque | null>(null)

  const { data, isLoading } = useCategoriesRisque(page, search)
  const categories = data?.member ?? []
  const totalItems = data?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))

  const { mutate: create, isPending: creating } = useCreateCategorieRisque()
  const { mutate: update, isPending: updating } = useUpdateCategorieRisque()
  const { mutate: remove, isPending: deleting } = useDeleteCategorieRisque()

  const isSaving = creating || updating

  const openCreate = () => {
    setEditTarget(null)
    setNomInput('')
    setNomError('')
    setTypePermisInput('')
    setModalOpen(true)
  }

  const openEdit = (cat: CategorieRisque) => {
    setEditTarget(cat)
    setNomInput(cat.nom)
    setNomError('')
    setTypePermisInput((cat.typePermis as 'ELECTRIQUE' | 'HAUTEUR' | '') ?? '')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setNomInput('')
    setNomError('')
    setTypePermisInput('')
  }

  const handleSave = () => {
    const trimmed = nomInput.trim()
    if (!trimmed) {
      setNomError('Le nom est obligatoire')
      return
    }
    if (trimmed.length > 255) {
      setNomError('255 caractères maximum')
      return
    }

    const payload = { nom: trimmed, typePermis: typePermisInput || null }

    if (editTarget) {
      update(
        { id: editTarget.id, data: payload },
        {
          onSuccess: () => {
            addToast({ message: 'Catégorie mise à jour', type: 'success' })
            closeModal()
          },
          onError: () => {
            addToast({ message: 'Erreur lors de la mise à jour', type: 'error' })
          },
        },
      )
    } else {
      create(
        payload,
        {
          onSuccess: () => {
            addToast({ message: 'Catégorie créée', type: 'success' })
            closeModal()
          },
          onError: () => {
            addToast({ message: 'Erreur lors de la création', type: 'error' })
          },
        },
      )
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: 'Catégorie supprimée', type: 'success' })
        setDeleteTarget(null)
        if (page > 1 && categories.length === 1) setPage(page - 1)
      },
      onError: () => {
        addToast({ message: 'Erreur lors de la suppression', type: 'error' })
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <List className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Gestion de risques</h1>
            <p className="text-sm text-gray-500">Catégories de risque</p>
          </div>
        </div>
        {perms?.canCreate && (
          <Button
            onClick={openCreate}
            className="self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle catégorie
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Rechercher par nom..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Rechercher
            </Button>
            {search && (
              <Button onClick={handleSearchClear} variant="secondary">
                Effacer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Catégories de risque{' '}
            <span className="text-sm font-normal text-gray-500">({totalItems})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-500">Chargement...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {search ? 'Aucun résultat pour cette recherche' : 'Aucune catégorie de risque'}
              </p>
              {perms?.canCreate && !search && (
                <Button className="mt-4" variant="outline" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la première catégorie
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type permis</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date création</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date modification</th>
                      {(perms?.canEdit || perms?.canDelete) && (
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-purple-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">{cat.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {cat.typePermis ? (
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              cat.typePermis === 'ELECTRIQUE' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {cat.typePermis === 'ELECTRIQUE' ? 'Électrique' : 'Hauteur'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
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
                                  className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Modifier"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {perms?.canDelete && (
                                <button
                                  onClick={() => setDeleteTarget(cat)}
                                  className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Supprimer"
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                  <p className="text-sm text-gray-600">
                    Page {page} / {totalPages} — {totalItems} entrées
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? 'Modifier la catégorie' : 'Nouvelle catégorie de risque'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom <span className="text-red-500">*</span>
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
              placeholder="Ex: Risque électrique"
              autoFocus
            />
            {nomError && <p className="mt-1 text-xs text-red-600">{nomError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type permis associé</label>
            <select
              value={typePermisInput}
              onChange={(e) => setTypePermisInput(e.target.value as 'ELECTRIQUE' | 'HAUTEUR' | '')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">— Aucun (général) —</option>
              <option value="ELECTRIQUE">Électrique</option>
              <option value="HAUTEUR">Hauteur</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">Utilisé pour filtrer les risques lors de la création de permis</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeModal} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : editTarget ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer la catégorie"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Supprimer <strong>{deleteTarget?.nom}</strong> ? Cette action est irréversible.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
