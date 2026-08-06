import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { VehiculeRow } from '@/types/planPrevention'

interface VehiculesTableProps {
  value: VehiculeRow[]
  onChange: (rows: VehiculeRow[]) => void
  errors?: Record<number, string>
  readonly?: boolean
}

function createEmptyRow(): VehiculeRow {
  return { vehicule: '', chauffeur: '' }
}

export default function VehiculesTable({
  value,
  onChange,
  errors = {},
  readonly = false,
}: VehiculesTableProps) {
  const handleAdd = () => onChange([...value, createEmptyRow()])
  const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index))
  const handleChange = (index: number, field: keyof VehiculeRow, val: string) =>
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: val } : row)))

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-1/2">
                Véhicule <span className="text-xs font-normal text-gray-500">(immatriculation / description)</span>
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                Chauffeur
              </th>
              {!readonly && <th className="px-3 py-3 w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {value.length === 0 && (
              <tr>
                <td
                  colSpan={readonly ? 2 : 3}
                  className="px-4 py-8 text-center text-gray-400 italic"
                >
                  Aucun véhicule ajouté.
                </td>
              </tr>
            )}
            {value.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 align-top">
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-900">{row.vehicule || '—'}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={row.vehicule}
                        onChange={(e) => handleChange(index, 'vehicule', e.target.value)}
                        placeholder="Ex. : Toyota Hilux — MG-1234-TX"
                        className={`w-full rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors[index] ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors[index] && (
                        <p className="mt-0.5 text-xs text-red-600">{errors[index]}</p>
                      )}
                    </>
                  )}
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-900">{row.chauffeur || '—'}</p>
                  ) : (
                    <input
                      type="text"
                      value={row.chauffeur}
                      onChange={(e) => handleChange(index, 'chauffeur', e.target.value)}
                      placeholder="Ex. : Jean Rakoto"
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                {!readonly && (
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(index)}
                      className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readonly && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          Ajouter un véhicule
        </Button>
      )}
    </div>
  )
}
