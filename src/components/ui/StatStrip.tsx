import type { ReactNode } from 'react'

export interface StatItem {
  label: string
  value: ReactNode
}

// Dense label/value strip: 2-column grid on phones, single row on wider screens.
export function StatStrip({ items }: { items: StatItem[] }) {
  const oddLastSpansTwo =
    items.length > 2 && items.length % 2 === 1

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-200 sm:flex sm:divide-y-0">
        {items.map((item, index) => (
          <div
            key={item.label}
            className={`min-h-[4.5rem] px-3 py-3 sm:min-w-[140px] sm:flex-1 sm:px-4 ${
              oddLastSpansTwo && index === items.length - 1
                ? "col-span-2 sm:col-span-1"
                : ""
            }`}
          >
            <p className="text-xs font-medium leading-snug text-gray-500">
              {item.label}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-gray-900 sm:text-lg">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StatStrip
