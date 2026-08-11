import type { ReactNode } from 'react'

export interface StatItem {
  label: string
  value: ReactNode
}

// Flat, bordered row of label/value pairs replacing the repeated
// icon+title+number card-grid pattern (DESIGN.md bans it as decorative
// filler for what is really a single, dense strip of numbers).
export function StatStrip({ items }: { items: StatItem[] }) {
  return (
    <div className="flex flex-wrap divide-x divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
      {items.map((item) => (
        <div key={item.label} className="min-w-[140px] flex-1 px-5 py-4">
          <p className="text-2xl font-bold text-gray-900">{item.value}</p>
          <p className="mt-1 text-sm text-gray-500">{item.label}</p>
        </div>
      ))}
    </div>
  )
}

export default StatStrip
