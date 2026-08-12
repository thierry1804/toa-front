import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import EvaluationRisqueTable from '@/components/intervention/EvaluationRisqueTable'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { useInterventionDetail, useIntervention } from '@/features/intervention/hooks/useIntervention'
import { usePermitTravailDetail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import type { EvaluationRisqueInput } from '@/types/intervention'

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? '—'}</dd>
    </div>
  )
}

export default function EvaluationRisquePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const canValider = usePermission('intervention.valider_evaluation')
  const canViewSuivis = usePermission('suivi_journalier.view')

  const {
    data: intervention,
    isLoading: loadingIntervention,
    isError: errorIntervention,
  } = useInterventionDetail(id ?? '')

  const {
    data: permit,
    isLoading: loadingPermit,
  } = usePermitTravailDetail(intervention?.permitTravailId ?? '')

  const { updateRisque, validerEvaluation, isUpdatingRisque, isValidating } = useIntervention()

  const [highlightNonReevalues, setHighlightNonReevalues] = useState(false)

  const isLoading = loadingIntervention || loadingPermit

  if (isLoading) {
    return <ListPageSkeleton withStatStrip={false} />
  }

  if (errorIntervention || !intervention) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
        <AlertTriangle className="h-12 w-12 text-gray-300" />
        <p>{t('intervention.pages.evaluationRisque.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/permits-travail')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('intervention.pages.evaluationRisque.backToPermits')}
        </Button>
      </div>
    )
  }

  const risques = intervention.evaluations ?? []
  const totalRisques = risques.length
  const reevaluesCount = risques.filter((r) => r.estReevalue).length
  const allReevalues = reevaluesCount === totalRisques && totalRisques > 0
  const progressPct = totalRisques > 0 ? Math.round((reevaluesCount / totalRisques) * 100) : 0
  const isComplete = intervention.statut === 'EVALUATION_COMPLETE'

  const handleUpdateRisque = async (risqueId: string, data: EvaluationRisqueInput) => {
    if (!id) return
    await updateRisque(id, risqueId, data)
  }

  const handleValider = async () => {
    if (!id) return
    try {
      await validerEvaluation(id)
      setHighlightNonReevalues(false)
    } catch {
      setHighlightNonReevalues(true)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intervention.pages.evaluationRisque.title')}
        description={t('intervention.pages.evaluationRisque.description')}
        actions={
          <Button
            variant="outline"
            onClick={() =>
              navigate(
                intervention.permitTravailId
                  ? `/permits-travail/${intervention.permitTravailId}`
                  : '/permits-travail',
              )
            }
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('intervention.pages.evaluationRisque.backToPermit')}
          </Button>
        }
      />

      {/* Section 1 — Résumé permis */}
      {permit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              {t('intervention.pages.evaluationRisque.permitSummary.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <InfoRow
                label={t('intervention.pages.evaluationRisque.permitSummary.reference')}
                value={
                  <Link
                    to={`/permits-travail/${permit.id}`}
                    className="font-mono font-semibold text-blue-700 hover:underline"
                  >
                    {permit.reference}
                  </Link>
                }
              />
              <InfoRow label={t('intervention.pages.evaluationRisque.permitSummary.type')} value={permit.typePermis} />
              <InfoRow label={t('intervention.pages.evaluationRisque.permitSummary.site')} value={permit.codeSite} />
              <InfoRow
                label={t('intervention.pages.evaluationRisque.permitSummary.period')}
                value={
                  <span>
                    {new Date(permit.dateDebutPrevue).toLocaleDateString('fr-FR')}
                    {' → '}
                    {new Date(permit.dateFinPrevue).toLocaleDateString('fr-FR')}
                  </span>
                }
              />
              {permit.planPreventionId && (
                <InfoRow
                  label={t('intervention.pages.evaluationRisque.permitSummary.planPrevention')}
                  value={
                    <Link
                      to={`/prevention/${permit.planPreventionId}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {t('intervention.pages.evaluationRisque.permitSummary.viewPlan')}
                    </Link>
                  }
                />
              )}
              <InfoRow
                label={t('intervention.pages.evaluationRisque.permitSummary.evaluationStatus')}
                value={
                  isComplete ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {t('intervention.pages.shared.statut.evaluationComplete')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {t('intervention.pages.shared.statut.enPreparation')}
                    </span>
                  )
                }
              />
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Section 2 — Matrice réévaluation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800">
            <ClipboardList className="inline mr-2 h-4 w-4 text-gray-400" />
            {t('intervention.pages.evaluationRisque.reevaluation.title')}
            {isUpdatingRisque && (
              <span className="ml-3 inline-flex items-center gap-1 text-xs font-normal text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('intervention.pages.evaluationRisque.reevaluation.saving')}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <EvaluationRisqueTable
            risques={risques}
            highlightNonReevalues={highlightNonReevalues}
            disabled={isComplete}
            onUpdate={handleUpdateRisque}
          />
        </CardContent>
      </Card>

      {/* Section 3 — Progression + Valider */}
      {!isComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {t('intervention.pages.evaluationRisque.progress.title')}
                </span>
                <span className="font-semibold text-gray-900">
                  {t('intervention.pages.evaluationRisque.progress.count', {
                    reevaluated: reevaluesCount,
                    total: totalRisques,
                  })}
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${allReevalues ? 'bg-green-600' : 'bg-blue-600'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              {highlightNonReevalues && !allReevalues && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {t('intervention.pages.evaluationRisque.progress.warning')}
                  </span>
                </div>
              )}

              {canValider && (
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Button
                      onClick={() => void handleValider()}
                      disabled={!allReevalues || isValidating}
                    >
                      {isValidating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="mr-2 h-4 w-4" />
                      )}
                      {t('intervention.pages.evaluationRisque.progress.validateButton')}
                    </Button>
                    {!allReevalues && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white shadow-lg">
                        {t('intervention.pages.evaluationRisque.progress.validateTooltip')}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </div>

                  {allReevalues && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('intervention.pages.evaluationRisque.progress.allDone')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {isComplete && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-green-700">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-semibold">{t('intervention.pages.evaluationRisque.complete.title')}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {t('intervention.pages.evaluationRisque.complete.description')}
                  </p>
                </div>
              </div>
              {canViewSuivis && (
                <Button onClick={() => navigate(`/interventions/${id}/suivis`)}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  {t('intervention.pages.evaluationRisque.complete.viewSuivis')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
