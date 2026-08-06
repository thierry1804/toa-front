import { Plus, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { InstallationRow } from '@/types/planPrevention'

interface InstallationsTableProps {
  value: InstallationRow[]
  onChange: (rows: InstallationRow[]) => void
  errors?: Record<number, string>
  readonly?: boolean
  emptyLabel?: string
}

function createEmptyRow(): InstallationRow {
  return { description: '', conditionsUtilisation: '', dateVerification: null, verifiePar: null }
}

export default function InstallationsTable({
  value,
  onChange,
  errors = {},
  readonly = false,
  emptyLabel = 'Aucune installation ajoutée.',
}: InstallationsTableProps) {
  const handleAdd = () => onChange([...value, createEmptyRow()])
  const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index))
  const handleChange = (index: number, field: keyof InstallationRow, val: string | null) => {
    onChange(value.map((row, i) => (i === index ? { ...row, [field]: val } : row)))
  }

  const colSpan = readonly ? 4 : 5

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-1/3">
                Description des installations <span className="text-red-500">*</span>
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                Conditions d'utilisation
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-36">
                Date de vérification
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-36">
                Vérifié par
              </th>
              {!readonly && <th className="px-3 py-3 w-12" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {value.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400 italic">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {value.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50 align-top">
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{row.description || '—'}</p>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleChange(index, 'description', e.target.value)}
                        placeholder="Ex. : Échafaudage mobile type Ω"
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
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{row.conditionsUtilisation || '—'}</p>
                  ) : (
                    <textarea
                      value={row.conditionsUtilisation}
                      onChange={(e) => handleChange(index, 'conditionsUtilisation', e.target.value)}
                      placeholder="Ex. : Sol stabilisé, port du casque obligatoire"
                      rows={2}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-700">{row.dateVerification || '—'}</p>
                  ) : (
                    <input
                      type="date"
                      value={row.dateVerification ?? ''}
                      onChange={(e) => handleChange(index, 'dateVerification', e.target.value || null)}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-700">{row.verifiePar || '—'}</p>
                  ) : (
                    <input
                      type="text"
                      value={row.verifiePar ?? ''}
                      onChange={(e) => handleChange(index, 'verifiePar', e.target.value || null)}
                      placeholder="Nom du vérificateur"
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
          Ajouter une installation
        </Button>
      )}
    </div>
  )
}
