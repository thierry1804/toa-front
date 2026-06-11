import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/layout/PageHeader'
import { usePermits } from '@/features/permits/hooks/usePermits'

export default function PermitsListPage() {
  const { t } = useTranslation()
  const { data: permits, isLoading } = usePermits()

  return (
    <div>
      <PageHeader
        title={t('permits.title')}
        description="Liste des permis de travail"
        actions={
          <Link to="/permits/new">
            <Button>{t('permits.newPermit')}</Button>
          </Link>
        }
      />
      {isLoading && <p className="text-gray-500">{t('common.loading')}</p>}
      {permits && permits.length === 0 && (
        <p className="text-gray-500">Aucun permis pour le moment.</p>
      )}
      <div className="space-y-3">
        {permits?.map((permit) => (
          <Link
            key={permit.id}
            to={`/permits/${permit.id}`}
            className="block rounded-xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{permit.titre}</h3>
                <p className="mt-1 text-sm text-gray-500">{permit.numero}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {t(`permits.status.${permit.status}`)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
