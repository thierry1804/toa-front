import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ShieldCheck, ShieldX, Lock, ClipboardCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { StatutPermitTravail } from '@/types/permitTravail'

type StatutConfig = {
  labelKey: string
  color: string
  icon: React.ElementType
}

const STATUT_CONFIG: Record<StatutPermitTravail, StatutConfig> = {
  BROUILLON:  { labelKey: 'permitTravail.components.statutBadge.brouillon',  color: 'bg-gray-100 text-gray-700',   icon: FileText    },
  SOUMIS:     { labelKey: 'permitTravail.components.statutBadge.soumis',     color: 'bg-blue-100 text-blue-700',   icon: Clock       },
  EN_COURS:   { labelKey: 'permitTravail.components.statutBadge.enCours',    color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  VALIDE:     { labelKey: 'permitTravail.components.statutBadge.valide',     color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJETE:     { labelKey: 'permitTravail.components.statutBadge.rejete',     color: 'bg-red-100 text-red-700',     icon: XCircle     },
  VALIDE_HSE: { labelKey: 'permitTravail.components.statutBadge.valideHse',  color: 'bg-green-100 text-green-700',  icon: ShieldCheck },
  REFUSE_HSE: { labelKey: 'permitTravail.components.statutBadge.refuseHse',  color: 'bg-red-100 text-red-700',      icon: ShieldX     },
  CLOTURE:    { labelKey: 'permitTravail.components.statutBadge.cloture',    color: 'bg-gray-100 text-gray-700',     icon: Lock           },
  PV_VALIDE:  { labelKey: 'permitTravail.components.statutBadge.pvValide',   color: 'bg-green-100 text-green-700',   icon: ClipboardCheck },
  PV_REFUSE:  { labelKey: 'permitTravail.components.statutBadge.pvRefuse',   color: 'bg-red-100 text-red-700',       icon: XCircle        },
}

interface StatutPermitBadgeProps {
  statut: StatutPermitTravail
  className?: string
}

export default function StatutPermitBadge({ statut, className = '' }: StatutPermitBadgeProps) {
  const { t } = useTranslation()
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.BROUILLON
  const Icon = cfg.icon
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {t(cfg.labelKey)}
    </span>
  )
}
