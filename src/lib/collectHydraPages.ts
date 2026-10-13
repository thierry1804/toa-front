import type { HydraCollection } from '@/types'

export async function collectPages<T extends { id: string }>(fetchPage: (page: number) => Promise<HydraCollection<T>>): Promise<T[]> {
  const items = new Map<string, T>()
  for (let page = 1; ; page++) {
    const result = await fetchPage(page)
    const previous = items.size
    result.member.forEach((item) => items.set(item.id, item))
    if (items.size >= result.totalItems) return [...items.values()]
    if (items.size === previous) throw new Error('Incomplete collection')
  }
}
