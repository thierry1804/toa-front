import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Pencil,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import AvancementBadge from '@/components/intervention/AvancementBadge'
import SuiviDocumentUploadZone from '@/components/intervention/SuiviDocumentUploadZone'
import ListPageSkeleton from '@/components/ui/ListPageSkeleton'
import { useInterventionDetail } from '@/features/intervention/hooks/useIntervention'
import { useInterventionSuivis, useSuiviJournalier } from '@/features/intervention/hooks/useIntervention'
import { usePermitTravailDetail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import type { SuiviJournalier, SuiviJournalierInput, SuiviJournalierUpdateInput } from '@/types/intervention'

const TODAY = new Date().toISOString().slice(0, 10)

function formatLongDate(dateStr: string, locale: string): string {
  const loc = locale === 'mg' ? 'mg-MG' : 'fr-FR'
  return new Date(dateStr).toLocaleDateString(loc, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

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
  onSave: (data: SuiviJournalierInput | SuiviJournalierUpdateInput, editingId?: string) => Promise<void>
  onCancel: () => void
  isSaving: boolean
  apiError: Error | null
}

function SuiviForm({ interventionIri, editingSuivi, onSave, onCancel, isSaving, apiError }: SuiviFormProps) {
  const { t, i18n } = useTranslation()
  const [form, setForm] = useState<FormState>(
    editingSuivi
      ? {
          nomResponsable: editingSuivi.nomResponsable,
          realise: editingSuivi.realise,
          motifNonRealisation: editingSuivi.motifNonRealisation ?? '',
          avancementPourcentage: editingSuivi.avancementPourcentage,
          commentaire: editingSuivi.commentaire ?? '',
        }
      : EMPTY_FORM,
  )
  const [avancementError, setAvancementError] = useState('')

  const set = (partial: Partial<FormState>) => setForm((f) => ({ ...f, ...partial }))

  const isEdit = !!editingSuivi
  const todayLabel = formatLongDate(TODAY, i18n.language)
  const editDateLabel = editingSuivi ? formatLongDate(editingSuivi.date, i18n.language) : todayLabel

  const handleAvancement = (val: string) => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0 || n > 100) {
      setAvancementError(t('intervention.pages.suiviJournalier.form.avancementError'))
    } else {
      setAvancementError('')
    }
    set({ avancementPourcentage: isNaN(n) ? 0 : n })
  }

  const canSubmit =
    form.nomResponsable.trim().length > 0 &&
    (form.realise || form.motifNonRealisation.trim().length > 0) &&
    avancementError === '' &&
    !isSaving

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    if (isEdit) {
      await onSave(
        {
          nomResponsable: form.nomResponsable,
          realise: form.realise,
          motifNonRealisation: form.realise ? null : form.motifNonRealisation,
          avancementPourcentage: form.avancementPourcentage,
          commentaire: form.commentaire || null,
        } satisfies SuiviJournalierUpdateInput,
        editingSuivi.id,
      )
    } else {
      await onSave({
        intervention: interventionIri,
        date: TODAY,
        nomResponsable: form.nomResponsable,
        realise: form.realise,
        motifNonRealisation: form.realise ? null : form.motifNonRealisation,
        avancementPourcentage: form.avancementPourcentage,
        commentaire: form.commentaire || null,
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
          {!isEdit && (
            <Input label={t('intervention.pages.suiviJournalier.form.date')} type="date" value={TODAY} disabled />
          )}

          <Input
            label={t('intervention.pages.suiviJournalier.form.responsable')}
            required
            type="text"
            value={form.nomResponsable}
            onChange={(e) => set({ nomResponsable: e.target.value })}
            placeholder={t('intervention.pages.suiviJournalier.form.responsablePlaceholder')}
            maxLength={150}
          />

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
                  min={0}
                  max={100}
                  value={form.avancementPourcentage}
                  onChange={(e) => handleAvancement(e.target.value)}
                  error={avancementError || undefined}
                />
              </div>
              <span className="text-sm text-gray-500">%</span>
              <input
                type="range"
                min={0}
                max={100}
                value={form.avancementPourcentage}
                onChange={(e) => handleAvancement(e.target.value)}
                className="flex-1 accent-blue-600 min-h-[44px]"
              />
              <AvancementBadge pct={form.avancementPourcentage} />
            </div>
          </div>

          <Textarea
            label={t('intervention.pages.suiviJournalier.form.commentaire')}
            value={form.commentaire}
            onChange={(e) => set({ commentaire: e.target.value })}
            placeholder={t('intervention.pages.suiviJournalier.form.commentairePlaceholder')}
            rows={3}
          />

          {resolvedApiError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{resolvedApiError}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              {t('intervention.pages.suiviJournalier.form.cancel')}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
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
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const canCreate = usePermission('suivi_journalier.create')
  const canEdit = usePermission('suivi_journalier.edit')
  const canDeleteDoc = usePermission('suivi_journalier.delete_document')

  const { data: intervention, isLoading: loadingIntervention } = useInterventionDetail(id ?? '')
  const { data: permit, isLoading: loadingPermit } = usePermitTravailDetail(
    intervention?.permitTravailId ?? '',
  )
  const { data: suivis = [], isLoading: loadingSuivis } = useInterventionSuivis(id ?? '')
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

  const [showForm, setShowForm] = useState(false)
  const [editingSuivi, setEditingSuivi] = useState<SuiviJournalier | null>(null)

  const isLoading = loadingIntervention || loadingPermit || loadingSuivis

  const hasTodaySuivi = suivis.some((s) => s.date === TODAY)
  const interventionIri = intervention ? `/api/interventions/${intervention.id}` : ''

  const avgAvancement =
    suivis.length > 0
      ? Math.round(suivis.reduce((acc, s) => acc + s.avancementPourcentage, 0) / suivis.length)
      : 0

  const handleSave = async (
    data: SuiviJournalierInput | SuiviJournalierUpdateInput,
    editingId?: string,
  ) => {
    if (editingId) {
      await updateSuivi(editingId, data as SuiviJournalierUpdateInput)
    } else {
      await createSuivi(data as SuiviJournalierInput)
    }
    setShowForm(false)
    setEditingSuivi(null)
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
          <Button variant="outline" onClick={() => navigate(`/interventions/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('intervention.pages.suiviJournalier.backToEvaluation')}
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
                <AvancementBadge pct={avgAvancement} />
                <div className="h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${avgAvancement}%` }}
                  />
                </div>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canCreate && !hasTodaySuivi && !showForm && (
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

      {showForm && (
        <SuiviForm
          interventionIri={interventionIri}
          editingSuivi={editingSuivi}
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
        <CardContent className={suivis.length === 0 && !showForm ? undefined : 'p-0'}>
          {suivis.length === 0 && !showForm ? (
            <div className="py-12 text-center">
              <p className="font-medium text-gray-600">{t('intervention.pages.suiviJournalier.empty.title')}</p>
              <p className="mt-1 text-sm text-gray-500">
                {t('intervention.pages.suiviJournalier.empty.description')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {suivis.map((suivi) => {
                const isToday = suivi.date === TODAY
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

                    {suivi.commentaire && (
                      <p className="mt-2 text-sm text-gray-600">{suivi.commentaire}</p>
                    )}

                    {(suivi.documents.length > 0 || (isToday && canEdit)) && (
                      <div className="mt-3">
                        <SuiviDocumentUploadZone
                          documents={suivi.documents}
                          onUpload={(file) => uploadSuiviDocument(suivi.id, file)}
                          onDelete={(docId) => deleteSuiviDocument(suivi.id, docId)}
                          disabled={!isToday || !canDeleteDoc}
                        />
                      </div>
                    )}

                    {isToday && canEdit && !showForm && (
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
