export interface ListPageSkeletonProps {
  rows?: number
  withStatStrip?: boolean
  /** Skip the outer bordered card chrome — use inside an existing Card/CardContent. */
  bare?: boolean
}

function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div className="divide-y divide-gray-100" aria-hidden="true">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <div className="h-4 w-1/4 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/6 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-1/5 animate-pulse rounded bg-gray-100" />
          <div className="h-4 w-16 animate-pulse rounded-full bg-gray-100" />
        </div>
      ))}
    </div>
  )
}

// Shared loading placeholder for list pages, replacing the mix of spinner
// and "Chargement..." text that previously differed page to page.
export function ListPageSkeleton({ rows = 6, withStatStrip = true, bare = false }: ListPageSkeletonProps) {
  if (bare) {
    return <SkeletonRows rows={rows} />
  }

  return (
    <div className="space-y-6" aria-hidden="true">
      {withStatStrip && (
        <div className="flex flex-wrap divide-x divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="min-w-[140px] flex-1 space-y-2 px-5 py-4">
              <div className="h-7 w-12 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200" />
        </div>
        <SkeletonRows rows={rows} />
      </div>
    </div>
  )
}

export default ListPageSkeleton
