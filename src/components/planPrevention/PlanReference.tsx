import { useTranslation } from 'react-i18next'

interface PlanReferenceProps {
  reference: string | null | undefined
  className?: string
}

export default function PlanReference({ reference, className = '' }: PlanReferenceProps) {
  const { t } = useTranslation()

  if (!reference) return null

  return (
    <div className={`inline-flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5 ${className}`}>
      <span className="text-xs font-medium text-blue-700">
        {t('planPrevention.components.planReference.label')}
      </span>
      <span className="font-mono text-sm font-semibold text-blue-900">{reference}</span>
    </div>
  )
}
