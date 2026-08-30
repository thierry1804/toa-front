/** API Platform order: newest records first. Applied last so it cannot be overridden. */
export const ORDER_NEWEST_FIRST = { 'order[createdAt]': 'desc' } as const

type ListParams = Record<string, string | number | boolean | string[] | undefined>

export function withNewestFirst<T extends ListParams>(params?: T): T & typeof ORDER_NEWEST_FIRST {
  return { ...(params ?? {}), ...ORDER_NEWEST_FIRST } as T & typeof ORDER_NEWEST_FIRST
}

export function byDateDesc(a?: string | null, b?: string | null): number {
  return (b ?? '').localeCompare(a ?? '')
}

export function sortNewestFirst<T extends { createdAt?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => byDateDesc(a.createdAt, b.createdAt))
}

export function sortByDateDesc<T>(items: T[], getDate: (item: T) => string | null | undefined): T[] {
  return [...items].sort((a, b) => byDateDesc(getDate(a), getDate(b)))
}
