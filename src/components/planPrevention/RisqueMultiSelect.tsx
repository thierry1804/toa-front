import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X, Search } from 'lucide-react'
import type { CategorieRisque } from '@/types/referentiel'

interface Props {
  categories: CategorieRisque[]
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

function parseValue(value: string): string[] {
  return value ? value.split(', ').filter(Boolean) : []
}

export default function RisqueMultiSelect({ categories, value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = new Set(parseValue(value))

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

  const toggle = (nom: string) => {
    const next = new Set(selected)
    if (next.has(nom)) next.delete(nom)
    else next.add(nom)
    onChange([...next].join(', '))
  }

  const remove = (nom: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selected)
    next.delete(nom)
    onChange([...next].join(', '))
  }

  const filtered = categories.filter((c) =>
    c.nom.toLowerCase().includes(search.toLowerCase()),
  )

  if (disabled) {
    return (
      <div className="flex flex-wrap gap-1 min-h-[28px]">
        {selected.size === 0 ? (
          <span className="text-gray-400 text-xs italic">—</span>
        ) : (
          [...selected].map((nom) => (
            <span
              key={nom}
              className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs px-2 py-0.5"
            >
              {nom}
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
        {selected.size === 0 ? (
          <span className="text-gray-400 flex-1">Sélectionner…</span>
        ) : (
          [...selected].map((nom) => (
            <span
              key={nom}
              className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 text-blue-800 text-xs px-1.5 py-0.5"
            >
              {nom}
              <button
                type="button"
                onClick={(e) => remove(nom, e)}
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
        <div className="absolute left-0 top-full mt-1 z-50 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
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
          <div className="max-h-48 overflow-y-auto py-1">
            {categories.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 italic">
                Aucune catégorie dans le référentiel
              </p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400 italic">Aucun résultat</p>
            ) : (
              filtered.map((cat) => (
                <label
                  key={cat.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(cat.nom)}
                    onChange={() => toggle(cat.nom)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 flex-shrink-0"
                  />
                  <span className="text-xs text-gray-800">{cat.nom}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
