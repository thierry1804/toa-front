import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
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
import { roleOptions } from '@/data/constant/roles'

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

  const { t } = useTranslation()
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
      addToast({ message: t('users.toast.permissionDenied'), type: 'error' })
    }
  }, [navigate, addToast, canAccessFeature])

  const menuOptions = (allMenus ?? []).map((m) => ({
    value: m['@id'],
    label: `${'— '.repeat(m.parent ? 1 : 0)}${m.name}`,
  }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!menu) {
      addToast({ message: t('menus.accesses.form.selectMenu'), type: 'error' })
      return
    }

    const payload = { menu, role, canView, canCreate, canEdit, canDelete }

    if (isEditMode && existing) {
      updateAccess(
        { id: existing.id, data: payload },
        {
          onSuccess: () => addToast({ message: t('menus.accesses.form.updated'), type: 'success' }),
          onError: () => addToast({ message: t('common.error'), type: 'error' }),
        },
      )
    } else {
      const duplicate = allAccesses?.find((a) => a.menu === menu && a.role === role)
      if (duplicate) {
        addToast({ message: t('menus.accesses.form.duplicate'), type: 'warning' })
        navigate(`/menu-accesses/${duplicate.id}/edit`)
        return
      }

      createAccess(payload, {
        onSuccess: () => addToast({ message: t('menus.accesses.form.created'), type: 'success' }),
        onError: () => addToast({ message: t('common.error'), type: 'error' }),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/menu-accesses"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}</Button></Link>
        <h2 className="text-3xl font-bold text-gray-900">
          {isEditMode ? t('menus.accesses.form.editTitle') : t('menus.accesses.form.createTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Shield className="h-5 w-5 text-blue-600" />
              {t('menus.accesses.form.permissions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select label={t('menus.accesses.form.menu')} options={menuOptions} value={menu} onChange={(e) => setMenu(e.target.value)} placeholder={t('menus.accesses.form.menuPlaceholder')} required />
            <Select label={t('menus.accesses.form.role')} options={roleOptions} value={role} onChange={(e) => setRole(e.target.value)} required />

            <div className="space-y-3 pt-2">
              <Checkbox label={t('menus.accesses.form.voir')} description={t('menus.accesses.form.voirDesc')} checked={canView} onChange={(e) => setCanView(e.target.checked)} />
              <Checkbox label={t('menus.accesses.form.creer')} checked={canCreate} onChange={(e) => setCanCreate(e.target.checked)} />
              <Checkbox label={t('menus.accesses.form.modifier')} checked={canEdit} onChange={(e) => setCanEdit(e.target.checked)} />
              <Checkbox label={t('menus.accesses.form.supprimer')} checked={canDelete} onChange={(e) => setCanDelete(e.target.checked)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/menu-accesses"><Button type="button" variant="outline">{t('common.cancel')}</Button></Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
