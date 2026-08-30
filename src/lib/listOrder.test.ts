import { describe, expect, it } from 'vitest'
import { byDateDesc, sortByDateDesc, sortNewestFirst, withNewestFirst } from './listOrder'

describe('withNewestFirst', () => {
  it('adds createdAt desc even when params are empty', () => {
    expect(withNewestFirst()).toEqual({ 'order[createdAt]': 'desc' })
  })

  it('keeps caller params and forces newest-first order', () => {
    expect(withNewestFirst({ page: 1, itemsPerPage: 5, 'order[createdAt]': 'asc' })).toEqual({
      page: 1,
      itemsPerPage: 5,
      'order[createdAt]': 'desc',
    })
  })
})

describe('sortNewestFirst', () => {
  it('orders by createdAt descending', () => {
    const items = [
      { id: 'old', createdAt: '2026-01-01T00:00:00+00:00' },
      { id: 'new', createdAt: '2026-08-01T00:00:00+00:00' },
      { id: 'mid', createdAt: '2026-04-01T00:00:00+00:00' },
    ]
    expect(sortNewestFirst(items).map((i) => i.id)).toEqual(['new', 'mid', 'old'])
  })

  it('does not mutate the source array', () => {
    const items = [
      { id: 'a', createdAt: '2026-01-01' },
      { id: 'b', createdAt: '2026-02-01' },
    ]
    sortNewestFirst(items)
    expect(items.map((i) => i.id)).toEqual(['a', 'b'])
  })
})

describe('sortByDateDesc', () => {
  it('uses a custom date getter', () => {
    const items = [
      { id: 'old', importedAt: '2026-01-01' },
      { id: 'new', importedAt: '2026-08-01' },
    ]
    expect(sortByDateDesc(items, (i) => i.importedAt).map((i) => i.id)).toEqual(['new', 'old'])
  })
})

describe('byDateDesc', () => {
  it('treats missing dates as oldest', () => {
    expect(byDateDesc(undefined, '2026-01-01')).toBeGreaterThan(0)
    expect(byDateDesc('2026-01-01', null)).toBeLessThan(0)
  })
})
