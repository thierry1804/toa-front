import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import type { EquipementRow } from '@/types/planPrevention'

interface EquipementsTableProps {
  value: EquipementRow[]
  onChange: (rows: EquipementRow[]) => void
  errors?: Record<number, string>
  readonly?: boolean
  emptyLabel?: string
  /** R-09 : bloc « Photo » (une photo par ligne), affiché si fourni. */
  renderPhoto?: (row: EquipementRow, index: number) => ReactNode
}

function createEmptyRow(): EquipementRow {
  return { description: '', conditionsUtilisation: '', dateVerification: null, verifiePar: null }
}

export default function EquipementsTable({
  value,
  onChange,
  errors = {},
  readonly = false,
  emptyLabel = 'Aucun équipement ajouté.',
  renderPhoto,
}: EquipementsTableProps) {
  const handleAdd = () => onChange([...value, createEmptyRow()])
  const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index))
  const handleChange = (index: number, field: keyof EquipementRow, val: string | null) => {
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: val } : row)))
  }

  if (value.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 text-center text-sm italic text-gray-400">
          {emptyLabel}
        </div>
        {!readonly && (
          <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
            <Plus className="mr-1.5 h-4 w-4" />
            Ajouter un équipement
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        {value.map((row, index) => (
          <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Équipement {index + 1}
              </span>
              {!readonly && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="rounded p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              {readonly ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Description du matériel/équipement/outillage
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-900">
                    {row.description || '—'}
                  </p>
                </div>
              ) : (
                <Input
                  label="Description du matériel/équipement/outillage"
                  required
                  value={row.description}
                  onChange={(e) => handleChange(index, 'description', e.target.value)}
                  placeholder="Ex. : Perceuse sans fil + mèches Ø10"
                  error={errors[index]}
                />
              )}

              {readonly ? (
                <div>
                  <p className="text-sm font-medium text-gray-700">Conditions d'utilisation</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                    {row.conditionsUtilisation || '—'}
                  </p>
                </div>
              ) : (
                <Textarea
                  label="Conditions d'utilisation"
                  value={row.conditionsUtilisation}
                  onChange={(e) => handleChange(index, 'conditionsUtilisation', e.target.value)}
                  placeholder="Ex. : Vérification avant chaque utilisation"
                  rows={2}
                />
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  {readonly ? (
                    <>
                      <p className="text-sm font-medium text-gray-700">Date de vérification</p>
                      <p className="mt-1 text-sm text-gray-700">{row.dateVerification || '—'}</p>
                    </>
                  ) : (
                    <Input
                      type="date"
                      label="Date de vérification"
                      value={row.dateVerification ?? ''}
                      onChange={(e) => handleChange(index, 'dateVerification', e.target.value || null)}
                    />
                  )}
                </div>
                <div>
                  {readonly ? (
                    <>
                      <p className="text-sm font-medium text-gray-700">Vérifié par</p>
                      <p className="mt-1 text-sm text-gray-700">{row.verifiePar || '—'}</p>
                    </>
                  ) : (
                    <Input
                      label="Vérifié par"
                      value={row.verifiePar ?? ''}
                      onChange={(e) => handleChange(index, 'verifiePar', e.target.value || null)}
                      placeholder="Nom du vérificateur"
                    />
                  )}
                </div>
                {renderPhoto && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-700">Photo</p>
                    {renderPhoto(row, index)}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!readonly && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un équipement
        </Button>
      )}
    </div>
  )
}
