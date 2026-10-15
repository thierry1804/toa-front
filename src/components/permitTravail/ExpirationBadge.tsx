import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle, Timer, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ExpirationBadgeProps {
  /** Échéance de validité du permis (validation + 7 ou 3 jours). */
  expiresAt?: string | null
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function formatCountdown(remainingMs: number): string {
  const days = Math.floor(remainingMs / DAY)
  const hours = Math.floor((remainingMs % DAY) / HOUR)
  const minutes = Math.floor((remainingMs % HOUR) / (60 * 1000))
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${Math.max(minutes, 1)} min`
}

/** Compte à rebours de la validité d'un permis (R-25), mis en évidence à l'approche de l'échéance. */
export default function ExpirationBadge({ expiresAt }: ExpirationBadgeProps) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(timer)
  }, [])

  if (!expiresAt) return <span className="text-gray-400 text-sm">—</span>

  const remaining = new Date(expiresAt).getTime() - now
  const dateLabel = new Date(expiresAt).toLocaleDateString('fr-FR')

  if (remaining <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700">
        <XCircle className="h-3.5 w-3.5" />
        {t('permitTravail.components.expirationBadge.expired')}
      </span>
    )
  }

  if (remaining <= DAY) {
    return (
      <span title={dateLabel} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-300">
        <AlertTriangle className="h-3.5 w-3.5" />
        {formatCountdown(remaining)}
      </span>
    )
  }

  if (remaining <= 2 * DAY) {
    return (
      <span title={dateLabel} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-orange-100 text-orange-700">
        <Timer className="h-3.5 w-3.5" />
        {formatCountdown(remaining)}
      </span>
    )
  }

  return (
    <span title={dateLabel} className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle className="h-3.5 w-3.5" />
      {formatCountdown(remaining)}
    </span>
  )
}
