import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'

export default function PreventionPage() {
  const { t } = useTranslation()

  return (
    <div>
      <PageHeader
        title={t('prevention.title')}
        description="Plans de prévention PPHSSES"
      />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-gray-500">Contenu à venir.</p>
      </div>
    </div>
  )
}
