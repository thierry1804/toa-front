import { FileText, Clock, CheckCircle, XCircle, Send, AlertCircle, Eye } from 'lucide-react'
import type { StatutPlanPrevention } from '@/types/planPrevention'

type StatutConfig = {
  label: string
  color: string
  icon: React.ElementType
}

const STATUT_CONFIG: Record<StatutPlanPrevention, StatutConfig> = {
  BROUILLON:              { label: 'Brouillon',              color: 'bg-gray-100 text-gray-700',     icon: FileText     },
  SOUMIS:                 { label: 'Soumis',                 color: 'bg-yellow-100 text-yellow-700', icon: Clock        },
  VALIDE:                 { label: 'Validé',                 color: 'bg-green-100 text-green-700',   icon: CheckCircle  },
  REJETE:                 { label: 'Rejeté',                 color: 'bg-red-100 text-red-700',       icon: XCircle      },
  EN_ATTENTE:             { label: 'En attente',             color: 'bg-gray-100 text-gray-600',     icon: Clock        },
  ENVOYE:                 { label: 'Envoyé',                 color: 'bg-blue-100 text-blue-700',     icon: Send         },
  EN_COURS_DE_VALIDATION: { label: 'En cours de validation', color: 'bg-orange-100 text-orange-700', icon: AlertCircle  },
  EXAMINE:                { label: 'Examiné',                color: 'bg-teal-100 text-teal-700',     icon: Eye          },
}

interface StatutBadgeProps {
  statut: StatutPlanPrevention
  className?: string
}

export default function StatutBadge({ statut, className = '' }: StatutBadgeProps) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.BROUILLON
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}
