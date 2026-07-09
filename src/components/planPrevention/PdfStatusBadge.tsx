import { CheckCircle } from 'lucide-react'
import type { StatutPlanPreventionPdf } from '@/types/planPrevention'

interface PdfStatusBadgeProps {
  statut: StatutPlanPreventionPdf | null
}

export default function PdfStatusBadge({ statut }: PdfStatusBadgeProps) {
  if (!statut) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
        Pas de PDF
      </span>
    )
  }

  if (statut === 'EN_COURS') {
    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
        <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Génération...
      </span>
    )
  }

  if (statut === 'GENERE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" />
        PDF disponible
      </span>
    )
  }

  return null
}
