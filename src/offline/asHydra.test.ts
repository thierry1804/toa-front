import { describe, it, expect } from 'vitest'
import { asHydra, paginateLocal, hydraMember, hydraTotalItems } from './asHydra'

describe('asHydra', () => {
  it('wraps members with totalItems', () => {
    expect(asHydra([{ id: 1 }])).toEqual(
      expect.objectContaining({ member: [{ id: 1 }], totalItems: 1 }),
    )
  })
})

describe('paginateLocal', () => {
  it('returns the full collection when itemsPerPage is 0', () => {
    const items = [{ id: 1 }, { id: 2 }]
    expect(paginateLocal(items, 1, 0).member).toEqual(items)
  })

  it('slices by page', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    const page = paginateLocal(items, 2, 1)
    expect(page.member).toEqual([{ id: 2 }])
    expect(page.totalItems).toBe(3)
  })
})

describe('hydraMember', () => {
  it('reads member or hydra:member', () => {
    expect(hydraMember({ member: [1] })).toEqual([1])
    expect(hydraMember({ 'hydra:member': [2] })).toEqual([2])
    expect(hydraTotalItems({ 'hydra:totalItems': 9 }, 0)).toBe(9)
  })
})
