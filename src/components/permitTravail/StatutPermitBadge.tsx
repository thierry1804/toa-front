import { FileText, Clock, CheckCircle, XCircle, AlertCircle, ShieldCheck, ShieldX, Lock, ClipboardCheck } from 'lucide-react'
import type { StatutPermitTravail } from '@/types/permitTravail'

type StatutConfig = {
  label: string
  color: string
  icon: React.ElementType
}

const STATUT_CONFIG: Record<StatutPermitTravail, StatutConfig> = {
  BROUILLON:  { label: 'Brouillon',   color: 'bg-gray-100 text-gray-700',   icon: FileText    },
  SOUMIS:     { label: 'Soumis',      color: 'bg-blue-100 text-blue-700',   icon: Clock       },
  EN_COURS:   { label: 'En cours',    color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
  VALIDE:     { label: 'Validé',      color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJETE:     { label: 'Rejeté',      color: 'bg-red-100 text-red-700',     icon: XCircle     },
  VALIDE_HSE: { label: 'Validé HSE',  color: 'bg-green-100 text-green-700',  icon: ShieldCheck },
  REFUSE_HSE: { label: 'Refusé HSE',  color: 'bg-red-100 text-red-700',      icon: ShieldX     },
  CLOTURE:    { label: 'Clôturé',     color: 'bg-gray-800 text-gray-100',     icon: Lock           },
  PV_VALIDE:  { label: 'PV Validé',   color: 'bg-green-700 text-white',        icon: ClipboardCheck },
  PV_REFUSE:  { label: 'PV Refusé',   color: 'bg-red-700 text-white',          icon: XCircle        },
}

interface StatutPermitBadgeProps {
  statut: StatutPermitTravail
  className?: string
}

export default function StatutPermitBadge({ statut, className = '' }: StatutPermitBadgeProps) {
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
