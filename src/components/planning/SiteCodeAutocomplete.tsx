import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/useDebounce'
import { referentielApi } from '@/api/referentielApi'

interface SiteCodeAutocompleteProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelect: (site: { codeSite: string; nomSite: string }) => void
  error?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  onBlur?: () => void
}

export default function SiteCodeAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  error,
  placeholder,
  required,
  disabled,
  onBlur,
}: SiteCodeAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const debouncedQ = useDebounce(value.trim(), 250)

  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ['referentiel', 'site-search', debouncedQ],
    queryFn: () => referentielApi.fetchSiteSearch(debouncedQ),
    enabled: debouncedQ.length >= 1,
    staleTime: 60 * 1000,
    placeholderData: (prev) => prev,
  })

  useEffect(() => {
    if (suggestions.length > 0 && value.trim().length >= 1) {
      setOpen(true)
      setHighlighted(0)
    } else {
      setOpen(false)
    }
  }, [suggestions, value])

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (site: { codeSite: string; nomSite: string }) => {
    onSelect(site)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (suggestions[highlighted]) handleSelect(suggestions[highlighted])
        break
      case 'Escape':
        setOpen(false)
        break
    }
  }

  const inputId = label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div ref={containerRef} className="w-full relative">
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {error && <p className="mb-1 text-xs font-medium text-red-600">{error}</p>}

      <div className="relative">
        <input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0 && value.trim().length >= 1) setOpen(true) }}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
          className={`block w-full rounded-lg border px-3 py-2 pr-8 text-sm text-gray-900 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
        />
        {isFetching && (
          <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg text-sm">
          {suggestions.map((site, idx) => (
            <li
              key={site.codeSite}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(site) }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                idx === highlighted ? 'bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <span className="w-28 shrink-0 font-mono text-sm font-semibold text-blue-700">
                {site.codeSite}
              </span>
              <span className="truncate text-gray-600">{site.nomSite}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
