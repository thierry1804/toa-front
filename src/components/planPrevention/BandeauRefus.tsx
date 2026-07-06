import { AlertCircle } from 'lucide-react'
import type { DecisionHsePlanPrevention } from '@/types/planPrevention'

interface BandeauRefusProps {
  decision: DecisionHsePlanPrevention
}

export default function BandeauRefus({ decision }: BandeauRefusProps) {
  const refusedBy = `${decision.decidePar.firstname ?? ''} ${decision.decidePar.name}`.trim()
  const refusedAt = new Date(decision.decidedAt).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-red-800">
            Plan refusé le {refusedAt} par {refusedBy}
          </p>
          {decision.commentaire && (
            <p className="text-sm text-red-700">
              <span className="font-medium">Motif :</span> {decision.commentaire}
            </p>
          )}
          <p className="text-xs text-red-600 mt-1">
            Corrigez les informations demandées et resoumettez votre plan.
          </p>
        </div>
      </div>
    </div>
  )
}
