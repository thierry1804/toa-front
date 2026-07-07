import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  User,
  Calendar,
  FileText,
  ShieldCheck,
  ShieldX,
  Key,
  Download,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PlanReference from '@/components/planPrevention/PlanReference'
import SitesKmzMap from '@/components/planPrevention/SitesKmzMap'
import RisqueMatrice from '@/components/planPrevention/RisqueMatrice'
import StatutBadge from '@/components/planPrevention/StatutBadge'
import ExaminerModal from '@/components/planPrevention/ExaminerModal'
import ValiderModal from '@/components/planPrevention/ValiderModal'
import RefuserModal from '@/components/planPrevention/RefuserModal'
import {
  usePlanPreventionDetail,
  usePlanPrevention,
} from '@/features/planPrevention/hooks/usePlanPrevention'
import { usePermission } from '@/features/auth/usePermission'
import { TYPES_DOCUMENT_LABELS, ALL_DOCUMENT_TYPES } from '@/types/planPrevention'
import type { RisqueRow } from '@/types/planPrevention'

const STATUTS_EXAMINABLES = ['SOUMIS', 'EN_COURS_DE_VALIDATION'] as const

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-48 shrink-0 text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}

function DecisionBadge({ decision }: { decision: 'VALIDE' | 'REFUSE' }) {
  const { t } = useTranslation()
  return decision === 'VALIDE' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-700 px-2 py-0.5 text-xs font-medium text-white">
      <ShieldCheck className="h-3 w-3" />
      {t('planPrevention.decision.VALIDE')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
      <ShieldX className="h-3 w-3" />
      {t('planPrevention.decision.REFUSE')}
    </span>
  )
}

export default function PlanPreventionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const canExamine = usePermission('plan_prevention.examine')
  const canValiderHse = usePermission('plan_prevention.valider_hse')
  const canRefuserHse = usePermission('plan_prevention.refuser_hse')

  const { data: plan, isLoading, isError } = usePlanPreventionDetail(id ?? '')
  const { examinerPlan, isExamining, validerPlan, isValidating, refuserPlan, isRefusing } =
    usePlanPrevention()

  const [examinerOpen, setExaminerOpen] = useState(false)
  const [validerOpen, setValiderOpen] = useState(false)
  const [refuserOpen, setRefuserOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {t('planPrevention.detail.loading')}
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-gray-700">{t('planPrevention.detail.notFound')}</p>
        <p className="mt-1 text-sm text-gray-400">{t('planPrevention.detail.notFoundDesc')}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/prevention')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('planPrevention.detail.back')}
        </Button>
      </div>
    )
  }

  const isExaminable =
    canExamine && (STATUTS_EXAMINABLES as readonly string[]).includes(plan.statut)
  const isDecidable = plan.statut === 'EXAMINE'

  const risqueRows: RisqueRow[] = (plan.risques ?? []).map((r) => ({
    localId: r.id,
    description: r.description,
    gravite: r.gravite,
    probabilite: r.probabilite,
    mesuresPreventives: r.mesuresPreventives,
  }))

  const uploadedTypes = new Set((plan.documents ?? []).map((d) => d.type))

  const downloadDocument = async (docId: string, filename: string) => {
    const token = localStorage.getItem('access_token')
    const url = `${import.meta.env.VITE_API_URL}/api/plans-prevention/${plan.id}/documents/${docId}/download`
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  }

  const dateDebut = plan.dateDebut ? new Date(plan.dateDebut).toLocaleDateString('fr-FR') : '—'
  const dateFin = plan.dateFin ? new Date(plan.dateFin).toLocaleDateString('fr-FR') : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('planPrevention.detail.title')}
        description={t('planPrevention.detail.description')}
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/prevention')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('planPrevention.detail.back')}
            </Button>
            {isExaminable && (
              <Button onClick={() => setExaminerOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('planPrevention.detail.examinerBtn')}
              </Button>
            )}
          </div>
        }
      />

      {/* Panneau de décision HSE */}
      {isDecidable && (canValiderHse || canRefuserHse) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="mb-3 text-sm font-semibold text-blue-800">
            {t('planPrevention.detail.decisionPanel')}
          </p>
          <div className="flex items-center gap-3">
            {canValiderHse && (
              <Button onClick={() => setValiderOpen(true)}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t('planPrevention.list.actions.valider')}
              </Button>
            )}
            {canRefuserHse && (
              <Button variant="danger" onClick={() => setRefuserOpen(true)}>
                <ShieldX className="mr-2 h-4 w-4" />
                {t('planPrevention.list.actions.refuser')}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 1. Informations générales */}
      <SectionCard title={t('planPrevention.detail.sections.generalInfo')}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <PlanReference reference={plan.reference} />
            <StatutBadge statut={plan.statut} className="mt-0.5" />
          </div>
          <dl className="space-y-3">
            <InfoRow label={t('planPrevention.detail.fields.codeSite')} value={plan.codeSite} />
            <InfoRow label={t('planPrevention.detail.fields.localite')} value={plan.localite} />
            <InfoRow label={t('planPrevention.detail.fields.activitePlanifiee')} value={plan.activitePlanifiee} />
            <InfoRow
              label={t('planPrevention.detail.fields.periode')}
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {dateDebut} → {dateFin}
                </span>
              }
            />
            <InfoRow
              label={t('planPrevention.detail.fields.createdBy')}
              value={
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" />
                  {plan.createdBy?.name ?? '—'}
                </span>
              }
            />
            {plan.chefProjet && (
              <InfoRow
                label={t('planPrevention.detail.fields.chefProjet')}
                value={
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    {plan.chefProjet.firstname
                      ? `${plan.chefProjet.firstname} ${plan.chefProjet.name}`
                      : plan.chefProjet.name}
                  </span>
                }
              />
            )}
          </dl>
        </div>
      </SectionCard>

      {/* 2. Matrice des risques */}
      <SectionCard title={t('planPrevention.detail.sections.riskMatrix', { count: risqueRows.length })}>
        <RisqueMatrice rows={risqueRows} onChange={() => undefined} disabled />
      </SectionCard>

      {/* 3. Sites concernés */}
      <SectionCard title={t('planPrevention.detail.sections.sites', { count: plan.sites?.length ?? 0 })}>
        <div className="space-y-4">
          <SitesKmzMap sites={plan.sites ?? []} height="360px" readonly />
          {(plan.sites?.length ?? 0) > 0 && (
            <ul className="divide-y divide-gray-100">
              {plan.sites.map((site) => (
                <li key={site.id} className="flex items-center gap-3 py-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{site.nom}</p>
                    <p className="text-xs text-gray-500">
                      {site.latitude.toFixed(6)}, {site.longitude.toFixed(6)}
                    </p>
                  </div>
                  {site.sourceKmz && (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      KMZ
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SectionCard>

      {/* 4. Documents requis */}
      <SectionCard title={t('planPrevention.detail.sections.documents')}>
        <ul className="space-y-2.5">
          {ALL_DOCUMENT_TYPES.map((type) => {
            const doc = plan.documents?.findLast((d) => d.type === type)
            const uploaded = uploadedTypes.has(type)
            return (
              <li key={type} className="flex items-center gap-3">
                {uploaded ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-red-400" />
                )}
                <span className={`text-sm ${uploaded ? 'text-gray-800' : 'text-gray-400 italic'}`}>
                  {TYPES_DOCUMENT_LABELS[type]}
                </span>
                {uploaded && doc && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void downloadDocument(doc.id, doc.filePath.split('/').at(-1) ?? 'document') }}
                    className="ml-auto flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    {t('planPrevention.detail.download')}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </SectionCard>

      {/* 5. Historique des examens */}
      <SectionCard title={t('planPrevention.detail.sections.examenHistory')}>
        {(plan.examens?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">{t('planPrevention.detail.noExamens')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.examens!.map((examen) => (
              <li key={examen.id} className="py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-medium text-gray-800">
                    {t('planPrevention.detail.examinedBy')}{' '}
                    {examen.examinePar.firstname
                      ? `${examen.examinePar.firstname} ${examen.examinePar.name}`
                      : examen.examinePar.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(examen.examineAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                {examen.commentaire && (
                  <p className="pl-6 text-sm text-gray-600 italic">"{examen.commentaire}"</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* 6. Historique des décisions HSE */}
      <SectionCard title={t('planPrevention.detail.sections.hseHistory')}>
        {(plan.decisionsHse?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">{t('planPrevention.detail.noDecisions')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.decisionsHse!.map((d) => (
              <li key={d.id} className="py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <DecisionBadge decision={d.decision} />
                  <span className="text-sm font-medium text-gray-800">
                    {t('planPrevention.detail.decisionBy')}{' '}
                    {d.decidePar.firstname
                      ? `${d.decidePar.firstname} ${d.decidePar.name}`
                      : d.decidePar.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">
                    {new Date(d.decidedAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                {d.commentaire && (
                  <p className="pl-1 text-sm text-gray-600 italic">"{d.commentaire}"</p>
                )}
                <div className="flex items-center gap-1.5 pl-1">
                  <Key className="h-3.5 w-3.5 text-gray-400" />
                  <span className="break-all font-mono text-xs text-gray-400">
                    {d.signatureElectronique}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <ExaminerModal
        isOpen={examinerOpen}
        planId={plan.id}
        planReference={plan.reference}
        isExamining={isExamining}
        onClose={() => setExaminerOpen(false)}
        onExaminer={examinerPlan}
      />

      <ValiderModal
        isOpen={validerOpen}
        planId={plan.id}
        planReference={plan.reference}
        isValidating={isValidating}
        onClose={() => setValiderOpen(false)}
        onValider={validerPlan}
      />

      <RefuserModal
        isOpen={refuserOpen}
        planId={plan.id}
        planReference={plan.reference}
        isRefusing={isRefusing}
        onClose={() => setRefuserOpen(false)}
        onRefuser={refuserPlan}
      />
    </div>
  )
}
