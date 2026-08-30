import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface StatItem {
  label: string
  value: ReactNode
  href?: string
}

export function StatStrip({ items }: { items: StatItem[] }) {
  const oddLastSpansTwo =
    items.length > 2 && items.length % 2 === 1

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 sm:flex sm:divide-y-0">
        {items.map((item, index) => {
          const spanLast =
            oddLastSpansTwo && index === items.length - 1
              ? 'col-span-2 sm:col-span-1'
              : ''
          const cellClass = cn(
            'flex min-h-[4.5rem] flex-col justify-center px-3 py-3 sm:min-w-[140px] sm:flex-1 sm:px-4',
            spanLast,
          )
          const inner = (
            <>
              <p className="text-xs font-medium leading-snug text-gray-500">
                {item.label}
              </p>
              <p className="mt-1 text-base font-semibold tabular-nums text-gray-900 sm:text-lg">
                {item.value}
              </p>
            </>
          )

          if (item.href) {
            return (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  cellClass,
                  'cursor-pointer hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                )}
              >
                {inner}
              </Link>
            )
          }

          return (
            <div key={item.label} className={cellClass}>
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default StatStrip
