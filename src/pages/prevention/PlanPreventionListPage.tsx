import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { usePlanPreventions } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import type { PlanPrevention, StatutPlanPrevention } from '@/types/planPrevention'

const STATUT_CONFIG: Record<
  StatutPlanPrevention,
  { label: string; color: string; icon: React.ElementType }
> = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: FileText },
  SOUMIS: { label: 'Soumis', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  VALIDE: { label: 'Validé', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJETE: { label: 'Rejeté', color: 'bg-red-100 text-red-700', icon: XCircle },
}

function StatutBadge({ statut }: { statut: StatutPlanPrevention }) {
  const cfg = STATUT_CONFIG[statut] ?? STATUT_CONFIG.BROUILLON
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

function PlanRow({ plan }: { plan: PlanPrevention }) {
  const docsCount = plan.documents?.length ?? 0
  const risquesCount = plan.risques?.length ?? 0
  const createdAt = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('fr-FR') : '—'

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-blue-700">{plan.reference}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-800">{plan.codeSite}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{plan.localite}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{createdAt}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{docsCount}/5 docs</span>
          <span>·</span>
          <span>{risquesCount} risque{risquesCount > 1 ? 's' : ''}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatutBadge statut={plan.statut} />
      </td>
    </tr>
  )
}

export default function PlanPreventionListPage() {
  const navigate = useNavigate()
  const perms = usePermissions('/prevention')
  const canCreate = perms?.canCreate ?? false

  const { data: plans = [], isLoading, isError } = usePlanPreventions()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plans de prévention"
        description="Gestion des demandes de plans de prévention PPHSSES-TOA"
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/prevention/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau plan
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading && (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Chargement...
            </div>
          )}

          {isError && (
            <div className="flex items-center justify-center gap-2 py-12 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Impossible de charger les plans de prévention.</span>
            </div>
          )}

          {!isLoading && !isError && plans.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Aucun plan de prévention</p>
              <p className="text-gray-400 text-sm mt-1">
                {canCreate
                  ? 'Cliquez sur "Nouveau plan" pour en créer un.'
                  : "Vous n'avez pas encore de plan de prévention."}
              </p>
            </div>
          )}

          {!isLoading && !isError && plans.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Référence', 'Code site', 'Localité', 'Date création', 'Avancement', 'Statut'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {plans.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
