import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Tableau pleine largeur avec défilement horizontal local sur petits écrans. */
export function ListTable({
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full max-w-full overflow-x-auto">
      <table className={cn('w-full min-w-[960px] border-collapse text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

export function ListTableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-gray-50', className)} {...props} />
}

export function ListTableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-gray-100 bg-white', className)} {...props} />
}

export function ListTableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('transition-colors hover:bg-gray-50', className)} {...props} />
}

export function ListTableHeadCell({
  className,
  align = 'left',
  actions,
  compact,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  align?: 'left' | 'right'
  /** Colonne actions (icônes), alignée à droite */
  actions?: boolean
  /** Colonne étroite, une seule ligne (statut, code site…) */
  compact?: boolean
}) {
  return (
    <th
      className={cn(
        'border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600',
        align === 'right' || actions ? 'text-right' : 'text-left',
        'first:sticky first:left-0 first:z-20 first:bg-gray-50 first:shadow-[2px_0_4px_rgba(0,0,0,0.08)]',
        actions && 'sticky right-0 z-20 bg-gray-50 shadow-[-2px_0_4px_rgba(0,0,0,0.08)]',
        (actions || compact) && 'w-[1%] whitespace-nowrap',
        className,
      )}
      {...props}
    />
  )
}

export function ListTableCell({
  className,
  actions,
  compact,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & {
  actions?: boolean
  compact?: boolean
}) {
  return (
    <td
      className={cn(
        'px-4 py-3 align-top',
        'first:sticky first:left-0 first:z-10 first:bg-white first:shadow-[2px_0_4px_rgba(0,0,0,0.08)]',
        actions && 'sticky right-0 z-10 w-[1%] whitespace-nowrap bg-white text-right shadow-[-2px_0_4px_rgba(0,0,0,0.08)]',
        compact && !actions && 'w-[1%] whitespace-nowrap',
        !actions && !compact && 'break-words',
        className,
      )}
      {...props}
    />
  )
}

/** Contrôle standard des barres de filtres : hauteur uniforme et surface plate. */
export const listFilterControlClass = 'h-11 min-h-11 shadow-none'

/** Padding et apparence standard des contrôles dans les barres de filtres. */
export const listFiltersContainerClass = cn(
  'px-4 py-2',
  '[&_input]:h-11 [&_input]:min-h-11 [&_input]:shadow-none',
  '[&_select]:h-11 [&_select]:min-h-11 [&_select]:shadow-none',
)

export function ListTableFilters({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2 border-b border-gray-200 md:grid-cols-3',
        listFiltersContainerClass,
      )}
    >
      {children}
    </div>
  )
}

export function ListTableActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-0.5">{children}</div>
}
