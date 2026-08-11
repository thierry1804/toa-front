import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  XCircle,
  Pencil,
  ClipboardList,
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
import { useInterventionDetail } from '@/features/intervention/hooks/useIntervention'
import { useInterventionSuivis, useSuiviJournalier } from '@/features/intervention/hooks/useIntervention'
import { usePermitTravailDetail } from '@/features/permitTravail/hooks/usePermitTravail'
import { usePermission } from '@/features/auth/usePermission'
import type { SuiviJournalier, SuiviJournalierInput, SuiviJournalierUpdateInput } from '@/types/intervention'

const TODAY = new Date().toISOString().slice(0, 10)

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
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

  const handleAvancement = (val: string) => {
    const n = parseInt(val, 10)
    if (isNaN(n) || n < 0 || n > 100) {
      setAvancementError('Valeur entre 0 et 100')
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

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {isEdit ? `Modifier le suivi du ${formatDateFr(editingSuivi.date)}` : `Suivi du ${formatDateFr(TODAY)}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          {/* Date (readonly for create, hidden for edit) */}
          {!isEdit && (
            <Input label="Date" type="date" value={TODAY} disabled />
          )}

          {/* Nom responsable */}
          <Input
            label="Nom du responsable"
            required
            type="text"
            value={form.nomResponsable}
            onChange={(e) => set({ nomResponsable: e.target.value })}
            placeholder="Nom et prénom du responsable de chantier"
            maxLength={150}
          />

          {/* Toggle réalisé */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Réalisation</label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden w-fit">
              <button
                type="button"
                onClick={() => set({ realise: true, motifNonRealisation: '' })}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  form.realise
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CheckCircle2 className="inline mr-1.5 h-4 w-4" />
                Réalisé
              </button>
              <button
                type="button"
                onClick={() => set({ realise: false })}
                className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  !form.realise
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <XCircle className="inline mr-1.5 h-4 w-4" />
                Non réalisé
              </button>
            </div>
          </div>

          {/* Motif (si non réalisé) */}
          {!form.realise && (
            <Textarea
              label="Motif de non-réalisation"
              required
              value={form.motifNonRealisation}
              onChange={(e) => set({ motifNonRealisation: e.target.value })}
              placeholder="Ex : Intempéries, absence intervenant..."
              rows={3}
            />
          )}

          {/* Avancement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avancement <span className="text-red-500">*</span>
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
                className="flex-1 accent-blue-600"
              />
              <AvancementBadge pct={form.avancementPourcentage} />
            </div>
          </div>

          {/* Commentaire */}
          <Textarea
            label="Commentaire"
            value={form.commentaire}
            onChange={(e) => set({ commentaire: e.target.value })}
            placeholder="Observations, remarques..."
            rows={3}
          />

          {/* API error */}
          {apiDetail && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {apiDetail.includes('doublon_date') || apiDetail.includes('doublon')
                  ? `Suivi du ${formatDateFr(TODAY)} déjà renseigné.`
                  : apiDetail.includes('evaluation_requise') || apiDetail.includes('EVALUATION_COMPLETE')
                  ? 'Évaluation des risques requise avant de saisir un suivi.'
                  : apiDetail.includes('motif')
                  ? 'Motif de non-réalisation obligatoire.'
                  : apiDetail.includes('avancement')
                  ? 'Pourcentage d\'avancement invalide (0–100).'
                  : apiDetail}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default function SuiviJournalierPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const canCreate = usePermission('suivi_journalier.create')
  const canEdit = usePermission('suivi_journalier.edit')
  const canDeleteDoc = usePermission('suivi_journalier.delete_document')

  const { data: intervention, isLoading: loadingIntervention } = useInterventionDetail(id ?? '')
  const { data: permit, isLoading: loadingPermit } = usePermitTravailDetail(
    intervention?.permitTravailId ?? '',
  )
  const { data: suivis = [], isLoading: loadingSuivis } = useInterventionSuivis(id ?? '')
  const { createSuivi, updateSuivi, uploadSuiviDocument, deleteSuiviDocument, isCreating, isUpdating, createError, updateError } =
    useSuiviJournalier(id ?? '')

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
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Chargement des suivis…
      </div>
    )
  }

  if (!intervention) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
        <AlertTriangle className="h-12 w-12 text-gray-300" />
        <p>Intervention introuvable.</p>
        <Button variant="outline" onClick={() => navigate('/interventions')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
      </div>
    )
  }

  const permit_ref = typeof intervention.permitTravail === 'object'
    ? intervention.permitTravail.reference
    : permit?.reference ?? '—'
  const permit_site = typeof intervention.permitTravail === 'object'
    ? intervention.permitTravail.codeSite
    : permit?.codeSite ?? '—'

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 text-gray-400" />
            Suivis journaliers
          </span>
        }
        description="Enregistrement journalier de l'avancement de l'intervention"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(`/interventions/${id}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'évaluation
          </Button>
        }
      />

      {/* Section 1 — Header intervention */}
      <Card>
        <CardContent className="pt-4">
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Référence permis</dt>
              <dd className="mt-1 text-sm font-semibold text-blue-700 font-mono">{permit_ref}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Site</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{permit_site}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</dt>
              <dd className="mt-1">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  {intervention.statut.replace(/_/g, ' ')}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avancement global</dt>
              <dd className="mt-1 space-y-1">
                <AvancementBadge pct={avgAvancement} />
                <div className="w-full h-1.5 rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${avgAvancement}%` }}
                  />
                </div>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Section 2 — Bouton ajouter */}
      {canCreate && !hasTodaySuivi && !showForm && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditingSuivi(null); setShowForm(true) }}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter le suivi du jour
          </Button>
        </div>
      )}

      {/* Section 3 — Formulaire inline */}
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

      {/* Section 4 — Timeline */}
      {suivis.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun suivi journalier enregistré</p>
            <p className="text-sm text-gray-400 mt-1">
              Cliquez sur "Ajouter le suivi du jour" pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {suivis.map((suivi) => {
            const isToday = suivi.date === TODAY
            return (
              <Card
                key={suivi.id}
                className={isToday ? 'border-blue-300 shadow-sm' : ''}
              >
                <CardContent className="pt-4 space-y-3">
                  {/* Row 1 — date + badges */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 capitalize">
                        {formatDateFr(suivi.date)}
                        {isToday && (
                          <span className="ml-2 text-xs font-normal text-blue-600">(aujourd'hui)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Responsable : {suivi.nomResponsable}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {suivi.realise ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          <CheckCircle2 className="h-3 w-3" />
                          Réalisé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
                          <XCircle className="h-3 w-3" />
                          Non réalisé
                        </span>
                      )}
                      <AvancementBadge pct={suivi.avancementPourcentage} />
                    </div>
                  </div>

                  {/* Motif si non réalisé */}
                  {!suivi.realise && suivi.motifNonRealisation && (
                    <p className="text-sm italic text-gray-600 border-l-2 border-orange-300 pl-3">
                      {suivi.motifNonRealisation}
                    </p>
                  )}

                  {/* Commentaire */}
                  {suivi.commentaire && (
                    <p className="text-sm text-gray-600">{suivi.commentaire}</p>
                  )}

                  {/* Documents */}
                  {(suivi.documents.length > 0 || (isToday && canEdit)) && (
                    <SuiviDocumentUploadZone
                      documents={suivi.documents}
                      onUpload={(file) => uploadSuiviDocument(suivi.id, file)}
                      onDelete={(docId) => deleteSuiviDocument(suivi.id, docId)}
                      disabled={!isToday || !canDeleteDoc}
                    />
                  )}

                  {/* Bouton modifier */}
                  {isToday && canEdit && !showForm && (
                    <div className="flex justify-end pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(suivi)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Modifier
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
