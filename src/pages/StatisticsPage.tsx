import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'

export default function StatisticsPage() {
  const { t } = useTranslation()

  return (
    <div>
      <PageHeader
        title={t('statistics.title')}
        description="Tableaux de bord DG / HSE"
      />
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <p className="text-gray-500">Contenu à venir.</p>
      </div>
    </div>
  )
}
