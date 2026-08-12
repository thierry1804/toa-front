import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TypePermit } from '@/types/permitTravail'

interface ExpirationBadgeProps {
  decidedAt: string
  typePermis: TypePermit
}

export default function ExpirationBadge({ decidedAt, typePermis }: ExpirationBadgeProps) {
  const { t } = useTranslation()
  const now = new Date()
  const dateExpiration = new Date(new Date(decidedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
  const daysLeft = Math.ceil((dateExpiration.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        {t('permitTravail.components.expirationBadge.expired')}
      </span>
    )
  }

  if (typePermis === 'GENERAL' && daysLeft <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700">
        <AlertTriangle className="h-3.5 w-3.5" />
        {t('permitTravail.components.expirationBadge.renewalSoon', { days: daysLeft })}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="h-3.5 w-3.5" />
      {dateExpiration.toLocaleDateString('fr-FR')}
    </span>
  )
}
