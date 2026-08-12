import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, XCircle, FileText, Image } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import NiveauRisqueBadge from '@/components/intervention/NiveauRisqueBadge'
import { usePermission } from '@/features/auth/usePermission'
import { useInterventionSuiviHse } from '@/features/intervention/hooks/useIntervention'
import type { StatutIntervention } from '@/types/intervention'
import { formatDate, formatDateTime } from '@/utils/date'

function useStatutLabels(): Record<StatutIntervention, string> {
  const { t } = useTranslation()
  return {
    EN_PREPARATION:      t('intervention.pages.shared.statut.enPreparation'),
    EVALUATION_COMPLETE: t('intervention.pages.shared.statut.evaluationComplete'),
    EN_COURS:            t('intervention.pages.shared.statut.enCours'),
    TERMINEE:            t('intervention.pages.shared.statut.terminee'),
  }
}

function StatutBadge({ statut }: { statut: StatutIntervention }) {
  const labels = useStatutLabels()
  const styles: Record<StatutIntervention, string> = {
    EN_PREPARATION:      'bg-gray-100 text-gray-700',
    EVALUATION_COMPLETE: 'bg-blue-100 text-blue-700',
    EN_COURS:            'bg-orange-100 text-orange-700',
    TERMINEE:            'bg-green-100 text-green-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[statut] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[statut] ?? statut}
    </span>
  )
}

function DocumentItem({ nom, mimeType }: { nom: string; mimeType: string }) {
  const isPdf = mimeType === 'application/pdf'
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
      {isPdf
        ? <FileText className="h-4 w-4 shrink-0 text-red-500" />
        : <Image className="h-4 w-4 shrink-0 text-blue-500" />}
      <span className="truncate">{nom}</span>
    </div>
  )
}

export default function InterventionDetailHsePage() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()
  const { t }        = useTranslation()
  const canDetail    = usePermission('intervention.suivi.detail')
  const { data, isLoading, isError } = useInterventionSuiviHse(id ?? '')

  if (!canDetail) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">
        {t('intervention.pages.shared.accessDenied')}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-400">{t('intervention.pages.shared.loading')}</div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-gray-400">
        <p>{t('intervention.pages.detailHse.notFound')}</p>
        <Button variant="outline" onClick={() => navigate(-1)}>{t('common.back')}</Button>
      </div>
    )
  }

  const { intervention, permitTravail, planPrevention, suiviJournaliers, evaluationRisques, avancementMoyen } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title={permitTravail?.reference ?? t('intervention.pages.detailHse.headerFallbackTitle', { id: intervention.id.slice(0, 8) })}
          description={t('intervention.pages.detailHse.headerDescription', { site: permitTravail?.codeSite ?? '' })}
        />
      </div>

      {/* Section 1 — Header info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-gray-500">{t('intervention.pages.detailHse.statutLabel')}</p>
              <StatutBadge statut={intervention.statut} />
            </div>
            {permitTravail && (
              <>
                <div>
                  <p className="text-xs text-gray-500">{t('intervention.pages.detailHse.permitReferenceLabel')}</p>
                  <p className="font-mono text-sm font-semibold text-blue-700">{permitTravail.reference}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('intervention.pages.detailHse.typeLabel')}</p>
                  <p className="text-sm text-gray-700">{permitTravail.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('intervention.pages.detailHse.siteLabel')}</p>
                  <p className="text-sm text-gray-700">{permitTravail.codeSite}</p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-gray-500">{t('intervention.pages.detailHse.globalProgressLabel')}</p>
              <AvancementBadge pct={Math.round(avancementMoyen)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2 — Timeline suivis journaliers */}
      <Card>
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">
            {t('intervention.pages.detailHse.suivisSection.title', { count: suiviJournaliers.length })}
          </h2>
        </div>
        <CardContent className="pt-4">
          {suiviJournaliers.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('intervention.pages.detailHse.suivisSection.empty')}</p>
          ) : (
            <div className="space-y-4">
              {suiviJournaliers.map((suivi) => (
                <div
                  key={suivi.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{formatDate(suivi.date)}</span>
                        {suivi.realise ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <CheckCircle className="h-3.5 w-3.5" /> {t('intervention.pages.shared.realise')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-700">
                            <XCircle className="h-3.5 w-3.5" /> {t('intervention.pages.shared.nonRealise')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {t('intervention.pages.detailHse.suivisSection.responsable')} <span className="font-medium text-gray-700">{suivi.nomResponsable}</span>
                      </p>
                      {!suivi.realise && suivi.motifNonRealisation && (
                        <p className="text-xs text-red-600">
                          {t('intervention.pages.detailHse.suivisSection.motif')} {suivi.motifNonRealisation}
                        </p>
                      )}
                      {suivi.commentaire && (
                        <p className="text-xs text-gray-600">{suivi.commentaire}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {t('intervention.pages.detailHse.suivisSection.recordedOn', { date: formatDateTime(suivi.createdAt) })}
                      </p>
                    </div>
                    <AvancementBadge pct={suivi.avancementPourcentage} />
                  </div>

                  {suivi.documents.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {suivi.documents.map((doc) => (
                        <DocumentItem key={doc.id} nom={doc.nom} mimeType={doc.mimeType} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3 — Matrice risques (readonly) */}
      {evaluationRisques.count > 0 && (
        <Card>
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('intervention.pages.detailHse.risquesSection.title', { count: evaluationRisques.count })}
              {' — '}
              <span className="text-gray-500 font-normal">
                {t('intervention.pages.detailHse.risquesSection.averageLevel', { value: evaluationRisques.niveauMoyen.toFixed(1) })}
              </span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.description')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.gravite')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.probabilite')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.niveauRisque')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.reevalue')}</th>
                  <th className="px-4 py-3 font-medium text-gray-600">{t('intervention.pages.detailHse.risquesSection.headers.mesures')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {evaluationRisques.items.map((eval_) => (
                  <tr key={eval_.id} className={eval_.estReevalue ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3 text-gray-800">{eval_.description}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-700">{eval_.gravite}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-700">{eval_.probabilite}</td>
                    <td className="px-4 py-3">
                      <NiveauRisqueBadge niveauRisque={eval_.niveauRisque} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {eval_.estReevalue
                        ? <CheckCircle className="h-4 w-4 text-green-600 inline" />
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                      {eval_.mesuresConfirmees ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Section 4 — Infos permis + plan */}
      {(permitTravail || planPrevention) && (
        <Card>
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
            <h2 className="text-sm font-semibold text-gray-900">{t('intervention.pages.detailHse.linkedInfo.title')}</h2>
          </div>
          <CardContent className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
            {permitTravail && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">{t('intervention.pages.detailHse.linkedInfo.permit')}</p>
                <Link
                  to={`/permits-travail/${permitTravail.id}`}
                  className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-blue-700 hover:underline"
                >
                  {permitTravail.reference}
                </Link>
              </div>
            )}
            {planPrevention && (
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">{t('intervention.pages.detailHse.linkedInfo.plan')}</p>
                <Link
                  to={`/prevention/${planPrevention.id}`}
                  className="inline-flex items-center gap-1 font-mono text-sm font-semibold text-blue-700 hover:underline"
                >
                  {planPrevention.reference}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
