import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, AlertCircle, Eye, ShieldCheck, ShieldX, Pencil, Wrench, FileCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import StatutBadge from '@/components/planPrevention/StatutBadge'
import ExaminerModal from '@/components/planPrevention/ExaminerModal'
import ValiderModal from '@/components/planPrevention/ValiderModal'
import RefuserModal from '@/components/planPrevention/RefuserModal'
import {
  usePlanPreventionList,
  PLAN_PREVENTION_PAGE_SIZE,
  usePlanPrevention,
  usePlanPreventionPdf,
} from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { usePermission, useHasRole } from '@/features/auth/usePermission'
import { useAuthStore } from '@/store/auth.store'
import type { PlanPrevention } from '@/types/planPrevention'

const STATUTS_EXAMINABLES = ['SOUMIS', 'EN_COURS_DE_VALIDATION'] as const

function PlanPdfCell({ planId }: { planId: string }) {
  const canDownload = usePermission('plan_prevention.download_pdf')
  const { pdfStatut, downloadPdf } = usePlanPreventionPdf(planId)

  if (pdfStatut === 'GENERE') {
    return (
      <button
        type="button"
        disabled={!canDownload}
        onClick={(e) => { e.stopPropagation(); void downloadPdf() }}
        title="Télécharger le PDF"
        className="text-green-600 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <FileCheck className="h-5 w-5" />
      </button>
    )
  }

  if (pdfStatut === 'EN_COURS') {
    return (
      <span title="Génération en cours..." className="text-orange-400">
        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    )
  }

  return (
    <span title="Pas de PDF généré" className="text-gray-300">
      <FileText className="h-5 w-5" />
    </span>
  )
}

function PlanRow({
  plan,
  canExamine,
  canValiderHse,
  canRefuserHse,
  canResoumettre,
  isOwnPlan,
  isPrestataire,
  onExaminerClick,
  onValiderClick,
  onRefuserClick,
}: {
  plan: PlanPrevention
  canExamine: boolean
  canValiderHse: boolean
  canRefuserHse: boolean
  canResoumettre: boolean
  isOwnPlan: boolean
  isPrestataire: boolean
  onExaminerClick: (plan: PlanPrevention) => void
  onValiderClick: (plan: PlanPrevention) => void
  onRefuserClick: (plan: PlanPrevention) => void
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const isExaminable = canExamine && (STATUTS_EXAMINABLES as readonly string[]).includes(plan.statut)
  const isDecidable = plan.statut === 'EXAMINE'
  const hasRefusDecision = plan.decisionsHse?.some((d) => d.decision === 'REFUSE') ?? false
  const isCorrectible =
    isOwnPlan && isPrestataire && plan.statut === 'BROUILLON' && hasRefusDecision && canResoumettre
  const isEditable =
    isOwnPlan && isPrestataire && plan.statut === 'BROUILLON' && !hasRefusDecision
  const latestExamen = plan.examens?.at(-1)

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
      <td className="px-4 py-3">
        <StatutBadge statut={plan.statut} />
      </td>
      <td className="px-4 py-3 text-sm">
        {plan.chefProjet ? (
          <div>
            <p className="font-medium text-gray-800">
              {`${plan.chefProjet.firstname ?? ''} ${plan.chefProjet.name}`.trim()}
            </p>
            <p className="text-xs text-gray-500">{plan.chefProjet.email}</p>
          </div>
        ) : (
          <span className="text-gray-400 italic">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {latestExamen
          ? new Date(latestExamen.examineAt).toLocaleDateString('fr-FR')
          : <span className="text-gray-400">—</span>}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        {plan.statut === 'VALIDE_HSE' ? <PlanPdfCell planId={plan.id} /> : <span className="text-gray-200">—</span>}
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={() => navigate(`/prevention/${plan.id}`)}>
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            {t('planPrevention.list.actions.voir')}
          </Button>
          {isEditable && (
            <Button size="sm" variant="outline" onClick={() => navigate(`/prevention/${plan.id}/edit`)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {t('planPrevention.list.actions.modifier')}
            </Button>
          )}
          {isCorrectible && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/prevention/${plan.id}/edit`)}
              className="border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              <Wrench className="mr-1.5 h-3.5 w-3.5" />
              Corriger
            </Button>
          )}
          {isExaminable && (
            <Button size="sm" variant="outline" onClick={() => onExaminerClick(plan)}>
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {t('planPrevention.list.actions.examiner')}
            </Button>
          )}
          {isDecidable && canValiderHse && (
            <Button size="sm" onClick={() => onValiderClick(plan)}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              {t('planPrevention.list.actions.valider')}
            </Button>
          )}
          {isDecidable && canRefuserHse && (
            <Button size="sm" variant="danger" onClick={() => onRefuserClick(plan)}>
              <ShieldX className="mr-1.5 h-3.5 w-3.5" />
              {t('planPrevention.list.actions.refuser')}
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

export default function PlanPreventionListPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const perms = usePermissions('/prevention')
  const canCreate = perms?.canCreate ?? false
  const canExamine = usePermission('plan_prevention.examine')
  const canValiderHse = usePermission('plan_prevention.valider_hse')
  const canRefuserHse = usePermission('plan_prevention.refuser_hse')
  const canResoumettre = usePermission('plan_prevention.resoumettre')
  const isPrestataire = useHasRole('ROLE_PRESTATAIRE')
  const currentUserId = useAuthStore((s) => s.user?.id)

  const [page, setPage] = useState(1)
  const { data: collection, isLoading, isError } = usePlanPreventionList(page)
  const plans      = collection?.member ?? []
  const totalItems = collection?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PLAN_PREVENTION_PAGE_SIZE))

  const { examinerPlan, isExamining, validerPlan, isValidating, refuserPlan, isRefusing } =
    usePlanPrevention()

  const [selectedExaminer, setSelectedExaminer] = useState<PlanPrevention | null>(null)
  const [selectedValider, setSelectedValider] = useState<PlanPrevention | null>(null)
  const [selectedRefuser, setSelectedRefuser] = useState<PlanPrevention | null>(null)

  const headers = [
    t('planPrevention.list.headers.reference'),
    t('planPrevention.list.headers.codeSite'),
    t('planPrevention.list.headers.activite'),
    t('planPrevention.list.headers.statut'),
    t('planPrevention.list.headers.chefProjet'),
    t('planPrevention.list.headers.dateExamen'),
    'PDF',
    t('planPrevention.list.headers.actions'),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('planPrevention.list.title')}
        description={t('planPrevention.list.description')}
        actions={
          canCreate ? (
            <Button onClick={() => navigate('/prevention/new')}>
              <Plus className="mr-2 h-4 w-4" />
              {t('planPrevention.list.newPlan')}
            </Button>
          ) : undefined
        }
      />

      {isLoading && <ListPageSkeleton withStatStrip={false} />}

      {!isLoading && (
      <Card>
        <CardContent className="p-0">
          {isError && (
            <div className="flex items-center justify-center gap-2 py-12 text-red-500">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">{t('planPrevention.list.loadingError')}</span>
            </div>
          )}

          {!isLoading && !isError && totalItems === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-4 h-12 w-12 text-gray-300" />
              <p className="font-medium text-gray-500">{t('planPrevention.list.empty')}</p>
              <p className="mt-1 text-sm text-gray-400">
                {canCreate
                  ? t('planPrevention.list.emptyCreate')
                  : t('planPrevention.list.emptyNoCreate')}
              </p>
            </div>
          )}

          {!isLoading && !isError && plans.length > 0 && (
            <>
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
                        canValiderHse={canValiderHse}
                        canRefuserHse={canRefuserHse}
                        canResoumettre={canResoumettre}
                        isOwnPlan={!!currentUserId && String(plan.createdBy.id) === currentUserId}
                        isPrestataire={isPrestataire}
                        onExaminerClick={setSelectedExaminer}
                        onValiderClick={setSelectedValider}
                        onRefuserClick={setSelectedRefuser}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    Page {page} / {totalPages} ({totalItems} plan{totalItems !== 1 ? 's' : ''})
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Précédent
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
      )}

      {selectedExaminer && (
        <ExaminerModal
          isOpen
          planId={selectedExaminer.id}
          planReference={selectedExaminer.reference}
          isExamining={isExamining}
          onClose={() => setSelectedExaminer(null)}
          onExaminer={examinerPlan}
        />
      )}

      {selectedValider && (
        <ValiderModal
          isOpen
          planId={selectedValider.id}
          planReference={selectedValider.reference}
          isValidating={isValidating}
          onClose={() => setSelectedValider(null)}
          onValider={validerPlan}
        />
      )}

      {selectedRefuser && (
        <RefuserModal
          isOpen
          planId={selectedRefuser.id}
          planReference={selectedRefuser.reference}
          isRefusing={isRefusing}
          onClose={() => setSelectedRefuser(null)}
          onRefuser={refuserPlan}
        />
      )}
    </div>
  )
}
