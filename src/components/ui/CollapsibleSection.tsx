import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  title: string
  /** Résumé affiché sous le titre quand la section est repliée (ex. « 3 phases », « 2 / 6 documents »). */
  summary?: string
  /** Ouverte au chargement sur mobile. Sur grand écran, la section est toujours dépliée. */
  defaultOpen?: boolean
  children: ReactNode
  className?: string
}

/**
 * Section de fiche : sur mobile, un accordéon (titre + résumé toujours visibles, contenu au toucher) pour parcourir un
 * dossier long sans faire défiler tous les blocs ; dès `lg`, un bloc classique toujours déplié.
 */
export function CollapsibleSection({ title, summary, defaultOpen = false, children, className }: CollapsibleSectionProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [openOnMobile, setOpenOnMobile] = useState(defaultOpen)
  const open = isDesktop || openOnMobile
  const panelId = useId()

  return (
    <section className={cn('overflow-hidden rounded-xl border border-gray-200 bg-white', className)}>
      {isDesktop ? (
        <h2 className="px-6 pb-3 pt-6 text-base font-semibold text-gray-800">{title}</h2>
      ) : (
        <h2>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpenOnMobile((v) => !v)}
            className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-gray-50"
          >
            <span className="min-w-0">
              <span className="block text-base font-semibold text-gray-900">{title}</span>
              {summary && !open && <span className="mt-0.5 block truncate text-sm text-gray-500">{summary}</span>}
            </span>
            <ChevronDown className={cn('h-5 w-5 shrink-0 text-gray-500 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </h2>
      )}
      <div id={panelId} hidden={!open} className={cn('border-gray-100 px-4 pb-4 pt-3 lg:px-6 lg:pb-6 lg:pt-0', !isDesktop && 'border-t')}>
        {children}
      </div>
    </section>
  )
}

export default CollapsibleSection
