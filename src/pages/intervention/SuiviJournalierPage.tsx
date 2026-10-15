import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Pencil,
  Loader2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import SuiviDocumentUploadZone from '@/components/intervention/SuiviDocumentUploadZone'
import EngagementSection, { emptyEvaluation, type EvaluationData } from '@/components/permitTravail/EngagementSection'
import { getDangersFormIssue } from '@/features/permitTravail/utils/dangersEvaluation'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { useInterventionDetail } from '@/features/intervention/hooks/useIntervention'
import { useInterventionSuivis, useSuiviJournalier } from '@/features/intervention/hooks/useIntervention'
import { usePermitTravailDetail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import { isOfflineQueued } from '@/offline/offlineError'
import type { SuiviJournalier, SuiviJournalierInput, SuiviJournalierUpdateInput } from '@/types/intervention'

import { useToday } from '@/features/terrain/useToday'
import { useIsFieldAgent } from '@/features/terrain/useIsFieldAgent'
import { clearSuiviDraft, readSuiviDraft, writeSuiviDraft } from '@/features/terrain/suiviDraft'
import { PhaseProgressFields } from '@/features/terrain/PhaseProgressFields'
import { usePlanPreventionDetail } from '@/features/planPrevention/hooks/usePlanPrevention'
import type { SectionPlanifieeItem } from '@/types'
import type { PhaseAvancement } from '@/types/intervention'

function formatLongDate(dateStr: string, locale: string): string {
  const loc = locale === 'mg' ? 'mg-MG' : 'fr-FR'
  return new Date(dateStr).toLocaleDateString(loc, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// R-29 : exemples d'étapes pour faciliter la saisie
const ETAPES_EXEMPLES = [
  'Fouille',
  'Terrassement',
  'Ferraillage',
  'Coffrage',
  'Coulage',
  'Remblaiement',
  'Montage pylône',
  'Installation des équipements',
  'Tirage de câbles',
  'Finitions',
]

interface FormState {
  nomResponsable: string
  realise: boolean
  motifNonRealisation: string
  avancementPourcentage: number
  commentaire: string
}

const EMPTY_FORM: FormState = {
  nomResponsable: '',
  realise: true,
  motifNonRealisation: '',
  avancementPourcentage: 0,
  commentaire: '',
}

interface SuiviFormProps {
  interventionIri: string
  editingSuivi: SuiviJournalier | null
  suivis: SuiviJournalier[]
  onSave: (data: SuiviJournalierInput | SuiviJournalierUpdateInput, editingId?: string) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  apiError: Error | null
  sections: SectionPlanifieeItem[]
  terrainEnabled: boolean
}

function SuiviForm({ interventionIri, editingSuivi, suivis, onSave, onCancel, isSaving, apiError, sections, terrainEnabled }: SuiviFormProps) {
  const TODAY = useToday()
  const [phases, setPhases] = useState<PhaseAvancement[]>(editingSuivi?.phasesAvancement ?? [])
  const [dangers, setDangers] = useState<boolean | null>(editingSuivi?.dangersMaitrises ?? null)
  const [dangerDetails, setDangerDetails] = useState(editingSuivi?.detailsDangers ?? "")
  const [risques, setRisques] = useState<EvaluationData[]>(
    editingSuivi?.evaluationRisques?.length ? editingSuivi.evaluationRisques : [emptyEvaluation()],
  )
  const { t, i18n } = useTranslation()
  const currentUser = useAuthStore((s) => s.user)
  const connectedName = currentUser
    ? [currentUser.prenom, currentUser.nom].filter(Boolean).join(' ')
    : ''
  // L'avancement ne doit jamais régresser : plancher = l'avancement global
  // actuel (le suivi le plus récent, hors celui en cours d'édition). `suivis`
  // arrive déjà trié par date décroissante depuis useInterventionSuivis.
  const priorSuivis = suivis.filter((s) => s.id !== editingSuivi?.id)
  const minAvancement = priorSuivis[0]?.avancementPourcentage ?? 0

  const isEdit = !!editingSuivi
  const isFieldAgent = useIsFieldAgent()
  const draft = editingSuivi ? null : readSuiviDraft(interventionIri, TODAY)

  const [form, setForm] = useState<FormState>(
    editingSuivi
      ? {
          nomResponsable: editingSuivi.nomResponsable,
          realise: editingSuivi.realise,
          motifNonRealisation: editingSuivi.motifNonRealisation ?? '',
          avancementPourcentage: editingSuivi.avancementPourcentage,
          commentaire: editingSuivi.commentaire ?? '',
        }
      : {
          ...EMPTY_FORM,
          nomResponsable: connectedName,
          realise: draft?.realise ?? true,
          motifNonRealisation: draft?.motifNonRealisation ?? '',
          commentaire: draft?.commentaire ?? '',
          avancementPourcentage: Math.max(minAvancement, draft?.avancementPourcentage ?? 0),
        },
  )

  useEffect(() => {
    if (isEdit) return
    writeSuiviDraft(interventionIri, TODAY, {
      realise: form.realise,
      motifNonRealisation: form.motifNonRealisation,
      avancementPourcentage: form.avancementPourcentage,
      commentaire: form.commentaire,
    })
  }, [isEdit, interventionIri, TODAY, form.realise, form.motifNonRealisation, form.avancementPourcentage, form.commentaire])
  const [avancementError, setAvancementError] = useState('')

  const set = (partial: Partial<FormState>) => setForm((f) => ({ ...f, ...partial }))

  const todayLabel = formatLongDate(TODAY, i18n.language)
  const editDateLabel = editingSuivi ? formatLongDate(editingSuivi.date, i18n.language) : todayLabel

  const handleAvancement = (val: string) => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0 || n > 100) {
      setAvancementError(t('intervention.pages.suiviJournalier.form.avancementError'))
    } else if (n < minAvancement) {
      setAvancementError(t('intervention.pages.suiviJournalier.form.avancementMinError', { min: minAvancement }))
    } else {
      setAvancementError('')
    }
    set({ avancementPourcentage: isNaN(n) ? 0 : n })
  }

  // Questionnaire facultatif : s'il est entamé, il doit être complet et cohérent.
  const risquesRenseignes = risques.filter(
    (e) => e.dangers.trim() || e.moyensMaitrise.trim() || e.evaluationPreliminaire || e.evaluationFinale,
  )
  const risquesIssue = risquesRenseignes.length > 0 ? getDangersFormIssue(risques) : null

  const addEtape = (etape: string) => {
    const current = form.commentaire.trim()
    if (current.split(/,\s*/).includes(etape)) return
    set({ commentaire: current ? `${current}, ${etape}` : etape })
  }

  const canSubmit =
    risquesIssue === null &&
    form.nomResponsable.trim().length > 0 &&
    (form.realise || form.motifNonRealisation.trim().length > 0) &&
    avancementError === '' &&
    (!terrainEnabled || (dangers !== null && (dangers || dangerDetails.trim().length > 0))) &&
    phases.every((phase) => Number.isInteger(phase.avancementPourcentage) && phase.avancementPourcentage >= 0 && phase.avancementPourcentage <= 100) &&
    !isSaving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    const terrainFields = terrainEnabled ? {
      phasesAvancement: phases,
      dangersMaitrises: dangers,
      detailsDangers: dangers === false ? dangerDetails.trim() : null,
    } : {}
    if (isEdit) {
      await onSave(
        {
          ...terrainFields,
          nomResponsable: form.nomResponsable,
          realise: form.realise,
          motifNonRealisation: form.realise ? null : form.motifNonRealisation,
          avancementPourcentage: form.avancementPourcentage,
          commentaire: form.commentaire || null,
          evaluationRisques: risquesRenseignes.length > 0 ? risquesRenseignes : null,
        } satisfies SuiviJournalierUpdateInput,
        editingSuivi.id,
      )
    } else {
      await onSave({
        ...terrainFields,
        intervention: interventionIri,
        date: TODAY,
        nomResponsable: form.nomResponsable,
        realise: form.realise,
        motifNonRealisation: form.realise ? null : form.motifNonRealisation,
        avancementPourcentage: form.avancementPourcentage,
        commentaire: form.commentaire || null,
        evaluationRisques: risquesRenseignes.length > 0 ? risquesRenseignes : null,
      } satisfies SuiviJournalierInput)
    }
  }

  const apiDetail = apiError
    ? ((apiError as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? '')
    : ''

  const resolvedApiError = apiDetail
    ? apiDetail.includes('doublon_date') || apiDetail.includes('doublon')
      ? t('intervention.pages.suiviJournalier.errors.doublon', { date: todayLabel })
      : apiDetail.includes('evaluation_requise') || apiDetail.includes('EVALUATION_COMPLETE')
        ? t('intervention.pages.suiviJournalier.errors.evaluationRequise')
        : apiDetail.includes('motif')
          ? t('intervention.pages.suiviJournalier.errors.motifRequis')
          : apiDetail.includes('avancement')
            ? t('intervention.pages.suiviJournalier.errors.avancementInvalide')
            : apiDetail
    : ''

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isEdit
            ? t('intervention.pages.suiviJournalier.form.editTitle', { date: editDateLabel })
            : t('intervention.pages.suiviJournalier.form.createTitle', { date: todayLabel })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {connectedName ? (
            <p className="text-sm text-gray-600">
              {t('intervention.pages.suiviJournalier.form.responsable')} : <span className="font-semibold text-gray-900">{form.nomResponsable}</span>
            </p>
          ) : (
            <Input
              label={t('intervention.pages.suiviJournalier.form.responsable')}
              required
              type="text"
              value={form.nomResponsable}
              onChange={(e) => set({ nomResponsable: e.target.value })}
              placeholder={t('intervention.pages.suiviJournalier.form.responsablePlaceholder')}
              maxLength={150}
            />
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('intervention.pages.suiviJournalier.form.realisation')}
            </label>
            <div className="flex w-fit overflow-hidden rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => set({ realise: true, motifNonRealisation: '' })}
                className={`px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  form.realise
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
                {t('intervention.pages.shared.realise')}
              </button>
              <button
                type="button"
                onClick={() => set({ realise: false })}
                className={`border-l border-gray-300 px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] ${
                  !form.realise
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <XCircle className="mr-1.5 inline h-4 w-4" />
                {t('intervention.pages.shared.nonRealise')}
              </button>
            </div>
          </div>

          {!form.realise && (
            <Textarea
              label={t('intervention.pages.suiviJournalier.form.motif')}
              required
              value={form.motifNonRealisation}
              onChange={(e) => set({ motifNonRealisation: e.target.value })}
              placeholder={t('intervention.pages.suiviJournalier.form.motifPlaceholder')}
              rows={3}
            />
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('intervention.pages.suiviJournalier.form.avancement')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <div className="w-24">
                <Input
                  type="number"
                  min={minAvancement}
                  max={100}
                  value={form.avancementPourcentage}
                  onChange={(e) => handleAvancement(e.target.value)}
                  error={avancementError || undefined}
                />
              </div>
              <span className="text-sm text-gray-500">%</span>
              {/* L'échelle reste 0–100 pour refléter le taux réel ; le curseur ne descend pas sous l'avancement déjà enregistré. */}
              <div className="relative flex-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.avancementPourcentage}
                  onChange={(e) => handleAvancement(String(Math.max(minAvancement, Number(e.target.value))))}
                  aria-valuemin={minAvancement}
                  className="w-full accent-blue-600 min-h-[44px]"
                />
                {minAvancement > 0 && (
                  <span
                    aria-hidden
                    title={`${minAvancement}%`}
                    className="pointer-events-none absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-gray-700"
                    style={{ left: `calc(${minAvancement}% + ${(50 - minAvancement) * 0.16}px)` }}
                  />
                )}
              </div>
              <AvancementBadge pct={form.avancementPourcentage} />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {[5, 10].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => handleAvancement(String(Math.min(100, form.avancementPourcentage + step)))}
                  className="min-h-11 min-w-16 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  +{step} %
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAvancement('100')}
                className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              >
                100 %
              </button>
            </div>
            {minAvancement > 0 && !avancementError && (
              <p className="mt-1 text-xs text-gray-400">
                {t('intervention.pages.suiviJournalier.form.avancementMinHint', { min: minAvancement })}
              </p>
            )}
          </div>

          {terrainEnabled && <>
            <PhaseProgressFields sections={sections} value={phases} onChange={setPhases} />
            <fieldset className="space-y-3 rounded-lg border border-gray-200 p-4">
              <legend className="px-1 text-sm font-semibold">{t('terrain.hazardsQuestion')}</legend>
              <div className="flex gap-5">{[true, false].map((value) => <label key={String(value)} className="flex min-h-11 items-center gap-2 text-sm"><input type="radio" name="dangersMaitrises" required checked={dangers === value} onChange={() => setDangers(value)} />{t(value ? 'terrain.yes' : 'terrain.no')}</label>)}</div>
              {dangers === false && <Textarea label={t('terrain.hazardDetails')} required value={dangerDetails} onChange={(e) => setDangerDetails(e.target.value)} rows={3} />}
            </fieldset>
          </>}
          <p className="text-sm text-gray-600">{t('terrain.photosAfterSave')}</p>

          <div className="space-y-2">
            <Textarea
              label={t('intervention.pages.suiviJournalier.form.commentaire')}
              value={form.commentaire}
              onChange={(e) => set({ commentaire: e.target.value })}
              placeholder={t('intervention.pages.suiviJournalier.form.commentairePlaceholder')}
              rows={3}
            />
            <div className="flex flex-wrap items-center gap-2" aria-label={t('intervention.pages.suiviJournalier.form.etapesExemples')}>
              {ETAPES_EXEMPLES.map((etape) => (
                <button
                  key={etape}
                  type="button"
                  onClick={() => addEtape(etape)}
                  className="min-h-8 rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                >
                  {etape}
                </button>
              ))}
            </div>
          </div>

          {/* R-29 : questionnaire des risques, au format de celui du permis */}
          <details open={risquesRenseignes.length > 0} className="group rounded-lg border border-gray-200">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-semibold text-gray-800">
              <span>
                {t('intervention.pages.suiviJournalier.form.risquesTitle')}{' '}
                <span className="font-normal text-gray-500">({t('intervention.pages.suiviJournalier.form.facultatif')})</span>
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500 transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <div className="border-t border-gray-100 p-3">
            <EngagementSection
              checked={false}
              onChange={() => {}}
              evaluations={risques}
              onEvaluationsChange={setRisques}
              showCertification={false}
              hideSaveButton
              evaluationError={risquesIssue ? t('intervention.pages.suiviJournalier.form.risquesIssue') : null}
            />
            </div>
          </details>

          {resolvedApiError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{resolvedApiError}</span>
            </div>
          )}

          <div
            className={`sticky z-20 flex items-center justify-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm ${
              isFieldAgent ? 'bottom-[calc(4rem+env(safe-area-inset-bottom))] lg:bottom-0' : 'bottom-0'
            }`}
          >
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving} className="min-h-12">
              {t('intervention.pages.suiviJournalier.form.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit} className="min-h-12 px-6">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('intervention.pages.suiviJournalier.form.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

const STATUT_LABEL_KEYS: Record<string, string> = {
  EN_PREPARATION: 'intervention.pages.shared.statut.enPreparation',
  EVALUATION_COMPLETE: 'intervention.pages.shared.statut.evaluationComplete',
  EN_COURS: 'intervention.pages.shared.statut.enCours',
  TERMINEE: 'intervention.pages.shared.statut.terminee',
}

export default function SuiviJournalierPage() {
  const { id } = useParams<{ id: string }>()
  const TODAY = useToday()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const canCreate = usePermission('suivi_journalier.create')
  const canEdit = usePermission('suivi_journalier.edit')
  const canDeleteDoc = usePermission('suivi_journalier.delete_document')

  const { data: intervention, isLoading: loadingIntervention } = useInterventionDetail(id ?? '')
  const { data: permit, isLoading: loadingPermit } = usePermitTravailDetail(
    intervention?.permitTravailId ?? '',
  )
  const { data: plan } = usePlanPreventionDetail(permit?.planPreventionId ?? '')
  const { data: suivis = [], isLoading: loadingSuivis, isError: suivisError } = useInterventionSuivis(id ?? '')
  const {
    createSuivi,
    updateSuivi,
    uploadSuiviDocument,
    deleteSuiviDocument,
    isCreating,
    isUpdating,
    createError,
    updateError,
  } = useSuiviJournalier(id ?? '')

  const [showForm, setShowForm] = useState(searchParams.get('new') === '1')
  const [editingSuivi, setEditingSuivi] = useState<SuiviJournalier | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  const isLoading = loadingIntervention || loadingPermit || loadingSuivis

  const hasTodaySuivi = suivis.some((s) => s.date.slice(0, 10) === TODAY)
  const formVisible = showForm && (editingSuivi ? canEdit : canCreate && !hasTodaySuivi) && !suivisError
  const interventionIri = intervention ? `/api/interventions/${intervention.id}` : ''

  // "Avancement global" = l'avancement du suivi le plus récent, pas une
  // moyenne des jours (une moyenne diluait la progression réelle : 2% puis
  // 21% affichait 12%, trompeur). `suivis` est trié par date décroissante
  // par useInterventionSuivis, donc le premier élément est le plus récent.
  const globalAvancement = suivis[0]?.avancementPourcentage ?? 0

  const handleSave = async (
    data: SuiviJournalierInput | SuiviJournalierUpdateInput,
    editingId?: string,
  ) => {
    try {
      if (editingId) {
        await updateSuivi(editingId, data as SuiviJournalierUpdateInput)
      } else {
        await createSuivi(data as SuiviJournalierInput)
      }
    } catch (error) {
      // Hors ligne : la mutation est mise en file d'attente (queue offline)
      // et rejette quand même côté React Query — on ferme le formulaire
      // comme en cas de succès, l'action a bien été capturée. Une vraie
      // erreur réseau/API reste affichée via createError/updateError.
      if (isOfflineQueued(error)) {
        if (!editingId) clearSuiviDraft(interventionIri, TODAY)
        setShowForm(false)
        setEditingSuivi(null)
        setJustSaved(true)
      }
      return
    }
    if (!editingId) clearSuiviDraft(interventionIri, TODAY)
    setShowForm(false)
    setEditingSuivi(null)
    setJustSaved(true)
  }

  const openEdit = (suivi: SuiviJournalier) => {
    setEditingSuivi(suivi)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSuivi(null)
  }

  if (isLoading) {
    return <ListPageSkeleton withStatStrip={false} />
  }

  if (!intervention) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-gray-300" />
        <p>{t('intervention.pages.suiviJournalier.notFound')}</p>
        <Button variant="outline" onClick={() => navigate('/interventions/suivis')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('intervention.pages.suiviJournalier.backToList')}
        </Button>
      </div>
    )
  }

  const permit_ref =
    typeof intervention.permitTravail === 'object'
      ? intervention.permitTravail.reference
      : permit?.reference ?? '—'
  const permit_site =
    typeof intervention.permitTravail === 'object'
      ? intervention.permitTravail.codeSite
      : permit?.codeSite ?? '—'
  const statutLabel = t(
    STATUT_LABEL_KEYS[intervention.statut] ?? 'intervention.pages.shared.statut.enPreparation',
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('intervention.pages.suiviJournalier.title')}
        description={t('intervention.pages.suiviJournalier.description')}
        actions={
          <Button variant="outline" onClick={() => navigate(`/interventions/${id}/carnet`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('terrain.openNotebook')}
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <dt className="text-xs font-medium text-gray-500">
                {t('intervention.pages.suiviJournalier.summary.permitRef')}
              </dt>
              <dd className="mt-1 text-sm font-semibold font-mono text-gray-900">{permit_ref}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">
                {t('intervention.pages.suiviJournalier.summary.site')}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{permit_site}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">
                {t('intervention.pages.suiviJournalier.summary.statut')}
              </dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  {statutLabel}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">
                {t('intervention.pages.suiviJournalier.summary.globalProgress')}
              </dt>
              <dd className="mt-1 space-y-1">
                <AvancementBadge pct={globalAvancement} />
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${globalAvancement}%` }}
                  />
                </div>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {justSaved && !formVisible && (
        <p role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-900">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {t('terrain.savedAddPhotos')}
        </p>
      )}

      {suivisError && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{t('terrain.followupsUnavailable')}</p>}

      {canCreate && !hasTodaySuivi && !formVisible && !suivisError && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setEditingSuivi(null)
              setShowForm(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('intervention.pages.suiviJournalier.addToday')}
          </Button>
        </div>
      )}

      {formVisible && (
        <SuiviForm
          key={`${editingSuivi?.id ?? 'new'}-${TODAY}`}
          sections={plan?.sections ?? plan?.planificationSections ?? []}
          terrainEnabled={(intervention.suiviTerrainVersion ?? 0) >= 1}
          interventionIri={interventionIri}
          editingSuivi={editingSuivi}
          suivis={suivis}
          onSave={handleSave}
          onCancel={closeForm}
          isSaving={isCreating || isUpdating}
          apiError={editingSuivi ? updateError : createError}
        />
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {t('intervention.pages.suiviJournalier.historyTitle', { count: suivis.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className={suivis.length === 0 && !formVisible ? undefined : 'p-0'}>
          {suivis.length === 0 && !formVisible ? (
            <div className="py-12 text-center">
              <p className="font-medium text-gray-600">{t('intervention.pages.suiviJournalier.empty.title')}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t('intervention.pages.suiviJournalier.empty.description')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {suivis.map((suivi) => {
                const isToday = suivi.date.slice(0, 10) === TODAY
                const dateLabel = formatLongDate(suivi.date, i18n.language)

                return (
                  <div
                    key={suivi.id}
                    className={`px-4 py-4 ${isToday ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold capitalize text-gray-900">
                          {dateLabel}
                          {isToday && (
                            <span className="ml-2 text-xs font-normal text-blue-700">
                              ({t('intervention.pages.suiviJournalier.today')})
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">
                          {t('intervention.pages.suiviJournalier.responsable')}{' '}
                          <span className="font-medium text-gray-700">{suivi.nomResponsable}</span>
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {suivi.realise ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            {t('intervention.pages.shared.realise')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                            <XCircle className="h-3 w-3" />
                            {t('intervention.pages.shared.nonRealise')}
                          </span>
                        )}
                        <AvancementBadge pct={suivi.avancementPourcentage} />
                      </div>
                    </div>

                    {!suivi.realise && suivi.motifNonRealisation && (
                      <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {suivi.motifNonRealisation}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-2">{suivi.phasesAvancement?.map((phase) => <span key={phase.phaseId} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-800">{phase.libelle} · {phase.avancementPourcentage} %</span>)}</div>
                    {suivi.pendingSync && <p className="mt-2 text-sm text-amber-800">{t('terrain.state.pending')}</p>}
                    {suivi.dangersMaitrises === false && <p className="mt-2 text-sm text-amber-800">{t('terrain.hazardReported')} : {suivi.detailsDangers}</p>}
                    {suivi.commentaire && (
                      <p className="mt-2 text-sm text-gray-600">{suivi.commentaire}</p>
                    )}

                    {((suivi.documents?.length ?? 0) > 0 || (isToday && canEdit)) && (
                      <div className="mt-3">
                        <SuiviDocumentUploadZone
                          suiviId={suivi.id}
                          documents={suivi.documents ?? []}
                          phases={suivi.phasesAvancement ?? []}
                          onUpload={(file, capturedAt, phaseId) => uploadSuiviDocument(suivi.id, file, capturedAt, phaseId)}
                          onDelete={(docId) => deleteSuiviDocument(suivi.id, docId)}
                          disabled={!isToday || !canEdit}
                          canDelete={canDeleteDoc}
                        />
                      </div>
                    )}

                    {isToday && canEdit && !formVisible && (
                      <div className="mt-3 flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => openEdit(suivi)}>
                          <Pencil className="mr-1.5 h-3.5 w-3.5" />
                          {t('intervention.pages.suiviJournalier.edit')}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
