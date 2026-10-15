import { useState, type ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { useAuthStore } from '@/store/auth.store'
import type { StatutPermitTravail } from '@/types/permitTravail'
import type { DangerEntry } from '@/types/permitTravail'

export type NiveauRisque = 'rouge' | 'jaune' | 'vert'
export type EvaluationData = DangerEntry

export function emptyEvaluation(): EvaluationData {
  return { dangers: '', evaluationPreliminaire: '', moyensMaitrise: '', evaluationFinale: '' }
}

interface EngagementSectionProps {
  checked: boolean
  onChange: (checked: boolean) => void
  statut?: StatutPermitTravail
  evaluations: EvaluationData[]
  onEvaluationsChange: (data: EvaluationData[]) => void
  onSaveEvaluation?: () => Promise<void>
  /** Affiche le formulaire d'évaluation des dangers (défaut : oui). */
  showEvaluation?: boolean
  /** Affiche la case d'engagement du représentant (défaut : oui). */
  showCertification?: boolean
  /** Contenu inséré sous le formulaire d'évaluation (ex. images jointes, R-22). */
  evaluationExtra?: ReactNode
  /** Message d'erreur de validation du formulaire d'évaluation. */
  evaluationError?: string | null
  /** Masque le bouton ENREGISTRER quand le formulaire hôte enregistre lui-même. */
  hideSaveButton?: boolean
}

const getNiveauOptions = (
  t: TFunction,
): {
  value: NiveauRisque
  label: string
  letter: string
  bg: string
  ring: string
  filled: string
  filledText: string
}[] => [
  { value: 'rouge', label: t('permitTravail.components.engagementSection.niveauRouge'), letter: 'R', bg: 'bg-white', ring: 'border-red-400',    filled: 'bg-red-400 border-red-400',    filledText: 'text-white' },
  { value: 'jaune', label: t('permitTravail.components.engagementSection.niveauJaune'), letter: 'J', bg: 'bg-white', ring: 'border-yellow-400', filled: 'bg-yellow-400 border-yellow-400', filledText: 'text-gray-900' },
  { value: 'vert',  label: t('permitTravail.components.engagementSection.niveauVert'),  letter: 'V', bg: 'bg-white', ring: 'border-green-500',  filled: 'bg-green-500 border-green-500', filledText: 'text-white' },
]

interface NiveauPickerProps {
  label: string
  value: NiveauRisque | ''
  onChange: (v: NiveauRisque) => void
  disabled?: boolean
}

function NiveauPicker({ label, value, onChange, disabled }: NiveauPickerProps) {
  const { t } = useTranslation()
  const niveauOptions = getNiveauOptions(t)
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {niveauOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            aria-label={t('permitTravail.components.engagementSection.niveauAriaLabel', { level: opt.label })}
            aria-pressed={value === opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
              value === opt.value ? `${opt.filled} ${opt.filledText}` : `${opt.bg} ${opt.ring} text-gray-500`
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}`}
          >
            {opt.letter}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function EngagementSection({
  checked,
  onChange,
  statut,
  evaluations,
  onEvaluationsChange,
  onSaveEvaluation,
  showEvaluation = true,
  showCertification = true,
  evaluationExtra,
  evaluationError,
  hideSaveButton = false,
}: EngagementSectionProps) {
  const { t } = useTranslation()
  const readonly = statut !== undefined && statut !== 'BROUILLON'
  const authUser = useAuthStore((s) => s.user)

  const nomRepresentant = authUser
    ? `${authUser.prenom ?? ''} ${authUser.nom}`.trim() || authUser.email
    : ''

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const handleSave = async () => {
    if (!onSaveEvaluation) return
    setSaving(true)
    setSaved(false)
    setSaveError(false)
    try {
      await onSaveEvaluation()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 4000)
    } finally {
      setSaving(false)
    }
  }

  const updateEntry = (index: number, patch: Partial<EvaluationData>) => {
    onEvaluationsChange(evaluations.map((e, i) => (i === index ? { ...e, ...patch } : e)))
  }

  const addEntry = () => {
    onEvaluationsChange([...evaluations, emptyEvaluation()])
  }

  const removeEntry = (index: number) => {
    onEvaluationsChange(evaluations.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">

      {/* ── Questionnaire évaluation (répéteur) ── */}
      {showEvaluation && (
      <div className="space-y-3">
        {evaluations.map((evaluation, index) => (
          <div key={index} className="rounded-lg border border-red-300 bg-white p-4 space-y-1">
            {evaluations.length > 1 && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Danger {index + 1}
                </span>
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => removeEntry(index)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                )}
              </div>
            )}

            {/* Dangers */}
            <div className="border-b border-gray-200 pb-2">
              <textarea
                value={evaluation.dangers}
                onChange={(e) => updateEntry(index, { dangers: e.target.value })}
                disabled={readonly}
                placeholder={t('permitTravail.components.engagementSection.dangersPlaceholder')}
                rows={2}
                className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:bg-transparent disabled:text-gray-600"
              />
            </div>

            <NiveauPicker
              label={t('permitTravail.components.engagementSection.evaluationPreliminaireLabel')}
              value={evaluation.evaluationPreliminaire}
              onChange={(v) => updateEntry(index, { evaluationPreliminaire: v })}
              disabled={readonly}
            />

            {/* Moyens de maîtrise */}
            <div className="border-b border-gray-200 pt-1 pb-2">
              <textarea
                value={evaluation.moyensMaitrise}
                onChange={(e) => updateEntry(index, { moyensMaitrise: e.target.value })}
                disabled={readonly}
                placeholder={t('permitTravail.components.engagementSection.moyensMaitrisePlaceholder')}
                rows={2}
                className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:bg-transparent disabled:text-gray-600"
              />
            </div>

            <NiveauPicker
              label={t('permitTravail.components.engagementSection.evaluationFinaleLabel')}
              value={evaluation.evaluationFinale}
              onChange={(v) => updateEntry(index, { evaluationFinale: v })}
              disabled={readonly}
            />
          </div>
        ))}

        {!readonly && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={addEntry}
              className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un danger
            </button>

            {!hideSaveButton && (
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-1.5 text-sm font-semibold uppercase tracking-wide rounded transition-colors disabled:cursor-not-allowed ${
                  saved
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : saveError
                    ? 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                {saving
                  ? t('permitTravail.components.engagementSection.saveButtonSaving')
                  : saved
                    ? t('permitTravail.components.engagementSection.saveButtonSaved')
                    : saveError
                      ? t('permitTravail.components.engagementSection.saveButtonError')
                      : t('permitTravail.components.engagementSection.saveButtonDefault')}
              </button>
              {saveError && (
                <p className="text-xs text-red-600">
                  {t('permitTravail.components.engagementSection.saveErrorText')}
                </p>
              )}
            </div>
            )}
          </div>
        )}

        {evaluationExtra}

        {evaluationError && (
          <p className="text-xs font-medium text-red-600" role="alert">{evaluationError}</p>
        )}
      </div>
      )}

      {/* ── Checkbox engagement ── */}
      {showCertification && (
      <div
        className={`flex items-start gap-3 rounded-lg border-2 p-4 transition-colors ${
          readonly
            ? 'border-gray-200 bg-gray-50'
            : checked
            ? 'border-blue-400 bg-blue-50'
            : 'border-dashed border-gray-300 bg-white hover:border-gray-400'
        }`}
      >
        <input
          id="engagement-checkbox"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={readonly}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:cursor-not-allowed"
        />
        <label
          htmlFor="engagement-checkbox"
          className={`text-sm leading-relaxed select-none ${
            readonly ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer text-gray-800'
          }`}
        >
          {t('permitTravail.components.engagementSection.certifyPrefix')}{' '}
          <span className="font-semibold">
            {nomRepresentant || t('permitTravail.components.engagementSection.defaultPrestataire')}
          </span>{' '}
          {t('permitTravail.components.engagementSection.certifySuffix')}
        </label>
      </div>
      )}

    </div>
  )
}
