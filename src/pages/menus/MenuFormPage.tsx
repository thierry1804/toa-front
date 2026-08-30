import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { usePermission, useHasPermissions } from '@/features/auth/usePermission'
import { useMenus, useCreateMenu, useUpdateMenu } from '@/features/menus/hooks/useMenus'
import { useUiStore } from '@/store/ui.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { ArrowLeft, Save, Menu } from 'lucide-react'

export default function MenuFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canManageMenus = usePermission('manage_menus')
  const hasPermissions = useHasPermissions()
  const addToast = useUiStore((s) => s.addToast)
  const { data: allMenus } = useMenus()
  const { mutate: createMenu, isPending: isCreating } = useCreateMenu()
  const { mutate: updateMenu, isPending: isUpdating } = useUpdateMenu()

  const isEditMode = !!id
  const existing = isEditMode ? allMenus?.find((m) => String(m.id) === id) : null

  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [route, setRoute] = useState('')
  const [position, setPosition] = useState('0')
  const [parent, setParent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setIcon(existing.icon ?? '')
      setRoute(existing.route ?? '')
      setPosition(String(existing.position))
      setParent(existing.parent ?? '')
    }
  }, [existing])

  useEffect(() => {
    if (hasPermissions && !canManageMenus) {
      navigate('/menus')
      addToast({ message: t('users.toast.permissionDenied'), type: 'error' })
    }
  }, [navigate, addToast, canManageMenus, hasPermissions, t])

  const parentOptions = [
    { value: '', label: t('menus.form.noParent') },
    ...(allMenus ?? [])
      .filter((m) => !isEditMode || String(m.id) !== id)
      .map((m) => ({ value: `/api/menus/${m.id}`, label: m.name })),
  ]

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = t('menus.validation.nameRequired')
    if (!icon.trim()) e.icon = t('menus.validation.iconRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const payload = {
      name: name.trim(),
      icon: icon.trim() || undefined,
      route: route.trim() || null,
      position: parseInt(position, 10) || 0,
      parent: parent || null,
    }

    if (isEditMode && existing) {
      updateMenu(
        { id: existing.id, data: payload },
        {
          onSuccess: () => addToast({ message: t('menus.form.updated'), type: 'success' }),
          onError: () => addToast({ message: t('common.error'), type: 'error' }),
        },
      )
    } else {
      createMenu(payload, {
        onSuccess: () => addToast({ message: t('menus.form.created'), type: 'success' }),
        onError: () => addToast({ message: t('common.error'), type: 'error' }),
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/menus"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />{t('common.back')}</Button></Link>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditMode ? t('menus.form.editTitle') : t('menus.form.createTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Menu className="h-5 w-5 text-blue-600" />
              {t('menus.form.information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label={t('menus.form.label')} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} placeholder={t('menus.form.labelPlaceholder')} required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('menus.form.icon')} value={icon} onChange={(e) => setIcon(e.target.value)} error={errors.icon} placeholder={t('menus.form.iconPlaceholder')} required />
              <Input label={t('menus.form.route')} value={route} onChange={(e) => setRoute(e.target.value)} placeholder={t('menus.form.routePlaceholder')} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('menus.form.position')} type="number" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="0" />
              <Select label={t('menus.form.parent')} options={parentOptions} value={parent} onChange={(e) => setParent(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 pt-4 border-t">
          <Link to="/menus"><Button type="button" variant="outline">{t('common.cancel')}</Button></Link>
          <Button type="submit" isLoading={isCreating || isUpdating}>
            <Save className="h-4 w-4 mr-2" />
            {isEditMode ? t('common.save') : t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
