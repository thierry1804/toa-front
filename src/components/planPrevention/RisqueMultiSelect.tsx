import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'
import type { CategorieRisque } from '@/types/referentiel'

interface Props {
  categories: CategorieRisque[]
  categorieIds: string[]
  onChange: (categorieIds: string[], description: string) => void
  disabled?: boolean
}

function buildDescription(byId: Map<string, CategorieRisque>, ids: string[]): string {
  return ids
    .map((id) => byId.get(id)?.nom)
    .filter((nom): nom is string => Boolean(nom))
    .join(', ')
}

export default function RisqueMultiSelect({ categories, categorieIds, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const byId = new Map(categories.map((c) => [c.id, c]))
  const roots = categories.filter((c) => !c.parentId)
  const childrenOf = (rootId: string) => categories.filter((c) => c.parentId === rootId)

  const selected = new Set(categorieIds)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const emit = (nextIds: Set<string>) => {
    const ids = [...nextIds]
    onChange(ids, buildDescription(byId, ids))
  }

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    emit(next)
  }

  const remove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selected)
    next.delete(id)
    emit(next)
  }

  const filteredRoots = roots.filter((c) => {
    if (search === '') return true
    const q = search.toLowerCase()
    if (c.nom.toLowerCase().includes(q)) return true
    return childrenOf(c.id).some((child) => child.nom.toLowerCase().includes(q))
  })

  const selectedItems = categorieIds
    .map((id) => byId.get(id))
    .filter((c): c is CategorieRisque => Boolean(c))

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 text-xs italic">—</span>
        ) : (
          selectedItems.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs px-2 py-0.5"
            >
              {c.nom}
            </span>
          ))
        )}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <div
        onClick={() => {
          setOpen(!open)
          setSearch('')
        }}
        className="min-h-[32px] w-full rounded border border-gray-300 px-1.5 py-1 text-xs cursor-pointer flex flex-wrap items-center gap-1 hover:border-gray-400 bg-white"
      >
        {selectedItems.length === 0 ? (
          <span className="text-gray-400 flex-1">Sélectionner…</span>
        ) : (
          selectedItems.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
            >
              {c.nom}
              <button
                type="button"
                onClick={(e) => remove(c.id, e)}
                className="hover:text-red-500 ml-0.5"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))
        )}
        <ChevronDown
          className={`h-3 w-3 text-gray-400 ml-auto flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-lg border border-gray-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-6 pr-2 py-1 text-xs rounded border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-y-auto py-1">
            {roots.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 italic">
                Aucune catégorie dans le référentiel
              </p>
            ) : filteredRoots.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 italic">Aucun résultat</p>
            ) : (
              filteredRoots.map((root) => {
                const children = childrenOf(root.id)
                const hasCheckedChild = children.some((child) => selected.has(child.id))
                const expanded = selected.has(root.id) || hasCheckedChild

                return (
                  <div key={root.id}>
                    <label className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.has(root.id)}
                        onChange={() => toggle(root.id)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                      />
                      <span className="text-xs font-medium text-gray-800">{root.nom}</span>
                    </label>
                    {expanded && children.length > 0 && (
                      <div className="pb-1">
                        {children.map((child) => (
                          <label
                            key={child.id}
                            className="flex items-center gap-2 pl-8 pr-3 py-1.5 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(child.id)}
                              onChange={() => toggle(child.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 flex-shrink-0"
                            />
                            <span className="text-xs text-gray-600">{child.nom}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
