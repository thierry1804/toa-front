import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Building2, ArrowLeft } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { usePrestataireEntrepriseScope } from '@/features/users/hooks/usePrestataireEntrepriseScope'
import {
  useEntreprise,
  useCreateEntreprise,
  useUpdateEntreprise,
} from '@/features/referentiel/hooks/useEntreprises'
import { usersApi } from '@/api/usersApi'
import { USERS_KEY } from '@/data/constant/query'
import { parseApiFieldErrors } from '@/lib/apiErrors'
import type { EntrepriseFormValues } from '@/components/entreprise/EntrepriseFormFields'
import EntrepriseFormFields, {
  emptyEntrepriseFormValues,
} from '@/components/entreprise/EntrepriseFormFields'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'

function toPayload(values: EntrepriseFormValues) {
  const nom = values.nom.trim()
  return {
    nom,
    numeroRegistreCommerce: values.numeroRegistreCommerce.trim() || null,
    siegeSocial: values.siegeSocial.trim() || null,
    qualiteRepresentant: values.qualiteRepresentant.trim() || null,
  }
}

function syncUserEntrepriseFields(
  userId: number,
  entreprise: {
    nom: string
    numeroRegistreCommerce?: string | null
    siegeSocial?: string | null
    qualiteRepresentant?: string | null
    '@id': string
  },
) {
  return usersApi.patch(userId, {
    entreprise: entreprise['@id'],
    entrepriseName: entreprise.nom,
    numeroRegistreCommerce: entreprise.numeroRegistreCommerce ?? null,
    siegeSocial: entreprise.siegeSocial ?? null,
    qualiteRepresentant: entreprise.qualiteRepresentant ?? null,
  })
}

export default function PrestataireEntreprisePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)
  const currentUserId = useAuthStore((s) => s.user?.id)

  const {
    isScoped,
    isProfileLoading,
    hasEntreprise,
    entrepriseId,
  } = usePrestataireEntrepriseScope()

  const { data: entreprise, isLoading: entrepriseLoading } =
    useEntreprise(entrepriseId)
  const { mutate: create, isPending: creating } = useCreateEntreprise()
  const { mutate: update, isPending: updating } = useUpdateEntreprise()

  const [form, setForm] = useState<EntrepriseFormValues>(emptyEntrepriseFormValues())
  const [nomError, setNomError] = useState('')

  const isEditMode = hasEntreprise
  const isSaving = creating || updating

  useEffect(() => {
    if (!isProfileLoading && !isScoped) {
      navigate('/users', { replace: true })
    }
  }, [isProfileLoading, isScoped, navigate])

  useEffect(() => {
    if (!entreprise) return
    setForm({
      nom: entreprise.nom,
      numeroRegistreCommerce: entreprise.numeroRegistreCommerce ?? '',
      siegeSocial: entreprise.siegeSocial ?? '',
      qualiteRepresentant: entreprise.qualiteRepresentant ?? '',
    })
  }, [entreprise])

  const handleChange = (field: keyof EntrepriseFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'nom') setNomError('')
  }

  const handleSaveError = (error: unknown, fallbackKey: string) => {
    const fieldErrors = parseApiFieldErrors(error, { nom: 'nom' })
    if (fieldErrors.nom) {
      setNomError(t(`errors.${fieldErrors.nom}`, fieldErrors.nom))
      return
    }
    addToast({ message: t(fallbackKey), type: 'error' })
  }

  const handleSave = () => {
    const trimmedNom = form.nom.trim()
    if (!trimmedNom) {
      setNomError(t('users.entreprise.nomRequired'))
      return
    }
    if (trimmedNom.length > 255) {
      setNomError(t('users.entreprise.nomMaxLength'))
      return
    }

    const payload = toPayload(form)
    const userId = Number(currentUserId)
    if (!userId) {
      addToast({ message: t('users.entreprise.userMissing'), type: 'error' })
      return
    }

    if (isEditMode && entrepriseId) {
      update(
        { id: entrepriseId, data: payload },
        {
          onSuccess: async (updated) => {
            try {
              await syncUserEntrepriseFields(userId, updated)
              void queryClient.invalidateQueries({ queryKey: USERS_KEY })
              addToast({
                message: t('users.entreprise.updated'),
                type: 'success',
              })
              navigate('/users')
            } catch {
              addToast({
                message: t('users.entreprise.syncError'),
                type: 'error',
              })
            }
          },
          onError: (error) => handleSaveError(error, 'users.entreprise.updateError'),
        },
      )
      return
    }

    create(payload, {
      onSuccess: async (created) => {
        try {
          await syncUserEntrepriseFields(userId, created)
          void queryClient.invalidateQueries({ queryKey: USERS_KEY })
          addToast({
            message: t('users.entreprise.created'),
            type: 'success',
          })
          navigate('/users')
        } catch {
          addToast({
            message: t('users.entreprise.syncError'),
            type: 'error',
          })
        }
      },
      onError: (error) => handleSaveError(error, 'users.entreprise.createError'),
    })
  }

  if (isProfileLoading || (hasEntreprise && entrepriseLoading)) {
    return <ListPageSkeleton />
  }

  if (!isScoped) return null

  return (
    <div className="space-y-4 sm:space-y-5">
      <PageHeader
        title={
          isEditMode
            ? t('users.entreprise.editTitle')
            : t('users.entreprise.createTitle')
        }
        description={
          isEditMode
            ? t('users.entreprise.editDesc')
            : t('users.entreprise.createDesc')
        }
        actions={
          <Link to="/users">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('users.entreprise.backToUsers')}
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Building2 className="h-5 w-5 text-blue-600" />
            {t('users.entreprise.sectionTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isEditMode && (
            <p className="text-sm text-gray-600">
              {t('users.entreprise.createHint')}
            </p>
          )}

          <EntrepriseFormFields
            values={form}
            onChange={handleChange}
            nomError={nomError}
            disabled={isSaving}
          />

          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">
            <Link to="/users" className="sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto" disabled={isSaving}>
                {t('common.cancel')}
              </Button>
            </Link>
            <Button
              className="w-full sm:w-auto"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving
                ? t('common.saving')
                : isEditMode
                  ? t('common.save')
                  : t('users.entreprise.createAction')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
