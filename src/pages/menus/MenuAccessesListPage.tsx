import { useState } from 'react'
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

const ROLE_LABELS: Record<string, string> = {
  ROLE_SUPER_ADMIN: 'Super Admin',
  ROLE_ADMIN: 'Admin',
  ROLE_CHEF_PROJET: 'Chef de Projet',
  ROLE_HSE: 'HSE',
  ROLE_PRESTATAIRE: 'Prestataire',
  ROLE_DG: 'DG',
}

export default function MenuAccessesListPage() {
  const navigate = useNavigate()
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const { data: accesses, isLoading } = useMenuAccesses()
  const { data: menus } = useMenus()
  const { mutate: deleteAccess } = useDeleteMenuAccess()
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; label: string } | null>(null)

  if (!canAccessFeature('manage_menus')) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Chargement...</p>
      </div>
    )
  }

  const menuById = (iri: string) => menus?.find((m) => m['@id'] === iri)

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteAccess(deleteTarget.id, {
      onSuccess: () => {
        addToast({ message: 'Règle supprimée', type: 'success' })
        setDeleteTarget(null)
      },
      onError: () => addToast({ message: 'Erreur', type: 'error' }),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Accès par rôle</h2>
          <p className="mt-1 text-gray-600">Règles d'accès aux menus par rôle</p>
        </div>
        <Link to="/menu-accesses/new">
          <Button><Plus className="h-5 w-5 mr-2" />Nouvelle règle</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-gray-900">Règles ({accesses?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {accesses?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucune règle d'accès</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Menu</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rôle</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Voir</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Créer</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Modifier</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Supprimer</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Actions</th>
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
                            <button onClick={() => navigate(`/menu-accesses/${a.id}/edit`)} className="p-1.5 text-gray-600 hover:text-blue-600 rounded" title="Modifier">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteTarget({ id: a.id, label: `${m?.name ?? a.menu} - ${ROLE_LABELS[a.role] ?? a.role}` })} className="p-1.5 text-gray-600 hover:text-red-600 rounded" title="Supprimer">
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
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer">
        <div className="space-y-4">
          <p className="text-gray-600">Supprimer la règle <strong>{deleteTarget?.label}</strong> ?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
