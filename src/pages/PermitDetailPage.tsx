import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePermit } from '@/features/permits/hooks/usePermits'
import { formatDateTime } from '@/utils/date'

export default function PermitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: permit, isLoading } = usePermit(id!)

  if (isLoading) return <p className="text-gray-500">{t('common.loading')}</p>
  if (!permit) return <p className="text-gray-500">{t('common.error')}</p>

  return (
    <div>
      <PageHeader
        title={permit.titre}
        description={permit.numero}
        actions={
          <Button variant="secondary" onClick={() => navigate('/permits')}>
            {t('common.back')}
          </Button>
        }
      />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Statut</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {t(`permits.status.${permit.status}`)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Créé le</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDateTime(permit.created_at)}
            </dd>
          </div>
          {permit.expired_at && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Expire le</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatDateTime(permit.expired_at)}
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-6">
          <dt className="text-sm font-medium text-gray-500">Description</dt>
          <dd className="mt-1 text-sm text-gray-900">{permit.description}</dd>
        </div>
      </div>
    </div>
  )
}
