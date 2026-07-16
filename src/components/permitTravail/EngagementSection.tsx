import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { useUser } from '@/features/users/hooks/useUsers'
import { usePlanPreventionDetail } from '@/features/planPrevention/hooks/usePlanPrevention'
import { usersApi } from '@/api/usersApi'
import type { StatutPermitTravail } from '@/types/permitTravail'

const ENGAGEMENTS_PPHSSES = [
  "La mise en œuvre efficace des mesures de prévention et de protection en matière de HSSES préalablement identifiées dans le présent plan,",
  "Déployer nos actions pour s'aligner aux dispositions réglementaires nationales et aux normes de performances IFC,",
  "Prendre en compte les bonnes pratiques internationales des industries,",
  "Transmettre à nos sous-traitants les exigences de ce PPHSSES,",
  "Respecter les clauses des Autorisations de nettoiement et Cahiers de Charges Environnementales si applicable,",
  "Fournir à TOA les informations HSSES requises jusqu'au repli chantier,",
  "Envoyer à TOA le présent PPHSSES validé avec documents d'évidences.",
]

const SITUATION_OPTIONS = ['En ville', 'Rurale', 'Sur montagne', 'Autres']

interface EngagementSectionProps {
  planPreventionId?: string | null
  checked: boolean
  onChange: (checked: boolean) => void
  statut?: StatutPermitTravail
}

interface InlineInputProps {
  value: string
  onChange: (v: string) => void
  placeholder: string
  readonly: boolean
  width?: string
}

function InlineInput({ value, onChange, placeholder, readonly, width = '140px' }: InlineInputProps) {
  if (readonly) {
    return (
      <span className="font-semibold">{value || `[${placeholder}]`}</span>
    )
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="inline-block border-b border-dashed border-blue-400 bg-transparent px-1 text-sm focus:outline-none focus:border-blue-600 placeholder-gray-400"
      style={{ minWidth: width }}
    />
  )
}

export default function EngagementSection({
  planPreventionId,
  checked,
  onChange,
  statut,
}: EngagementSectionProps) {
  const readonly = statut !== undefined && statut !== 'BROUILLON'
  const authUser = useAuthStore((s) => s.user)
  const userId = authUser ? parseInt(authUser.id, 10) : 0

  const { data: fullUser } = useUser(userId)
  const { data: plan } = usePlanPreventionDetail(planPreventionId ?? '')

  const [inlineNomSociete, setInlineNomSociete] = useState('')
  const [inlineNumeroRegistre, setInlineNumeroRegistre] = useState('')
  const [inlineSiegeSocial, setInlineSiegeSocial] = useState('')
  const [inlineQualite, setInlineQualite] = useState('')
  const [fokontany, setFokontany] = useState('')
  const [commune, setCommune] = useState('')
  const [district, setDistrict] = useState('')
  const [region, setRegion] = useState('')
  const [situation, setSituation] = useState('')
  const [sigError, setSigError] = useState(false)

  const signatureUrl = userId && fullUser?.signaturePath
    ? usersApi.signatureDownloadUrl(userId)
    : null

  const nomRepresentant = authUser
    ? `${authUser.prenom ?? ''} ${authUser.nom}`.trim() || authUser.email
    : ''
  const firstSite = plan?.sites?.[0]
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">

      {/* ── Bloc 1: Identification société ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-800 leading-relaxed">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Identification de la société
        </p>
        <p className="leading-7">
          Nous soussignés Société{' '}
          {fullUser?.entrepriseName ? (
            <span className="font-semibold">{fullUser.entrepriseName}</span>
          ) : (
            <InlineInput
              value={inlineNomSociete}
              onChange={setInlineNomSociete}
              placeholder="Nom de la société"
              readonly={readonly}
              width="160px"
            />
          )}
          , inscrite au registre du commerce sous le numéro{' '}
          {fullUser?.numeroRegistreCommerce ? (
            <span className="font-semibold">{fullUser.numeroRegistreCommerce}</span>
          ) : (
            <InlineInput
              value={inlineNumeroRegistre}
              onChange={setInlineNumeroRegistre}
              placeholder="N° registre"
              readonly={readonly}
            />
          )}{' '}
          dont le siège social est situé{' '}
          {fullUser?.siegeSocial ? (
            <span className="font-semibold">{fullUser.siegeSocial}</span>
          ) : (
            <InlineInput
              value={inlineSiegeSocial}
              onChange={setInlineSiegeSocial}
              placeholder="Siège social"
              readonly={readonly}
              width="180px"
            />
          )}
          , représentée par{' '}
          <span className="font-semibold">{nomRepresentant || '[Représentant]'}</span>
          , agissant en sa qualité de{' '}
          {fullUser?.qualiteRepresentant ? (
            <span className="font-semibold">{fullUser.qualiteRepresentant}</span>
          ) : (
            <InlineInput
              value={inlineQualite}
              onChange={setInlineQualite}
              placeholder="Qualité / fonction"
              readonly={readonly}
            />
          )}
          , dûment habilitée pour la signature du présent PPHSSES ;
        </p>
      </div>

      {/* ── Bloc 2: Détails site ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Pour le site de télécommunication objet de ce PPHSSES
        </p>
        <table className="w-full">
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap w-44">Localité</td>
              <td className="py-2">
                {plan?.localite ? (
                  <span className="font-medium">{plan.localite}</span>
                ) : planPreventionId ? (
                  <span className="text-gray-400 italic text-xs">—</span>
                ) : (
                  <span className="text-gray-400 italic text-xs">Aucun plan sélectionné</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">Fokontany</td>
              <td className="py-2">
                <InlineInput
                  value={fokontany}
                  onChange={setFokontany}
                  placeholder="Fokontany"
                  readonly={readonly}
                />
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">Commune</td>
              <td className="py-2">
                <InlineInput
                  value={commune}
                  onChange={setCommune}
                  placeholder="Commune"
                  readonly={readonly}
                />
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">District</td>
              <td className="py-2">
                <InlineInput
                  value={district}
                  onChange={setDistrict}
                  placeholder="District"
                  readonly={readonly}
                />
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">Région</td>
              <td className="py-2">
                <InlineInput
                  value={region}
                  onChange={setRegion}
                  placeholder="Région"
                  readonly={readonly}
                />
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">Coordonnées géographiques</td>
              <td className="py-2">
                {firstSite ? (
                  <span className="font-mono font-medium text-xs">
                    {firstSite.latitude.toFixed(6)}, {firstSite.longitude.toFixed(6)}
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-xs">—</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="py-2 pr-4 text-gray-500 whitespace-nowrap">Situation</td>
              <td className="py-2">
                {readonly ? (
                  <span className="font-medium">{situation || '—'}</span>
                ) : (
                  <select
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-0.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— Sélectionner —</option>
                    {SITUATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Bloc 3: Engagements officiels PPHSSES (non éditable) ── */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
        <p className="font-semibold text-gray-800 mb-2">Nous nous engageons à :</p>
        <ul className="space-y-1.5">
          {ENGAGEMENTS_PPHSSES.map((text, i) => (
            <li key={i} className="flex items-start gap-2 text-gray-700">
              <span className="mt-0.5 flex-shrink-0 text-blue-600 font-bold">•</span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Bloc 4: Signature et date ── */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm">
        <p className="text-gray-700 mb-3">
          Fait à Antananarivo, ce <span className="font-semibold">{today}</span>
        </p>
        <div className="flex flex-col items-start gap-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Signature</p>
          {signatureUrl && !sigError ? (
            <img
              src={signatureUrl}
              alt="Signature"
              className="max-h-20 max-w-xs border border-gray-200 rounded bg-white object-contain"
              onError={() => setSigError(true)}
            />
          ) : (
            <p className="text-sm text-gray-400 italic">
              Aucune signature —{' '}
              <Link
                to={authUser ? `/users/${authUser.id}/edit` : '/users'}
                className="text-blue-600 underline hover:text-blue-800"
              >
                ajoutez-en une dans votre profil
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ── Bloc 5: Checkbox engagement ── */}
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
