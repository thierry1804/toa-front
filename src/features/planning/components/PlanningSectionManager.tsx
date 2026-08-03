import { ChevronUp, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '@/components/ui/Button'
import type { SectionRow } from '@/types'
import PlanningTaskTable from './PlanningTaskTable'

interface Props {
  value: SectionRow[]
  onChange: (sections: SectionRow[]) => void
  readonly?: boolean
  lang?: 'fr' | 'mg'
}

function createEmptySection(): SectionRow {
  return { localId: crypto.randomUUID(), libelle: '', libelleMg: '', taches: [] }
}

export default function PlanningSectionManager({
  value,
  onChange,
  readonly = false,
  lang = 'fr',
}: Props) {
  const { t } = useTranslation()

  const handleAdd = () => onChange([...value, createEmptySection()])

  const handleRemove = (localId: string) =>
    onChange(value.filter((s) => s.localId !== localId))

  const handleField = (localId: string, field: keyof SectionRow, val: unknown) =>
    onChange(value.map((s) => (s.localId === localId ? { ...s, [field]: val } : s)))

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= value.length) return
    const arr = [...value]
    ;[arr[index], arr[next]] = [arr[next], arr[index]]
    onChange(arr)
  }

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <p className="text-sm text-gray-400 italic py-4 text-center">
          {t('planning.sections.aucune_section')}
        </p>
      )}

      {value.map((section, idx) => (
        <div key={section.localId} className="rounded-lg border border-gray-200 bg-gray-50/40">
          {/* Section header */}
          <div className="flex items-start gap-3 px-4 pt-3 pb-2">
            {/* Reorder buttons */}
            {!readonly && (
              <div className="flex flex-col gap-0.5 mt-1 shrink-0">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === value.length - 1}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Labels */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {readonly ? (
                <p className="text-sm font-semibold text-gray-900 col-span-2">
                  {(lang === 'mg' && section.libelleMg) ? section.libelleMg : section.libelle || '—'}
                </p>
              ) : (
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t('planning.sections.nom_section')}
                    </label>
                    <input
                      type="text"
                      value={section.libelle}
                      onChange={(e) => handleField(section.localId, 'libelle', e.target.value)}
                      placeholder={t('planning.sections.nom_section')}
                      className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
              )}
            </div>

            {/* Delete */}
            {!readonly && (
              <button
                type="button"
                onClick={() => handleRemove(section.localId)}
                className="mt-1 shrink-0 rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title={t('planning.sections.supprimer_section')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Tasks */}
          <div className="px-4 pb-4">
            <PlanningTaskTable
              value={section.taches}
              onChange={(taches) => handleField(section.localId, 'taches', taches)}
              readonly={readonly}
            />
          </div>
        </div>
      ))}

      {!readonly && (
        <Button type="button" variant="outline" size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          {t('planning.sections.ajouter_section')}
        </Button>
      )}
    </div>
  )
}
