import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  const canValider = usePermission('intervention.valider_evaluation')

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
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement de l'évaluation…
      </div>
    )
  }

  if (errorIntervention || !intervention) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
        <AlertTriangle className="h-12 w-12 text-gray-300" />
        <p>Évaluation introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/permits-travail')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux permis
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
        title={
          <span className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-gray-400" />
            Évaluation des risques
          </span>
        }
        description="Réévaluez chaque risque identifié avant de démarrer l'intervention"
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
            Retour au permis
          </Button>
        }
      />

      {/* Section 1 — Résumé permis */}
      {permit && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800">
              Permis de travail associé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <InfoRow
                label="Référence permis"
                value={
                  <Link
                    to={`/permits-travail/${permit.id}`}
                    className="font-mono font-semibold text-blue-700 hover:underline"
                  >
                    {permit.reference}
                  </Link>
                }
              />
              <InfoRow label="Type" value={permit.typePermis} />
              <InfoRow label="Site" value={permit.codeSite} />
              <InfoRow
                label="Période"
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
                  label="Plan de prévention"
                  value={
                    <Link
                      to={`/prevention/${permit.planPreventionId}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Voir le plan lié
                    </Link>
                  }
                />
              )}
              <InfoRow
                label="Statut évaluation"
                value={
                  isComplete ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Évaluation complète
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      En préparation
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
            Réévaluation des risques
            {isUpdatingRisque && (
              <span className="ml-3 inline-flex items-center gap-1 text-xs font-normal text-gray-400">
                <Loader2 className="h-3 w-3 animate-spin" />
                Enregistrement…
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
                  Progression de la réévaluation
                </span>
                <span className="font-semibold text-gray-900">
                  {reevaluesCount} / {totalRisques} risques réévalués
                </span>
              </div>

              <div className="h-2.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: allReevalues ? '#16a34a' : '#2563eb',
                  }}
                />
              </div>

              {highlightNonReevalues && !allReevalues && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Certains risques (surlignés en rouge) n'ont pas encore été réévalués.
                    Modifiez les champs de chaque ligne pour confirmer la réévaluation.
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
                      Valider l'évaluation
                    </Button>
                    {!allReevalues && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 rounded-lg bg-gray-800 px-3 py-2 text-center text-xs text-white shadow-lg">
                        Réévaluez tous les risques avant de valider
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                      </div>
                    )}
                  </div>

                  {allReevalues && (
                    <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      Tous les risques sont réévalués
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
            <div className="flex items-center gap-3 text-green-700">
              <CheckCircle2 className="h-6 w-6 shrink-0" />
              <div>
                <p className="font-semibold">Évaluation complète</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tous les risques ont été réévalués et l'évaluation a été validée.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
