import type { HTMLAttributes, ReactNode, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Tableau pleine largeur — padding interne uniforme, sans marge sur le conteneur. */
export function ListTable({
  className,
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table className={cn('w-full border-collapse text-sm', className)} {...props}>
      {children}
    </table>
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
        actions && 'w-[1%] whitespace-nowrap text-right',
        compact && !actions && 'w-[1%] whitespace-nowrap',
        !actions && !compact && 'break-words',
        className,
      )}
      {...props}
    />
  )
}

/** Padding conteneur standard pour barres de filtres */
export const listFiltersContainerClass = 'px-4 py-2'

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
