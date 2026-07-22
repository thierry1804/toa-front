import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import NiveauRisqueBadge from './NiveauRisqueBadge'
import type { EvaluationRisque, EvaluationRisqueInput } from '@/types/intervention'

const SCALE = [1, 2, 3, 4, 5] as const

interface EvaluationRisqueTableProps {
  risques: EvaluationRisque[]
  highlightNonReevalues?: boolean
  disabled?: boolean
  onUpdate: (risqueId: string, data: EvaluationRisqueInput) => Promise<void>
}

interface RowState {
  gravite: number
  probabilite: number
  mesuresConfirmees: string
}

function computeNiveau(gravite: number, probabilite: number): number {
  return gravite * probabilite
}

export default function EvaluationRisqueTable({
  risques,
  highlightNonReevalues = false,
  disabled = false,
  onUpdate,
}: EvaluationRisqueTableProps) {
  const [localState, setLocalState] = useState<Record<string, RowState>>(() => {
    const init: Record<string, RowState> = {}
    for (const r of risques) {
      init[r.id] = {
        gravite: r.gravite,
        probabilite: r.probabilite,
        mesuresConfirmees: r.mesuresConfirmees ?? '',
      }
    }
    return init
  })

  const getRow = (r: EvaluationRisque): RowState =>
    localState[r.id] ?? {
      gravite: r.gravite,
      probabilite: r.probabilite,
      mesuresConfirmees: r.mesuresConfirmees ?? '',
    }

  const handleChange = (id: string, field: keyof RowState, value: string | number) => {
    setLocalState((prev) => ({
      ...prev,
      [id]: { ...prev[id]!, [field]: value },
    }))
  }

  const handleBlur = async (risque: EvaluationRisque) => {
    const row = getRow(risque)
    await onUpdate(risque.id, {
      gravite: row.gravite,
      probabilite: row.probabilite,
      mesuresConfirmees: row.mesuresConfirmees || null,
    })
  }

  if (risques.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 px-6 py-10 text-center text-sm text-gray-400 italic">
        Aucun risque importé depuis le plan de prévention.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left font-medium text-gray-700 w-1/4">Description du risque</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700 w-24">Gravité</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700 w-28">Probabilité</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700 w-32">Niveau risque</th>
            <th className="px-3 py-3 text-left font-medium text-gray-700">Mesures confirmées</th>
            <th className="px-3 py-3 text-center font-medium text-gray-700 w-24">Réévalué</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {risques.map((risque) => {
            const row = getRow(risque)
            const niveau = computeNiveau(row.gravite, row.probabilite)
            const isNonReevalue = !risque.estReevalue
            const rowBg = highlightNonReevalues && isNonReevalue
              ? 'bg-red-50'
              : isNonReevalue
                ? 'bg-yellow-50/60'
                : ''

            return (
              <tr key={risque.id} className={rowBg}>
                <td className="px-3 py-3 text-gray-700 align-top">
                  <span className="text-sm leading-relaxed">{risque.description}</span>
                </td>

                <td className="px-3 py-2 text-center align-middle">
                  <select
                    value={row.gravite}
                    disabled={disabled}
                    onChange={(e) => handleChange(risque.id, 'gravite', Number(e.target.value))}
                    onBlur={() => void handleBlur(risque)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    {SCALE.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2 text-center align-middle">
                  <select
                    value={row.probabilite}
                    disabled={disabled}
                    onChange={(e) => handleChange(risque.id, 'probabilite', Number(e.target.value))}
                    onBlur={() => void handleBlur(risque)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                  >
                    {SCALE.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </td>

                <td className="px-3 py-2 text-center align-middle">
                  <NiveauRisqueBadge niveauRisque={niveau} />
                </td>

                <td className="px-3 py-2 align-middle">
                  <textarea
                    value={row.mesuresConfirmees}
                    disabled={disabled}
                    rows={2}
                    placeholder="Mesures confirmées sur site..."
                    onChange={(e) => handleChange(risque.id, 'mesuresConfirmees', e.target.value)}
                    onBlur={() => void handleBlur(risque)}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                  />
                </td>

                <td className="px-3 py-2 text-center align-middle">
                  {risque.estReevalue ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                      <CheckCircle className="h-4 w-4" />
                      Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                      <XCircle className="h-4 w-4" />
                      Non
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
          &lt;8 Faible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-yellow-400" />
          8–14 Modéré
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
          ≥15 Élevé
        </span>
      </div>
    </div>
  )
}
