import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, FileText, AlertCircle, Pencil, Wrench, FileCheck } from 'lucide-react'
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
import { sortNewestFirst } from '@/lib/listOrder'
import { useSearchParamState } from '@/hooks/useSearchParamState'
import {
  PLAN_STATUT_GROUPS,
  statutApiParam,
  statutMatchesFilter,
} from '@/features/dashboard/buildProfileKpis'
import {
  usePlanPreventionList,
  PLAN_PREVENTION_PAGE_SIZE,
  usePlanPreventionPdf,
} from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermissions } from '@/features/menus/hooks/usePermissions'
import { usePermission, useHasRole } from '@/features/auth/usePermission'
import { useAuthStore } from '@/store/auth.store'
import type { PlanPrevention } from '@/types/planPrevention'

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
  canResoumettre,
  isOwnPlan,
  isPrestataire,
  showWorkflowColumns,
}: {
  plan: PlanPrevention
  canResoumettre: boolean
  isOwnPlan: boolean
  isPrestataire: boolean
  showWorkflowColumns: boolean
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
        {plan.typeIntervention ?? <span className="text-gray-400 italic">—</span>}
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
  const [statusFilter, setStatusFilterParam] = useSearchParamState('statut')
  const [typeInterventionFilter, setTypeInterventionFilter] = useState('all')

  useEffect(() => {
    setPage(1)
  }, [statusFilter])

  const apiFilters = useMemo(() => {
    const filters: Record<string, string | string[]> = {}
    const statutParam = statutApiParam(statusFilter, PLAN_STATUT_GROUPS)
    if (statutParam) filters.statut = statutParam
    return filters
  }, [statusFilter])

  const { data: collection, isLoading, isError } = usePlanPreventionList(page, apiFilters)
  const plans = sortNewestFirst(collection?.member ?? [])
  const totalItems = collection?.totalItems ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PLAN_PREVENTION_PAGE_SIZE))

  const showWorkflowColumns = canExamine || canValiderHse || canRefuserHse

  const statusOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'todo', label: t('dashboard.kpis.plansToHandle') },
      { value: 'valides', label: t('dashboard.kpis.plansValides') },
      ...PLAN_STATUTS.map((statut) => ({
        value: statut,
        label: t(`planPrevention.statut.${statut}`),
      })),
    ],
    [t],
  )

  const typeInterventionOptions = useMemo(() => {
    const types = [...new Set(plans.map((p) => p.typeIntervention).filter(Boolean))] as string[]
    return [
      { value: 'all', label: t('common.all') },
      ...types.sort((a, b) => a.localeCompare(b)).map((type) => ({
        value: type,
        label: type,
      })),
    ]
  }, [plans, t])

  const filteredPlans = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return plans.filter((plan) => {
      if (!statutMatchesFilter(plan.statut, statusFilter, PLAN_STATUT_GROUPS)) return false
      if (typeInterventionFilter !== 'all' && plan.typeIntervention !== typeInterventionFilter) return false
      if (!query) return true
      const haystack = [
        plan.reference,
        plan.codeSite,
        plan.typeIntervention,
        plan.activitePlanifiee,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [plans, searchQuery, statusFilter, typeInterventionFilter])

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

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all' || typeInterventionFilter !== 'all'

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
                setStatusFilterParam(e.target.value)
                setPage(1)
              }}
              placeholder={t('planPrevention.list.filters.statut')}
            />
            <Select
              options={typeInterventionOptions}
              value={typeInterventionFilter}
              onChange={(e) => {
                setTypeInterventionFilter(e.target.value)
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
                        canResoumettre={canResoumettre}
                        isOwnPlan={!!currentUserId && String(plan.createdBy.id) === currentUserId}
                        isPrestataire={isPrestataire}
                        showWorkflowColumns={showWorkflowColumns}
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
    </div>
  )
}
