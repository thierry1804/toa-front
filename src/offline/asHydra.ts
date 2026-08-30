import type { HydraCollection } from '@/types'

export function asHydra<T>(member: T[], totalItems = member.length): HydraCollection<T> {
  return {
    '@context': '/api/contexts/offline-snapshot',
    '@id': '/api/offline/snapshot',
    '@type': 'hydra:Collection',
    member,
    totalItems,
  }
}

export function hydraMember<T>(data: unknown): T[] {
  if (!data || typeof data !== 'object') return []
  const record = data as Record<string, unknown>
  const member = record.member ?? record['hydra:member']
  return Array.isArray(member) ? (member as T[]) : []
}

export function hydraTotalItems(data: unknown, fallback: number): number {
  if (!data || typeof data !== 'object') return fallback
  const record = data as Record<string, unknown>
  const total = record.totalItems ?? record['hydra:totalItems']
  return typeof total === 'number' ? total : fallback
}

export function paginateLocal<T>(
  items: T[],
  page = 1,
  itemsPerPage = 0,
): HydraCollection<T> {
  if (!itemsPerPage || itemsPerPage <= 0) return asHydra(items)
  const start = Math.max(0, (page - 1) * itemsPerPage)
  return asHydra(items.slice(start, start + itemsPerPage), items.length)
}
