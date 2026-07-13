import type { StatutPermitTravail } from '@/types/permitTravail'

const ENGAGEMENTS_HSSES = [
  "Respecter les consignes de sécurité et les procédures HSE du site",
  "Porter les équipements de protection individuelle (EPI) obligatoires pendant toute la durée des travaux",
  "Signaler immédiatement tout incident, accident ou quasi-accident à l'équipe HSE",
  "Ne pas entreprendre de travaux non prévus au permis sans autorisation préalable",
  "Respecter strictement les zones de travail délimitées et les périmètres de sécurité",
  "Assurer la formation et la sensibilisation de tous les intervenants aux risques identifiés",
  "Maintenir le chantier propre, ordonné et sécurisé à tout moment",
  "S'assurer que le matériel et les équipements utilisés sont conformes et vérifiés avant utilisation",
]

interface EngagementSectionProps {
  nomPrestataire?: string | null
  checked: boolean
  onChange: (checked: boolean) => void
  statut?: StatutPermitTravail
}

export default function EngagementSection({
  nomPrestataire,
  checked,
  onChange,
  statut,
}: EngagementSectionProps) {
  const readonly = statut !== undefined && statut !== 'BROUILLON'

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Engagements HSSES</h3>
        <ul className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          {ENGAGEMENTS_HSSES.map((engagement, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-0.5 flex-shrink-0 font-semibold text-blue-600">{i + 1}.</span>
              <span>{engagement}</span>
            </li>
          ))}
        </ul>
      </div>

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
          <span className="font-semibold">{nomPrestataire ?? 'le prestataire'}</span>{' '}
          m'engage à respecter l'ensemble de ces obligations HSSES pendant toute la durée
          des travaux couverts par ce permis de travail.
        </label>
      </div>
    </div>
  )
}
