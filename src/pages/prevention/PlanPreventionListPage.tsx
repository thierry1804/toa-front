import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, AlertCircle, Eye, ShieldCheck, ShieldX, Pencil, Wrench, FileCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { TableIconButton } from '@/components/ui/TableIconButton'
import {
  ListTable,
  ListTableBody,
  ListTableCell,
  ListTableFilters,
  ListTableHead,
  ListTableHeadCell,
  ListTableActions,
  ListTableRow,
} from '@/components/ui/ListTable'
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

const PLAN_STATUTS = [
  'BROUILLON',
  'SOUMIS',
  'EN_COURS_DE_VALIDATION',
  'EXAMINE',
  'VALIDE_HSE',
  'REFUSE_HSE',
] as const

function PlanPdfCell({ planId }: { planId: string }) {
  const canDownload = usePermission('plan_prevention.download_pdf')
  const { pdfStatut, downloadPdf } = usePlanPreventionPdf(planId)

  if (pdfStatut === 'GENERE') {
    return (
      <TableIconButton
        title="Télécharger le PDF"
        variant="success"
        disabled={!canDownload}
        onClick={(e) => { e.stopPropagation(); void downloadPdf() }}
      >
        <FileCheck className="h-4 w-4" />
      </TableIconButton>
    )
  }

  if (pdfStatut === 'EN_COURS') {
    return (
      <span title="Génération en cours…" className="inline-flex p-1.5 text-orange-400">
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </span>
    )
  }

  return (
    <span title="Pas de PDF généré" className="inline-flex p-1.5 text-gray-300">
      <FileText className="h-4 w-4" />
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
  showWorkflowColumns,
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
  showWorkflowColumns: boolean
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
    <ListTableRow
      className="cursor-pointer"
      onClick={() => navigate(`/prevention/${plan.id}`)}
    >
      <ListTableCell className="break-all">
        <span className="font-mono text-sm font-medium text-blue-700">{plan.reference}</span>
      </ListTableCell>
      <ListTableCell compact className="text-gray-800">{plan.codeSite}</ListTableCell>
      <ListTableCell className="text-gray-600">
        {plan.process ?? <span className="text-gray-400 italic">—</span>}
      </ListTableCell>
      <ListTableCell className="text-gray-600">{plan.activitePlanifiee}</ListTableCell>
      <ListTableCell compact>
        <StatutBadge statut={plan.statut} />
      </ListTableCell>
      {showWorkflowColumns && (
        <>
          <ListTableCell className="text-sm">
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
          </ListTableCell>
          <ListTableCell compact className="text-sm text-gray-500">
            {latestExamen
              ? new Date(latestExamen.examineAt).toLocaleDateString('fr-FR')
              : <span className="text-gray-400">—</span>}
          </ListTableCell>
        </>
      )}
      <ListTableCell actions onClick={(e) => e.stopPropagation()}>
        <ListTableActions>
          {plan.statut === 'VALIDE_HSE' && <PlanPdfCell planId={plan.id} />}
          {isEditable && (
            <TableIconButton
              title={t('planPrevention.list.actions.modifier')}
              onClick={() => navigate(`/prevention/${plan.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </TableIconButton>
          )}
          {isCorrectible && (
            <TableIconButton
              title={t('planPrevention.list.actions.corriger')}
              variant="warning"
              onClick={() => navigate(`/prevention/${plan.id}/edit`)}
            >
              <Wrench className="h-4 w-4" />
            </TableIconButton>
          )}
          {isExaminable && (
            <TableIconButton
              title={t('planPrevention.list.actions.examiner')}
              onClick={() => onExaminerClick(plan)}
            >
              <Eye className="h-4 w-4" />
            </TableIconButton>
          )}
          {isDecidable && canValiderHse && (
            <TableIconButton
              title={t('planPrevention.list.actions.valider')}
              variant="success"
              onClick={() => onValiderClick(plan)}
            >
              <ShieldCheck className="h-4 w-4" />
            </TableIconButton>
          )}
          {isDecidable && canRefuserHse && (
            <TableIconButton
              title={t('planPrevention.list.actions.refuser')}
              variant="danger"
              onClick={() => onRefuserClick(plan)}
            >
              <ShieldX className="h-4 w-4" />
            </TableIconButton>
          )}
        </ListTableActions>
      </ListTableCell>
    </ListTableRow>
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
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [processFilter, setProcessFilter] = useState('all')

  const apiFilters = useMemo(() => {
    const filters: Record<string, string> = {}
    if (statusFilter !== 'all') filters.statut = statusFilter
    return filters
  }, [statusFilter])

  const { data: collection, isLoading, isError } = usePlanPreventionList(page, apiFilters)
  const plans = collection?.member ?? []
  const totalItems = collection?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PLAN_PREVENTION_PAGE_SIZE))

  const { examinerPlan, isExamining, validerPlan, isValidating, refuserPlan, isRefusing } =
    usePlanPrevention()

  const [selectedExaminer, setSelectedExaminer] = useState<PlanPrevention | null>(null)
  const [selectedValider, setSelectedValider] = useState<PlanPrevention | null>(null)
  const [selectedRefuser, setSelectedRefuser] = useState<PlanPrevention | null>(null)

  const showWorkflowColumns = canExamine || canValiderHse || canRefuserHse

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      ...PLAN_STATUTS.map((statut) => ({
        value: statut,
        label: t(`planPrevention.statut.${statut}`),
      })),
    ],
    [t],
  )

  const processOptions = useMemo(() => {
    const processes = [...new Set(plans.map((p) => p.process).filter(Boolean))] as string[]
    return [
      { value: 'all', label: t('common.all') },
      ...processes.sort((a, b) => a.localeCompare(b)).map((process) => ({
        value: process,
        label: process,
      })),
    ]
  }, [plans, t])

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return plans.filter((plan) => {
      if (statusFilter !== 'all' && plan.statut !== statusFilter) return false
      if (processFilter !== 'all' && plan.process !== processFilter) return false
      if (!query) return true
      const haystack = [
        plan.reference,
        plan.codeSite,
        plan.process,
        plan.activitePlanifiee,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [plans, searchQuery, statusFilter, processFilter])

  const headers = [
    t('planPrevention.list.headers.reference'),
    t('planPrevention.list.headers.codeSite'),
    t('planPrevention.list.headers.processus'),
    t('planPrevention.list.headers.activite'),
    t('planPrevention.list.headers.statut'),
    ...(showWorkflowColumns
      ? [
          t('planPrevention.list.headers.chefProjet'),
          t('planPrevention.list.headers.dateExamen'),
        ]
      : []),
    t('planPrevention.list.headers.actions'),
  ]

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || processFilter !== 'all'

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
        <Card className="overflow-hidden">
          <ListTableFilters>
            <Input
              placeholder={t('planPrevention.list.filters.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              placeholder={t('planPrevention.list.filters.statut')}
            />
            <Select
              options={processOptions}
              value={processFilter}
              onChange={(e) => {
                setProcessFilter(e.target.value)
                setPage(1)
              }}
              placeholder={t('planPrevention.list.filters.processus')}
            />
          </ListTableFilters>

          <CardContent className="p-0">
            {isError && (
              <div className="flex items-center justify-center gap-2 py-12 text-red-500">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{t('planPrevention.list.loadingError')}</span>
              </div>
            )}

            {!isError && totalItems === 0 && !hasActiveFilters && (
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

            {!isError && (totalItems > 0 || hasActiveFilters) && filteredPlans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="mb-4 h-12 w-12 text-gray-300" />
                <p className="font-medium text-gray-500">{t('planPrevention.list.filters.noResults')}</p>
              </div>
            )}

            {!isError && filteredPlans.length > 0 && (
              <>
                <ListTable>
                  <ListTableHead>
                    <tr>
                      {headers.map((h, i) => (
                        <ListTableHeadCell
                          key={h}
                          actions={i === headers.length - 1}
                          compact={
                            i === headers.length - 1
                              ? false
                              : h === t('planPrevention.list.headers.codeSite') ||
                                h === t('planPrevention.list.headers.statut') ||
                                h === t('planPrevention.list.headers.dateExamen')
                          }
                        >
                          {h}
                        </ListTableHeadCell>
                      ))}
                    </tr>
                  </ListTableHead>
                  <ListTableBody>
                    {filteredPlans.map((plan) => (
                      <PlanRow
                        key={plan.id}
                        plan={plan}
                        canExamine={canExamine}
                        canValiderHse={canValiderHse}
                        canRefuserHse={canRefuserHse}
                        canResoumettre={canResoumettre}
                        isOwnPlan={!!currentUserId && String(plan.createdBy.id) === currentUserId}
                        isPrestataire={isPrestataire}
                        showWorkflowColumns={showWorkflowColumns}
                        onExaminerClick={setSelectedExaminer}
                        onValiderClick={setSelectedValider}
                        onRefuserClick={setSelectedRefuser}
                      />
                    ))}
                  </ListTableBody>
                </ListTable>
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
                        {t('common.previous')}
                      </button>
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t('common.next')}
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
