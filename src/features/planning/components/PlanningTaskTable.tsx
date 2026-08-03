import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import type { TaskRow } from '@/types'

interface Props {
  value: TaskRow[]
  onChange: (rows: TaskRow[]) => void
  readonly?: boolean
}

function createEmptyRow(): TaskRow {
  return { localId: crypto.randomUUID(), tache: '', materiel: '', qui: '' }
}

export default function PlanningTaskTable({ value, onChange, readonly = false }: Props) {
  const { t } = useTranslation()

  const handleAdd = () => onChange([...value, createEmptyRow()])

  const handleRemove = (localId: string) =>
    onChange(value.filter((r) => r.localId !== localId))

  const handleChange = <K extends keyof TaskRow>(localId: string, field: K, val: TaskRow[K]) =>
    onChange(value.map((r) => (r.localId === localId ? { ...r, [field]: val } : r)))

  const colSpan = readonly ? 3 : 4

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700 w-2/5">
                {t('planning.sections.col_tache')} *
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 w-1/4">
                {t('planning.sections.col_materiel')}
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 w-1/4">
                {t('planning.sections.col_qui')}
              </th>
              {!readonly && <th className="px-3 py-2 w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {value.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-400 italic text-xs">
                  {t('planning.sections.aucune_tache')}
                </td>
              </tr>
            )}
            {value.map((row) => (
              <tr key={row.localId} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  {readonly ? (
                    <span className="text-gray-900">{row.tache || '—'}</span>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={row.tache}
                        onChange={(e) => handleChange(row.localId, 'tache', e.target.value)}
                        placeholder={t('planning.sections.col_tache')}
                        className={`w-full rounded border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          !row.tache.trim() ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {!row.tache.trim() && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {t('planning.sections.col_tache')} requis
                        </p>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <span className="text-gray-700">{row.materiel || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={row.materiel}
                      onChange={(e) => handleChange(row.localId, 'materiel', e.target.value)}
                      placeholder={t('planning.sections.col_materiel')}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <span className="text-gray-700">{row.qui || '—'}</span>
                  ) : (
                    <input
                      type="text"
                      value={row.qui}
                      onChange={(e) => handleChange(row.localId, 'qui', e.target.value)}
                      placeholder={t('planning.sections.col_qui')}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </td>
                {!readonly && (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(row.localId)}
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t('planning.sections.ajouter_ligne')}
        </Button>
      )}
    </div>
  )
}
