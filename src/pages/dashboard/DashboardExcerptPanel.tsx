import type { ReactNode } from "react";

function ExcerptSkeleton() {
  return (
    <ul className="divide-y divide-gray-100" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <li key={i} className="px-4 py-3">
          <div className="h-3.5 w-36 rounded bg-gray-200" />
          <div className="mt-2 h-2.5 w-52 rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

export function DashboardExcerptPanel({
  title,
  seeAllLabel,
  onSeeAll,
  loading,
  error,
  errorMessage,
  empty,
  emptyMessage,
  banner,
  children,
}: {
  title: string;
  seeAllLabel: string;
  onSeeAll: () => void;
  loading: boolean;
  error: boolean;
  errorMessage: string;
  empty: boolean;
  emptyMessage: string;
  banner?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h2 className="text-sm font-medium text-gray-700">{title}</h2>
        <button
          type="button"
          onClick={onSeeAll}
          className="cursor-pointer text-xs font-medium text-blue-700 hover:underline"
        >
          {seeAllLabel}
        </button>
      </div>
      {banner}
      {loading ? (
        <ExcerptSkeleton />
      ) : error ? (
        <p className="px-4 py-6 text-sm text-gray-500">{errorMessage}</p>
      ) : empty ? (
        <p className="px-4 py-6 text-sm text-gray-500">{emptyMessage}</p>
      ) : (
        children
      )}
    </div>
  );
}

export function DashboardExcerptRow({
  title,
  meta,
  badge,
  mono = true,
  onClick,
}: {
  title: string;
  meta: string;
  badge?: ReactNode;
  mono?: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500"
      >
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-medium text-gray-900 ${mono ? "font-mono" : ""}`}
          >
            {title}
          </p>
          <p className="mt-0.5 truncate text-xs text-gray-500">{meta}</p>
        </div>
        {badge}
      </button>
    </li>
  );
}
