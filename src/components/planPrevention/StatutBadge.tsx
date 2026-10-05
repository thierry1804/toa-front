import { FileText, Clock, CheckCircle, XCircle, Send, AlertCircle, Eye, ShieldCheck, ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { StatutPlanPrevention } from '@/types/planPrevention'

type StatutConfig = {
  color: string
  icon: React.ElementType
}

const STATUT_CONFIG: Record<StatutPlanPrevention, StatutConfig> = {
  BROUILLON:              { color: 'bg-gray-100 text-gray-700',     icon: FileText     },
  A_CORRIGER:             { color: 'bg-amber-100 text-amber-800',   icon: AlertCircle  },
  SOUMIS:                 { color: 'bg-blue-100 text-blue-700',     icon: Clock        },
  VALIDE:                 { color: 'bg-green-100 text-green-700',   icon: CheckCircle  },
  REJETE:                 { color: 'bg-red-100 text-red-700',       icon: XCircle      },
  EN_ATTENTE:             { color: 'bg-gray-100 text-gray-600',     icon: Clock        },
  ENVOYE:                 { color: 'bg-blue-100 text-blue-700',     icon: Send         },
  EN_COURS_DE_VALIDATION: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle  },
  EXAMINE:                { color: 'bg-green-100 text-green-700',   icon: Eye          },
  VALIDE_HSE:             { color: 'bg-blue-700 text-white',        icon: ShieldCheck  },
  REFUSE_HSE:             { color: 'bg-red-100 text-red-700',       icon: ShieldX      },
}

interface StatutBadgeProps {
  statut: StatutPlanPrevention
  className?: string
}

export default function StatutBadge({ statut, className = '' }: StatutBadgeProps) {
  const { t } = useTranslation()
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.BROUILLON
  const Icon = cfg.icon
  const label = t(`planPrevention.statut.${statut}`, { defaultValue: t('planPrevention.statut.BROUILLON') })
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
