import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { RisqueRow } from '@/types/planPrevention'

interface RisqueMatriceProps {
  rows: RisqueRow[]
  onChange: (rows: RisqueRow[]) => void
  disabled?: boolean
}

function getNiveauRisque(gravite: number, probabilite: number): number {
  return gravite * probabilite
}

function getRisqueColor(niveau: number): string {
  if (niveau >= 15) return 'bg-red-100 text-red-800 font-semibold'
  if (niveau >= 8) return 'bg-orange-100 text-orange-800 font-semibold'
  return 'bg-green-100 text-green-800 font-semibold'
}

const GRAVITE_OPTIONS = [1, 2, 3, 4, 5]

function createEmptyRow(): RisqueRow {
  return {
    localId: crypto.randomUUID(),
    description: '',
    gravite: 1,
    probabilite: 1,
    mesuresPreventives: '',
  }
}

export default function RisqueMatrice({ rows, onChange, disabled = false }: RisqueMatriceProps) {
  const handleAdd = () => {
    onChange([...rows, createEmptyRow()])
  }

  const handleRemove = (localId: string) => {
    onChange(rows.filter((r) => r.localId !== localId))
  }

  const handleChange = <K extends keyof RisqueRow>(
    localId: string,
    field: K,
    value: RisqueRow[K],
  ) => {
    onChange(rows.map((r) => (r.localId === localId ? { ...r, [field]: value } : r)))
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-1/3">
                Description du risque
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-700 w-24">
                Gravité (1-5)
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-700 w-28">
                Probabilité (1-5)
              </th>
              <th className="px-3 py-3 text-center font-medium text-gray-700 w-28">
                Niveau risque
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                Mesures préventives
              </th>
              {!disabled && (
                <th className="px-3 py-3 w-12" />
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={disabled ? 5 : 6}
                  className="px-4 py-8 text-center text-gray-400 italic"
                >
                  Aucun risque ajouté. Cliquez sur "Ajouter un risque" pour commencer.
                </td>
              </tr>
            )}
            {rows.map((row) => {
              const niveau = getNiveauRisque(row.gravite, row.probabilite)
              return (
                <tr key={row.localId} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <textarea
                      value={row.description}
                      onChange={(e) => handleChange(row.localId, 'description', e.target.value)}
                      disabled={disabled}
                      rows={2}
                      placeholder="Décrivez le risque identifié..."
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={row.gravite}
                      onChange={(e) =>
                        handleChange(row.localId, 'gravite', Number(e.target.value))
                      }
                      disabled={disabled}
                      title="1 = Négligeable, 2 = Mineur, 3 = Modéré, 4 = Majeur, 5 = Catastrophique"
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      {GRAVITE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <select
                      value={row.probabilite}
                      onChange={(e) =>
                        handleChange(row.localId, 'probabilite', Number(e.target.value))
                      }
                      disabled={disabled}
                      title="1 = Rare, 2 = Peu probable, 3 = Possible, 4 = Probable, 5 = Quasi certain"
                      className="rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
                    >
                      {GRAVITE_OPTIONS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs ${getRisqueColor(niveau)}`}
                    >
                      {niveau}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      value={row.mesuresPreventives}
                      onChange={(e) =>
                        handleChange(row.localId, 'mesuresPreventives', e.target.value)
                      }
                      disabled={disabled}
                      rows={2}
                      placeholder="Décrivez les mesures préventives..."
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500 resize-none"
                    />
                  </td>
                  {!disabled && (
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => handleRemove(row.localId)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {!disabled && (
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un risque
          </Button>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-green-400" />
              &lt;8 Faible
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-orange-400" />
              8-14 Moyen
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
              ≥15 Élevé
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
