import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PageHeader } from '@/components/layout/PageHeader'
import { permitSchema, type PermitFormData } from '@/utils/validation'
import { useCreatePermit } from '@/features/permits/hooks/usePermits'

export default function PermitNewPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { mutate: create, isPending } = useCreatePermit()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PermitFormData>({
    resolver: zodResolver(permitSchema),
  })

  const onSubmit = (data: PermitFormData) => {
    create(data, {
      onSuccess: () => navigate('/permits'),
    })
  }

  return (
    <div>
      <PageHeader
        title={t('permits.newPermit')}
        actions={
          <Button variant="secondary" onClick={() => navigate('/permits')}>
            {t('common.cancel')}
          </Button>
        }
      />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-lg space-y-4 rounded-xl bg-white p-6 shadow-sm"
      >
        <Input
          label="Titre"
          error={errors.titre?.message}
          {...register('titre')}
        />
        <div className="w-full">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className={`block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300'
            }`}
            rows={4}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>
        <Button type="submit" isLoading={isPending}>
          {t('permits.newPermit')}
        </Button>
      </form>
    </div>
  )
}
