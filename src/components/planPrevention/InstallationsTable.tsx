import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Search, X, ChevronDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import type { InstallationRow } from '@/types/planPrevention'
import { referentielApi } from '@/api/referentielApi'

interface InstallationsTableProps {
  value: InstallationRow[]
  onChange: (rows: InstallationRow[]) => void
  errors?: Record<number, string>
  readonly?: boolean
  emptyLabel?: string
}

export default function InstallationsTable({
  value,
  onChange,
  readonly = false,
  emptyLabel = 'Aucune installation ajoutée.',
}: InstallationsTableProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: ['referentiel', 'installations-equipements', 'all'],
    queryFn: () => referentielApi.getAllInstallationsEquipements(),
    staleTime: 5 * 60 * 1000,
    enabled: !readonly,
  })

  const allItems = data?.member ?? []
  const existingNames = new Set(value.map((r) => r.description))

  const filtered = allItems.filter(
    (item) =>
      !existingNames.has(item.nom) &&
      (search === '' || item.nom.toLowerCase().includes(search.toLowerCase())),
  )

  const addItem = (nom: string) => {
    onChange([...value, { description: nom, conditionsUtilisation: '' }])
    setSearch('')
  }

  const handleRemove = (index: number) => onChange(value.filter((_, i) => i !== index))

  const handleConditionsChange = (index: number, val: string) => {
    onChange(value.map((row, i) => (i === index ? { ...row, conditionsUtilisation: val } : row)))
  }

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const colSpan = readonly ? 2 : 3

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3 text-left font-medium text-gray-700 w-2/5">
                Installation / Outillage
              </th>
              <th className="px-3 py-3 text-left font-medium text-gray-700">
                Conditions d'utilisation
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
                <td className="px-3 py-2.5">
                  <span className="text-sm font-medium text-gray-900">{row.description || '—'}</span>
                </td>
                <td className="px-3 py-2">
                  {readonly ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {row.conditionsUtilisation || '—'}
                    </p>
                  ) : (
                    <textarea
                      value={row.conditionsUtilisation}
                      onChange={(e) => handleConditionsChange(index, e.target.value)}
                      placeholder="Ex. : Sol stabilisé, port du casque obligatoire"
                      rows={2}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
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
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen((o) => !o)
              setSearch('')
            }}
            className="flex items-center gap-1.5 rounded border border-dashed border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter des installations
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-30 mt-1 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
              <div className="p-2 border-b border-gray-100">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full rounded border border-gray-200 pl-8 pr-7 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                    >
                      <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-gray-400 italic">
                    {allItems.length === 0
                      ? 'Aucune installation dans le référentiel'
                      : 'Aucun résultat'}
                  </p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => addItem(item.nom)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                      {item.nom}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
