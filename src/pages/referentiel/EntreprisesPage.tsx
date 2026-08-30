import { useState, useMemo } from 'react'
import { Building2, Plus, Edit, Trash2, Search, ShieldCheck } from 'lucide-react'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { useUiStore } from '@/store/ui.store'
import { useQueryClient } from '@tanstack/react-query'
import {
  useEntreprises,
  useCreateEntreprise,
  useUpdateEntreprise,
  useDeleteEntreprise,
} from '@/features/referentiel/hooks/useEntreprises'
import { useUsers } from '@/features/users/hooks/useUsers'
import { usersApi } from '@/api/usersApi'
import { USERS_KEY } from '@/data/constant/query'
import { parseApiFieldErrors } from '@/lib/apiErrors'
import { sortNewestFirst } from '@/lib/listOrder'
import { useTranslation } from 'react-i18next'
import type { Entreprise } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { listFiltersContainerClass } from '@/components/ui/ListTable'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import Modal from '@/components/ui/Modal'
import EntrepriseFormFields, {
  emptyEntrepriseFormValues,
  type EntrepriseFormValues,
} from '@/components/entreprise/EntrepriseFormFields'

export default function EntreprisesPage() {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const perms = usePermissions('/referentiel/entreprises')
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Entreprise | null>(null)
  const [form, setForm] = useState<EntrepriseFormValues>(emptyEntrepriseFormValues())
  const [nomError, setNomError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<Entreprise | null>(null)

  // Équipe HSE : quels utilisateurs ROLE_HSE sont rattachés à cette entreprise.
  // La relation User → Entreprise est mono-valuée (un seul rattachement par
  // utilisateur) : rattacher un HSE ici le détache automatiquement de toute
  // autre entreprise à laquelle il appartenait.
  const [selectedHseIds, setSelectedHseIds] = useState<Set<number>>(new Set())
  const [initialHseIds, setInitialHseIds] = useState<Set<number>>(new Set())
  const [savingTeam, setSavingTeam] = useState(false)

  const { data: entreprises = [], isLoading } = useEntreprises()
  const { mutate: create, isPending: creating } = useCreateEntreprise()
  const { mutate: update, isPending: updating } = useUpdateEntreprise()
  const { mutate: remove, isPending: deleting } = useDeleteEntreprise()
  const { data: usersData } = useUsers(1, 1000)

  const hseUsers = useMemo(
    () => (usersData?.member ?? []).filter((u) => u.roles.includes('ROLE_HSE')),
    [usersData],
  )

  // Un HSE déjà affecté à une autre entreprise n'apparaît pas dans la liste :
  // seuls les HSE libres et ceux déjà dans l'équipe courante sont proposés.
  const selectableHseUsers = useMemo(
    () => hseUsers.filter((u) => !u.entreprise || u.entreprise.id === editTarget?.id),
    [hseUsers, editTarget],
  )

  const isSaving = creating || updating || savingTeam

  const toggleHseUser = (id: number) => {
    setSelectedHseIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const applyHseTeamChanges = async (entrepriseIri: string) => {
    const toAdd = [...selectedHseIds].filter((id) => !initialHseIds.has(id))
    const toRemove = [...initialHseIds].filter((id) => !selectedHseIds.has(id))
    if (toAdd.length === 0 && toRemove.length === 0) return

    setSavingTeam(true)
    const results = await Promise.allSettled([
      ...toAdd.map((id) => usersApi.patch(id, { entreprise: entrepriseIri })),
      ...toRemove.map((id) => usersApi.patch(id, { entreprise: null })),
    ])
    setSavingTeam(false)

    const failures = results.filter((r) => r.status === 'rejected').length
    if (failures > 0) {
      addToast({
        message: `Équipe HSE : ${failures} mise${failures > 1 ? 's' : ''} à jour ont échoué`,
        type: 'error',
      })
    }
    void queryClient.invalidateQueries({ queryKey: USERS_KEY })
  }

  const filtered = sortNewestFirst(
    search
      ? entreprises.filter((e) =>
          e.nom.toLowerCase().includes(search.toLowerCase()) ||
          (e.numeroRegistreCommerce ?? '').toLowerCase().includes(search.toLowerCase()),
        )
      : entreprises,
  )

  const handleFieldChange = (field: keyof EntrepriseFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'nom') setNomError('')
  }

  const openCreate = () => {
    setEditTarget(null)
    setForm(emptyEntrepriseFormValues())
    setNomError('')
    setSelectedHseIds(new Set())
    setInitialHseIds(new Set())
    setModalOpen(true)
  }

  const openEdit = (item: Entreprise) => {
    setEditTarget(item)
    setForm({
      nom: item.nom,
      numeroRegistreCommerce: item.numeroRegistreCommerce ?? '',
      siegeSocial: item.siegeSocial ?? '',
      qualiteRepresentant: item.qualiteRepresentant ?? '',
    })
    setNomError('')
    const currentTeam = new Set(
      hseUsers.filter((u) => u.entreprise?.id === item.id).map((u) => u.id),
    )
    setSelectedHseIds(currentTeam)
    setInitialHseIds(currentTeam)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditTarget(null)
    setForm(emptyEntrepriseFormValues())
    setNomError('')
    setSelectedHseIds(new Set())
    setInitialHseIds(new Set())
  }

  const handleSave = () => {
    const trimmedNom = form.nom.trim()
    if (!trimmedNom) {
      setNomError('Le nom est obligatoire')
      return
    }
    if (trimmedNom.length > 255) {
      setNomError('255 caractères maximum')
      return
    }

    const payload = {
      nom: trimmedNom,
      numeroRegistreCommerce: form.numeroRegistreCommerce.trim() || null,
      siegeSocial: form.siegeSocial.trim() || null,
      qualiteRepresentant: form.qualiteRepresentant.trim() || null,
    }

    const handleSaveError = (error: unknown, fallback: string) => {
      const fieldErrors = parseApiFieldErrors(error, { nom: 'nom' })
      if (fieldErrors.nom) {
        setNomError(t(`errors.${fieldErrors.nom}`, fieldErrors.nom))
        return
      }
      addToast({ message: fallback, type: 'error' })
    }

    if (editTarget) {
      update(
        { id: editTarget.id, data: payload },
        {
          onSuccess: async (updated) => {
            addToast({ message: 'Entreprise mise à jour', type: 'success' })
            await applyHseTeamChanges(updated['@id'])
            closeModal()
          },
          onError: (error) => handleSaveError(error, 'Erreur lors de la mise à jour'),
        },
      )
    } else {
      create(payload, {
        onSuccess: async (created) => {
          addToast({ message: 'Entreprise créée', type: 'success' })
          await applyHseTeamChanges(created['@id'])
          closeModal()
        },
        onError: (error) => handleSaveError(error, 'Erreur lors de la création'),
      })
    }
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    remove(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: 'Entreprise supprimée', type: 'success' })
        setDeleteTarget(null)
      },
      onError: () => {
        addToast({ message: 'Erreur lors de la suppression', type: 'error' })
        setDeleteTarget(null)
      },
    })
  }

  const handleSearch = () => setSearch(searchInput)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch()
  }
  const handleSearchClear = () => { setSearchInput(''); setSearch('') }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Gestion des entreprises</h1>
            <p className="text-sm text-gray-500">Prestataires et partenaires HSE</p>
          </div>
        </div>
        {perms?.canCreate && (
          <Button onClick={openCreate} className="self-start sm:self-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle entreprise
          </Button>
        )}
      </div>

      <Card>
        <CardContent className={listFiltersContainerClass}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                className="pl-9"
                placeholder="Rechercher par nom ou registre commerce..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <Button onClick={handleSearch} variant="outline">Rechercher</Button>
            {search && (
              <Button onClick={handleSearchClear} variant="secondary">Effacer</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? 'Chargement…' : `${filtered.length} entreprise${filtered.length !== 1 ? 's' : ''}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <ListPageSkeleton rows={5} bare />
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Aucune entreprise trouvée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Entreprise</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">N° Registre Commerce</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Siège Social</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">Qualité Représentant</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{e.nom}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{e.numeroRegistreCommerce ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{e.siegeSocial ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{e.qualiteRepresentant ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {perms?.canEdit && (
                            <Button variant="ghost" size="sm" onClick={() => openEdit(e)} title="Modifier">
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          {perms?.canDelete && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(e)}
                              title="Supprimer"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editTarget ? "Modifier l'entreprise" : 'Nouvelle entreprise'}
      >
        <div className="space-y-4">
          <EntrepriseFormFields
            values={form}
            onChange={handleFieldChange}
            nomError={nomError}
            disabled={isSaving}
            autoFocusNom
          />

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Équipe HSE
            </label>
            <p className="mb-2 text-xs text-gray-500">
              Utilisateurs au profil HSE rattachés à cette entreprise. Un HSE ne peut être rattaché qu'à une seule entreprise à la fois.
            </p>
            {selectableHseUsers.length === 0 ? (
              <p className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-400">
                Aucun utilisateur HSE disponible (tous déjà affectés à une autre entreprise).
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {selectableHseUsers.map((u) => (
                  <Checkbox
                    key={u.id}
                    label={`${u.firstname} ${u.name}`}
                    description={u.email}
                    checked={selectedHseIds.has(u.id)}
                    onChange={() => toggleHseUser(u.id)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={isSaving}>Annuler</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement…' : editTarget ? 'Mettre à jour' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Supprimer <strong>{deleteTarget?.nom}</strong> ? Les utilisateurs liés perdront leur lien entreprise.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Suppression…' : 'Supprimer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
