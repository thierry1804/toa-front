import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

function getNiveauTone(niveau: number): string {
  if (niveau >= 15) return 'bg-red-100 text-red-800 border-red-200'
  if (niveau >= 8) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-green-100 text-green-800 border-green-200'
}

function defaultRow(tacheId: string, localId: string): RisqueRow {
  return {
    localId,
    tachePlanifieeId: tacheId,
    description: '',
    categorieIds: [],
    gravite: 1,
    probabilite: 1,
    mesuresPreventives: '',
    risqueResiduel: null,
  }
}

function ScaleSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full rounded-md border border-gray-300 bg-white px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
      >
        {SCALE_OPTIONS.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  )
}

export default function AnalyseRisquesPlanning({
  sections,
  rows,
  onChange,
  categories = [],
  disabled = false,
}: AnalyseRisquesProps) {
  const { t } = useTranslation()

  const handleChange = <K extends keyof RisqueRow>(
    localId: string,
    field: K,
    value: RisqueRow[K],
  ) => {
    onChange(rows.map((r) => (r.localId === localId ? { ...r, [field]: value } : r)))
  }

  const handleRisqueChange = (localId: string, categorieIds: string[], description: string) => {
    onChange(
      rows.map((r) => (r.localId === localId ? { ...r, categorieIds, description } : r)),
    )
  }

  const handleAddRow = (tacheId: string) => {
    onChange([...rows, defaultRow(tacheId, crypto.randomUUID())])
  }

  const handleRemoveRow = (localId: string) => {
    onChange(rows.filter((r) => r.localId !== localId))
  }

  const allTaches = sections.flatMap((s) => s.taches ?? [])

  if (sections.length === 0) {
    return (
      <p className="py-4 text-center text-sm italic text-gray-400">
        {t('planning.sections.aucune_section')}
      </p>
    )
  }

  if (allTaches.length === 0) {
    return (
      <p className="py-4 text-center text-sm italic text-gray-400">
        {t('planning.sections.aucune_tache')}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => {
        const taches = section.taches ?? []
        if (taches.length === 0) return null

        return (
          <section key={section.id} className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">{section.libelle}</h4>

            <div className="space-y-3">
              {taches.map((tache) => {
                const taskRows = rows.filter((r) => r.tachePlanifieeId === tache.id)

                return (
                  <article
                    key={tache.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-4 border-b border-gray-100 pb-3">
                      <p className="text-sm font-medium text-gray-900">{tache.tache}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {[tache.materiel, tache.qui].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {taskRows.length === 0 && (
                        <p className="text-sm italic text-gray-400">
                          Aucun risque évalué pour ce mode opératoire.
                        </p>
                      )}

                      {taskRows.map((row, index) => {
                        const niveau = getNiveau(row.gravite, row.probabilite)

                        return (
                          <div
                            key={row.localId}
                            className="space-y-4 rounded-md border border-gray-100 bg-gray-50/50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Risque {index + 1}
                              </span>
                              {!disabled && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveRow(row.localId)}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Supprimer
                                </button>
                              )}
                            </div>

                            <div>
                              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                                Risque identifié
                              </span>
                              <RisqueMultiSelect
                                categories={categories}
                                categorieIds={row.categorieIds ?? []}
                                onChange={(ids, description) =>
                                  handleRisqueChange(row.localId, ids, description)
                                }
                                disabled={disabled}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                              <ScaleSelect
                                label="Gravité (G)"
                                value={row.gravite}
                                onChange={(v) => handleChange(row.localId, 'gravite', v)}
                                disabled={disabled}
                              />
                              <ScaleSelect
                                label="Probabilité (P)"
                                value={row.probabilite}
                                onChange={(v) => handleChange(row.localId, 'probabilite', v)}
                                disabled={disabled}
                              />
                              <div>
                                <span className="mb-1 block text-xs font-medium text-gray-600">
                                  Niveau
                                </span>
                                <div
                                  className={`flex h-[38px] items-center justify-center rounded-md border text-sm font-semibold ${getNiveauTone(niveau)}`}
                                >
                                  {niveau}
                                </div>
                              </div>
                              <label className="block min-w-0">
                                <span className="mb-1 block text-xs font-medium text-gray-600">
                                  Risque résiduel
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={niveau}
                                  value={row.risqueResiduel ?? ''}
                                  onChange={(e) => {
                                    const val =
                                      e.target.value === ''
                                        ? null
                                        : Math.min(Number(e.target.value), niveau)
                                    handleChange(row.localId, 'risqueResiduel', val)
                                  }}
                                  disabled={disabled}
                                  placeholder="—"
                                  className="w-full rounded-md border border-gray-300 px-2.5 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                                />
                              </label>
                            </div>

                            <label className="block min-w-0">
                              <span className="mb-1.5 block text-xs font-medium text-gray-600">
                                Mesures préventives
                              </span>
                              <textarea
                                value={row.mesuresPreventives}
                                onChange={(e) =>
                                  handleChange(row.localId, 'mesuresPreventives', e.target.value)
                                }
                                disabled={disabled}
                                rows={3}
                                placeholder="Mesures préventives…"
                                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-600"
                              />
                            </label>
                          </div>
                        )
                      })}

                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => handleAddRow(tache.id)}
                          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-blue-400 hover:text-blue-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Ajouter un risque
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}

      <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
          &lt; 8 Faible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
          8–14 Moyen
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          ≥ 15 Élevé
        </span>
        <span className="text-gray-400">Niveau = Gravité × Probabilité</span>
      </div>
    </div>
  )
}
