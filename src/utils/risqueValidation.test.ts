import { describe, it, expect } from 'vitest'
import { rowsWithoutSousRisque } from './risqueValidation'

const categories = [
  { id: 'root-a', parentId: null },
  { id: 'child-a1', parentId: 'root-a' },
  { id: 'root-b', parentId: null },
  { id: 'child-b1', parentId: 'root-b' },
]

describe('rowsWithoutSousRisque', () => {
  it('flags a row with no category at all', () => {
    expect(rowsWithoutSousRisque([{ categorieIds: [] }], categories)).toHaveLength(1)
    expect(rowsWithoutSousRisque([{ categorieIds: undefined }], categories)).toHaveLength(1)
  })

  it('flags a row that only carries a root category', () => {
    expect(rowsWithoutSousRisque([{ categorieIds: ['root-a'] }], categories)).toHaveLength(1)
  })

  it('accepts a row carrying a child category, alongside its root or not', () => {
    expect(rowsWithoutSousRisque([{ categorieIds: ['child-a1'] }], categories)).toEqual([])
    expect(rowsWithoutSousRisque([{ categorieIds: ['root-a', 'child-a1'] }], categories)).toEqual([])
  })

  it('ignores unknown ids and still requires a real child among the known ones', () => {
    expect(rowsWithoutSousRisque([{ categorieIds: ['unknown'] }], categories)).toHaveLength(1)
    expect(rowsWithoutSousRisque([{ categorieIds: ['unknown', 'child-b1'] }], categories)).toEqual([])
  })
})
