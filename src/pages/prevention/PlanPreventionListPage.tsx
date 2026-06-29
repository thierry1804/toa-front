import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, AlertCircle, Eye } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import StatutBadge from '@/components/planPrevention/StatutBadge'
import ExaminerModal from '@/components/planPrevention/ExaminerModal'
import { usePlanPreventions, usePlanPrevention } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { usePermission } from '@/features/auth/usePermission'
import type { PlanPrevention } from '@/types/planPrevention'

const STATUTS_EXAMINABLES = ['SOUMIS', 'EN_COURS_DE_VALIDATION'] as const

function PlanRow({
  plan,
  canExamine,
  onExaminerClick,
}: {
  plan: PlanPrevention
  canExamine: boolean
  onExaminerClick: (plan: PlanPrevention) => void
}) {
  const navigate = useNavigate()
  const createdAt = plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('fr-FR') : '—'
  const docsCount = plan.documents?.length ?? 0
  const risquesCount = plan.risques?.length ?? 0
  const isExaminable = canExamine && (STATUTS_EXAMINABLES as readonly string[]).includes(plan.statut)

  return (
    <tr
      className="hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => navigate(`/prevention/${plan.id}`)}
    >
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-blue-700">{plan.reference}</span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-800">{plan.codeSite}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{plan.activitePlanifiee}</td>
      <td className="px-4 py-3 text-sm text-gray-500">{createdAt}</td>
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
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {isExaminable && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExaminerClick(plan)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Examiner
          </Button>
        )}
      </td>
    </tr>
  )
}

export default function PlanPreventionListPage() {
  const navigate = useNavigate()
  const perms = usePermissions('/prevention')
  const canCreate = perms?.canCreate ?? false
  const canExamine = usePermission('plan_prevention.examine')

  const { data: plans = [], isLoading, isError } = usePlanPreventions()
  const { examinerPlan, isExamining } = usePlanPrevention()

  const [selectedPlan, setSelectedPlan] = useState<PlanPrevention | null>(null)

  const headers = ['Référence', 'Code site', 'Activité', 'Date création', 'Avancement', 'Statut', '']

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
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">Aucun plan de prévention</p>
              <p className="mt-1 text-sm text-gray-400">
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
                    {headers.map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {plans.map((plan) => (
                    <PlanRow
                      key={plan.id}
                      plan={plan}
                      canExamine={canExamine}
                      onExaminerClick={setSelectedPlan}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPlan && (
        <ExaminerModal
          isOpen={true}
          planId={selectedPlan.id}
          planReference={selectedPlan.reference}
          isExamining={isExamining}
          onClose={() => setSelectedPlan(null)}
          onExaminer={examinerPlan}
        />
      )}
    </div>
  )
}
