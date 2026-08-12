import { useTranslation } from 'react-i18next'

interface AvancementBadgeProps {
  pct: number
}

export default function AvancementBadge({ pct }: AvancementBadgeProps) {
  const { t } = useTranslation()

  if (pct === 100) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
        {pct}% — {t('intervention.components.avancementBadge.termine')}
      </span>
    )
  }
  if (pct >= 76) {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
        {pct}% — {t('intervention.components.avancementBadge.avance')}
      </span>
    )
  }
  if (pct >= 26) {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-800">
        {pct}% — {t('intervention.components.avancementBadge.enCours')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
      {pct}% — {t('intervention.components.avancementBadge.faible')}
    </span>
  )
}
