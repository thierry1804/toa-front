import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import PlanReference from '@/components/planPrevention/PlanReference'
import RisqueMatrice from '@/components/planPrevention/RisqueMatrice'
import StatutBadge from '@/components/planPrevention/StatutBadge'
import ExaminerModal from '@/components/planPrevention/ExaminerModal'
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

export default function PlanPreventionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canExamine = usePermission('plan_prevention.examine')

  const { data: plan, isLoading, isError } = usePlanPreventionDetail(id ?? '')
  const { examinerPlan, isExamining } = usePlanPrevention()

  const [examinerOpen, setExaminerOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Chargement du plan...
      </div>
    )
  }

  if (isError || !plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-3 h-10 w-10 text-red-400" />
        <p className="font-medium text-gray-700">Plan introuvable</p>
        <p className="mt-1 text-sm text-gray-400">
          Ce plan de prévention n'existe pas ou vous n'y avez pas accès.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/prevention')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
      </div>
    )
  }

  const isExaminable =
    canExamine && (STATUTS_EXAMINABLES as readonly string[]).includes(plan.statut)

  const risqueRows: RisqueRow[] = (plan.risques ?? []).map((r) => ({
    localId: r.id,
    description: r.description,
    gravite: r.gravite,
    probabilite: r.probabilite,
    mesuresPreventives: r.mesuresPreventives,
  }))

  const uploadedTypes = new Set((plan.documents ?? []).map((d) => d.type))

  const dateDebut = plan.dateDebut
    ? new Date(plan.dateDebut).toLocaleDateString('fr-FR')
    : '—'
  const dateFin = plan.dateFin
    ? new Date(plan.dateFin).toLocaleDateString('fr-FR')
    : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title="Détail du plan de prévention"
        description="Lecture seule — aucune modification possible"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/prevention')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            {isExaminable && (
              <Button onClick={() => setExaminerOpen(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Examiner ce plan
              </Button>
            )}
          </div>
        }
      />

      {/* Informations générales */}
      <SectionCard title="Informations générales">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <PlanReference reference={plan.reference} />
            <StatutBadge statut={plan.statut} className="mt-0.5" />
          </div>
          <dl className="space-y-3">
            <InfoRow label="Code site" value={plan.codeSite} />
            <InfoRow label="Localité" value={plan.localite} />
            <InfoRow label="Activité planifiée" value={plan.activitePlanifiee} />
            <InfoRow
              label="Période"
              value={
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {dateDebut} → {dateFin}
                </span>
              }
            />
            <InfoRow
              label="Créé par"
              value={
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gray-400" />
                  {plan.createdBy?.name ?? '—'}
                </span>
              }
            />
            {plan.chefProjet && (
              <InfoRow
                label="Chef de projet"
                value={
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    {plan.chefProjet.name}
                  </span>
                }
              />
            )}
          </dl>
        </div>
      </SectionCard>

      {/* Matrice des risques */}
      <SectionCard title={`Matrice des risques (${risqueRows.length})`}>
        <RisqueMatrice rows={risqueRows} onChange={() => undefined} disabled />
      </SectionCard>

      {/* Sites concernés */}
      <SectionCard title={`Sites concernés (${plan.sites?.length ?? 0})`}>
        {(plan.sites?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun site renseigné.</p>
        ) : (
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
      </SectionCard>

      {/* Documents */}
      <SectionCard title="Documents requis">
        <ul className="space-y-2.5">
          {ALL_DOCUMENT_TYPES.map((type) => {
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
                {uploaded && (
                  <span className="ml-auto text-xs text-green-600 font-medium">Téléversé</span>
                )}
              </li>
            )
          })}
        </ul>
      </SectionCard>

      {/* Historique des examens */}
      <SectionCard title="Historique des examens">
        {(plan.examens?.length ?? 0) === 0 ? (
          <p className="text-sm text-gray-400 italic">Aucun examen enregistré pour ce plan.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {plan.examens!.map((examen) => (
              <li key={examen.id} className="py-3 space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-teal-500" />
                  <span className="text-sm font-medium text-gray-800">
                    Examiné par {examen.examinePar.name}
                    {examen.examinePar.firstname ? ` ${examen.examinePar.firstname}` : ''}
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

      <ExaminerModal
        isOpen={examinerOpen}
        planId={plan.id}
        planReference={plan.reference}
        isExamining={isExamining}
        onClose={() => setExaminerOpen(false)}
        onExaminer={examinerPlan}
      />
    </div>
  )
}
