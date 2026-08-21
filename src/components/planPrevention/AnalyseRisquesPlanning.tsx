import type { SectionPlanifieeItem } from '@/types'
import type { RisqueRow } from '@/types/planPrevention'
import type { CategorieRisque } from '@/types/referentiel'
import RisqueMultiSelect from './RisqueMultiSelect'

interface AnalyseRisquesProps {
  sections: SectionPlanifieeItem[]
  rows: RisqueRow[]
  onChange: (rows: RisqueRow[]) => void
  categories?: CategorieRisque[]
  disabled?: boolean
}

const SCALE_OPTIONS = [1, 2, 3, 4, 5]

function getNiveau(gravite: number, probabilite: number): number {
  return gravite * probabilite
}

function getRowBg(niveau: number): string {
  if (niveau >= 15) return 'bg-red-50'
  if (niveau >= 8) return 'bg-orange-50'
  return 'bg-green-50'
}

function getNiveauBadge(niveau: number): string {
  if (niveau >= 15) return 'bg-red-200 text-red-900 font-semibold'
  if (niveau >= 8) return 'bg-orange-200 text-orange-900 font-semibold'
  return 'bg-green-200 text-green-900 font-semibold'
}

function getEcartBadge(ecart: number): string {
  if (ecart >= 15) return 'bg-red-200 text-red-900 font-semibold'
  if (ecart >= 8) return 'bg-orange-200 text-orange-900 font-semibold'
  return 'bg-green-200 text-green-900 font-semibold'
}

function findRow(rows: RisqueRow[], tacheId: string): RisqueRow | undefined {
  return rows.find((r) => r.tachePlanifieeId === tacheId)
}

function defaultRow(tacheId: string): RisqueRow {
  return {
    localId: tacheId,
    tachePlanifieeId: tacheId,
    description: '',
    categorieIds: [],
    gravite: 1,
    probabilite: 1,
    mesuresPreventives: '',
    risqueResiduel: null,
  }
}

export default function AnalyseRisquesPlanning({
  sections,
  rows,
  onChange,
  categories = [],
  disabled = false,
}: AnalyseRisquesProps) {
  const handleChange = <K extends keyof RisqueRow>(
    tacheId: string,
    field: K,
    value: RisqueRow[K],
  ) => {
    const existing = rows.find((r) => r.tachePlanifieeId === tacheId)
    if (existing) {
      onChange(
        rows.map((r) =>
          r.tachePlanifieeId === tacheId ? { ...r, [field]: value } : r,
        ),
      )
    } else {
      onChange([...rows, { ...defaultRow(tacheId), [field]: value }])
    }
  }

  const handleRisqueChange = (tacheId: string, categorieIds: string[], description: string) => {
    const existing = rows.find((r) => r.tachePlanifieeId === tacheId)
    if (existing) {
      onChange(
        rows.map((r) =>
          r.tachePlanifieeId === tacheId ? { ...r, categorieIds, description } : r,
        ),
      )
    } else {
      onChange([...rows, { ...defaultRow(tacheId), categorieIds, description }])
    }
  }

  const allTaches = sections.flatMap((s) => s.taches ?? [])

  if (sections.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic py-4 text-center">
        Aucune tâche disponible dans cette planification.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-40">Tâche</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-28">Matériel</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-20">Qui ?</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-36">Risque identifié</th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 w-12">G</th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 w-12">P</th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 w-16">Niveau</th>
              <th className="px-2 py-2 text-left font-medium text-gray-700 w-40">Mesures préventives</th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 w-20">Risque résiduel</th>
              <th className="px-2 py-2 text-center font-medium text-gray-700 w-16">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allTaches.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-6 text-center text-gray-400 italic">
                  Aucune tâche dans cette planification.
                </td>
              </tr>
            )}
            {sections.map((section) => (
              <>
                {/* Section header */}
                <tr key={`section-${section.id}`} className="bg-gray-100">
                  <td
                    colSpan={10}
                    className="px-3 py-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    {section.libelle}
                  </td>
                </tr>
                {/* Tache rows */}
                {(section.taches ?? []).map((tache) => {
                  const row = findRow(rows, tache.id) ?? defaultRow(tache.id)
                  const niveau = getNiveau(row.gravite, row.probabilite)
                  const ecart =
                    row.risqueResiduel != null ? niveau - row.risqueResiduel : null

                  return (
                    <tr key={tache.id} className={getRowBg(niveau)}>
                      {/* Tâche — read-only */}
                      <td className="px-2 py-1.5 text-gray-900 align-top">{tache.tache}</td>
                      {/* Matériel — read-only */}
                      <td className="px-2 py-1.5 text-gray-600 align-top">{tache.materiel ?? '—'}</td>
                      {/* Qui — read-only */}
                      <td className="px-2 py-1.5 text-gray-600 align-top">{tache.qui ?? '—'}</td>
                      {/* Risque identifié */}
                      <td className="px-2 py-1.5 align-top">
                        <RisqueMultiSelect
                          categories={categories}
                          categorieIds={row.categorieIds ?? []}
                          onChange={(ids, description) => handleRisqueChange(tache.id, ids, description)}
                          disabled={disabled}
                        />
                      </td>
                      {/* G */}
                      <td className="px-2 py-1.5 text-center align-top">
                        <select
                          value={row.gravite}
                          onChange={(e) =>
                            handleChange(tache.id, 'gravite', Number(e.target.value))
                          }
                          disabled={disabled}
                          className="rounded border border-gray-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
                        >
                          {SCALE_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </td>
                      {/* P */}
                      <td className="px-2 py-1.5 text-center align-top">
                        <select
                          value={row.probabilite}
                          onChange={(e) =>
                            handleChange(tache.id, 'probabilite', Number(e.target.value))
                          }
                          disabled={disabled}
                          className="rounded border border-gray-300 px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent"
                        >
                          {SCALE_OPTIONS.map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </td>
                      {/* Niveau */}
                      <td className="px-2 py-1.5 text-center align-top">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${getNiveauBadge(niveau)}`}
                        >
                          {niveau}
                        </span>
                      </td>
                      {/* Mesures préventives */}
                      <td className="px-2 py-1.5 align-top">
                        <textarea
                          value={row.mesuresPreventives}
                          onChange={(e) =>
                            handleChange(tache.id, 'mesuresPreventives', e.target.value)
                          }
                          disabled={disabled}
                          rows={2}
                          placeholder="Mesures préventives…"
                          className="w-full rounded border border-gray-300 px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent disabled:text-gray-600 resize-none"
                        />
                      </td>
                      {/* Risque résiduel */}
                      <td className="px-2 py-1.5 text-center align-top">
                        <input
                          type="number"
                          min={0}
                          max={niveau}
                          value={row.risqueResiduel ?? ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : Math.min(Number(e.target.value), niveau)
                            handleChange(tache.id, 'risqueResiduel', val)
                          }}
                          disabled={disabled}
                          placeholder="—"
                          className="w-14 rounded border border-gray-300 px-1 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent disabled:text-gray-600"
                        />
                      </td>
                      {/* Écart */}
                      <td className="px-2 py-1.5 text-center align-top">
                        {ecart != null ? (
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs ${getEcartBadge(ecart)}`}
                          >
                            {ecart}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
          &lt;8 Faible
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
          8–14 Moyen
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
          ≥15 Élevé
        </span>
      </div>
    </div>
  )
}
