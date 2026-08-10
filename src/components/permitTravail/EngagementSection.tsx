import { useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import type { StatutPermitTravail } from '@/types/permitTravail'

export type NiveauRisque = 'rouge' | 'jaune' | 'vert'

export interface EvaluationData {
  dangers: string
  evaluationPreliminaire: NiveauRisque | ''
  moyensMaitrise: string
  evaluationFinale: NiveauRisque | ''
}

interface EngagementSectionProps {
  checked: boolean
  onChange: (checked: boolean) => void
  statut?: StatutPermitTravail
  evaluation: EvaluationData
  onEvaluationChange: (data: EvaluationData) => void
  onSaveEvaluation?: () => Promise<void>
}

const NIVEAU_OPTIONS: { value: NiveauRisque; bg: string; ring: string; filled: string }[] = [
  { value: 'rouge', bg: 'bg-white', ring: 'border-red-400',    filled: 'bg-red-400 border-red-400' },
  { value: 'jaune', bg: 'bg-white', ring: 'border-yellow-400', filled: 'bg-yellow-400 border-yellow-400' },
  { value: 'vert',  bg: 'bg-white', ring: 'border-green-500',  filled: 'bg-green-500 border-green-500' },
]

interface NiveauPickerProps {
  label: string
  value: NiveauRisque | ''
  onChange: (v: NiveauRisque) => void
  disabled?: boolean
}

function NiveauPicker({ label, value, onChange, disabled }: NiveauPickerProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600 flex-1">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {NIVEAU_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(opt.value)}
            className={`h-6 w-6 rounded-full border-2 transition-all focus:outline-none ${
              value === opt.value ? opt.filled : `${opt.bg} ${opt.ring}`
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function EngagementSection({
  checked,
  onChange,
  statut,
  evaluation,
  onEvaluationChange,
  onSaveEvaluation,
}: EngagementSectionProps) {
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

  return (
    <div className="space-y-4">

      {/* ── Questionnaire évaluation ── */}
      <div className="rounded-lg border border-red-300 bg-white p-4 space-y-1">
        {/* Dangers */}
        <div className="border-b border-gray-200 pb-2">
          <textarea
            value={evaluation.dangers}
            onChange={(e) => onEvaluationChange({ ...evaluation, dangers: e.target.value })}
            disabled={readonly}
            placeholder="Quels sont les dangers?"
            rows={2}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:bg-transparent disabled:text-gray-600"
          />
        </div>

        <NiveauPicker
          label="Évaluation préliminaire des risques"
          value={evaluation.evaluationPreliminaire}
          onChange={(v) => onEvaluationChange({ ...evaluation, evaluationPreliminaire: v })}
          disabled={readonly}
        />

        {/* Moyens de maîtrise */}
        <div className="border-b border-gray-200 pt-1 pb-2">
          <textarea
            value={evaluation.moyensMaitrise}
            onChange={(e) => onEvaluationChange({ ...evaluation, moyensMaitrise: e.target.value })}
            disabled={readonly}
            placeholder="Quels sont les moyens de maîtriser les dangers en sécurité?"
            rows={2}
            className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none disabled:bg-transparent disabled:text-gray-600"
          />
        </div>

        <NiveauPicker
          label="Évaluation finale des risques"
          value={evaluation.evaluationFinale}
          onChange={(v) => onEvaluationChange({ ...evaluation, evaluationFinale: v })}
          disabled={readonly}
        />

        {/* Bouton enregistrer */}
        {!readonly && (
          <div className="pt-2 flex flex-col items-center gap-1">
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
              {saving ? 'Enregistrement…' : saved ? '✓ Enregistré' : saveError ? 'Erreur — réessayer' : 'Enregistrer'}
            </button>
            {saveError && (
              <p className="text-xs text-red-600">Impossible de sauvegarder. Vérifiez votre connexion.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Checkbox engagement ── */}
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
          Je soussigné(e){' '}
          <span className="font-semibold">{nomRepresentant || 'le prestataire'}</span>{' '}
          certifie l'exactitude des informations et m'engage à respecter ces obligations HSSES.
        </label>
      </div>

    </div>
  )
}
