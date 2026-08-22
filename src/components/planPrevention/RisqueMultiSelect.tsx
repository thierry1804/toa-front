import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

export default function RisqueMultiSelect({
  categories,
  categorieIds,
  onChange,
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const byId = new Map(categories.map((c) => [c.id, c]))
  const roots = categories.filter((c) => !c.parentId)
  const childrenOf = (rootId: string) => categories.filter((c) => c.parentId === rootId)
  const selected = new Set(categorieIds)

  const updatePosition = () => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const width = Math.max(rect.width, 280)
    const left = Math.min(rect.left, window.innerWidth - width - 8)
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, left),
      width,
    })
  }

  useEffect(() => {
    if (!open) return
    updatePosition()
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
      setSearch('')
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
      <div className="flex min-h-[36px] flex-wrap gap-1.5">
        {selectedItems.length === 0 ? (
          <span className="text-sm italic text-gray-400">—</span>
        ) : (
          selectedItems.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-800"
            >
              {c.nom}
            </span>
          ))
        )}
      </div>
    )
  }

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
          }}
          className="z-[80] rounded-md border border-gray-200 bg-white shadow-md"
        >
          <div className="border-b border-gray-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-md border border-gray-200 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {roots.length === 0 ? (
              <p className="px-3 py-2 text-sm italic text-gray-400">
                Aucune catégorie dans le référentiel
              </p>
            ) : filteredRoots.length === 0 ? (
              <p className="px-3 py-2 text-sm italic text-gray-400">Aucun résultat</p>
            ) : (
              filteredRoots.map((root) => {
                const children = childrenOf(root.id)
                const hasCheckedChild = children.some((child) => selected.has(child.id))
                const expanded = selected.has(root.id) || hasCheckedChild

                return (
                  <div key={root.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selected.has(root.id)}
                        onChange={() => toggle(root.id)}
                        className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600"
                      />
                      <span className="text-sm font-medium text-gray-800">{root.nom}</span>
                    </label>
                    {expanded && children.length > 0 && (
                      <div className="pb-1">
                        {children.map((child) => (
                          <label
                            key={child.id}
                            className="flex cursor-pointer items-center gap-2.5 py-1.5 pl-9 pr-3 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selected.has(child.id)}
                              onChange={() => toggle(child.id)}
                              className="h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-600">{child.nom}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="w-full">
      <div
        ref={triggerRef}
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        tabIndex={0}
        onClick={() => {
          setOpen((v) => !v)
          setSearch('')
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
            setSearch('')
          }
        }}
        className="flex min-h-[40px] w-full cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-2.5 py-2 text-left text-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {selectedItems.length === 0 ? (
            <span className="text-gray-400">Sélectionner…</span>
          ) : (
            selectedItems.map((c) => (
              <span
                key={c.id}
                className="inline-flex max-w-full items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-800"
              >
                <span className="truncate">{c.nom}</span>
                <button
                  type="button"
                  onClick={(e) => remove(c.id, e)}
                  className="shrink-0 rounded p-0.5 text-blue-600 hover:bg-blue-100 hover:text-red-600"
                  aria-label={`Retirer ${c.nom}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>
      {menu}
    </div>
  )
}
