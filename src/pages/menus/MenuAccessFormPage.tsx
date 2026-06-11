import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useMenuAccesses, useCreateMenuAccess, useUpdateMenuAccess } from '@/features/menus/hooks/useMenuAccesses'
import { useMenus } from '@/features/menus/hooks/useMenus'
import { useUiStore } from '@/store/ui.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import { ArrowLeft, Save, Shield } from 'lucide-react'

const roleOptions = [
  { value: 'ROLE_SUPER_ADMIN', label: 'Super Admin' },
  { value: 'ROLE_ADMIN', label: 'Admin' },
  { value: 'ROLE_CHEF_PROJET', label: 'Chef de Projet' },
  { value: 'ROLE_HSE', label: 'HSE' },
  { value: 'ROLE_PRESTATAIRE', label: 'Prestataire' },
  { value: 'ROLE_DG', label: 'DG' },
]

export default function MenuAccessFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { canAccessFeature } = useAuthStore()
  const addToast = useUiStore((s) => s.addToast)
  const { data: allAccesses } = useMenuAccesses()
  const { data: allMenus } = useMenus()
  const { mutate: createAccess, isPending: isCreating } = useCreateMenuAccess()
  const { mutate: updateAccess, isPending: isUpdating } = useUpdateMenuAccess()

  const isEditMode = !!id
  const existing = isEditMode ? allAccesses?.find((a) => String(a.id) === id) : null

  const [menu, setMenu] = useState('')
  const [role, setRole] = useState('ROLE_PRESTATAIRE')
  const [canView, setCanView] = useState(true)
  const [canCreate, setCanCreate] = useState(false)
  const [canEdit, setCanEdit] = useState(false)
  const [canDelete, setCanDelete] = useState(false)

  useEffect(() => {
    if (existing) {
      setMenu(existing.menu)
      setRole(existing.role)
      setCanView(existing.canView)
      setCanCreate(existing.canCreate)
      setCanEdit(existing.canEdit)
      setCanDelete(existing.canDelete)
    }
  }, [existing])

  useEffect(() => {
    if (!canAccessFeature('manage_menus')) {
      navigate('/menu-accesses')
      addToast({ message: 'Permission refusée', type: 'error' })
    }
  }, [navigate, addToast, canAccessFeature])

  const menuOptions = (allMenus ?? []).map((m) => ({
    value: m['@id'],
    label: `${'— '.repeat(m.parent ? 1 : 0)}${m.name}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!menu) {
      addToast({ message: 'Veuillez sélectionner un menu', type: 'error' })
      return
    }

    const payload = { menu, role, canView, canCreate, canEdit, canDelete }

    if (isEditMode && existing) {
      updateAccess(
        { id: existing.id, data: payload },
        {
          onSuccess: () => addToast({ message: 'Règle modifiée', type: 'success' }),
          onError: () => addToast({ message: 'Erreur', type: 'error' }),
        },
      )
    } else {
      const duplicate = allAccesses?.find((a) => a.menu === menu && a.role === role)
      if (duplicate) {
        addToast({ message: 'Cette règle existe déjà, redirection vers l\'édition', type: 'warning' })
        navigate(`/menu-accesses/${duplicate.id}/edit`)
        return
      }

      createAccess(payload, {
        onSuccess: () => addToast({ message: 'Règle créée', type: 'success' }),
        onError: () => addToast({ message: 'Erreur', type: 'error' }),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/menu-accesses"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Retour</Button></Link>
        <h2 className="text-3xl font-bold text-gray-900">
          {isEditMode ? 'Modifier la règle' : 'Nouvelle règle'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select label="Menu *" options={menuOptions} value={menu} onChange={(e) => setMenu(e.target.value)} placeholder="Sélectionner un menu" required />
            <Select label="Rôle *" options={roleOptions} value={role} onChange={(e) => setRole(e.target.value)} required />

            <div className="space-y-3 pt-2">
              <Checkbox label="Voir" description="Afficher le menu dans la sidebar" checked={canView} onChange={(e) => setCanView(e.target.checked)} />
              <Checkbox label="Créer" checked={canCreate} onChange={(e) => setCanCreate(e.target.checked)} />
              <Checkbox label="Modifier" checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />
              <Checkbox label="Supprimer" checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/menu-accesses"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? 'Enregistrer' : 'Créer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
