import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, render } from '@/test/renderHelpers'
import { FieldAgentTabBar } from './FieldAgentTabBar'

const menu = vi.hoisted(() => ({ items: [] as unknown[] }))
vi.mock('@/store/menu.store', () => ({
  useMenuStore: (selector: (state: { items: unknown[] }) => unknown) => selector({ items: menu.items }),
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => (key === 'terrain.myDay' ? 'Ma journée' : key) }),
}))
vi.mock('@/features/terrain/TerrainSyncDot', () => ({ TerrainSyncDot: () => null }))

afterEach(() => {
  cleanup()
  menu.items = []
})

const node = (id: number, name: string, route: string) => ({ id, name, route, icon: 'FileText', children: [] })

describe('field agent tab bar', () => {
  it('builds its tabs from the role matrix menu, with "Ma journée" as home', async () => {
    menu.items = [node(1, 'Dashboard', '/dashboard'), node(2, 'Permis de Travail', '/permits-travail'), node(3, 'Interventions', '/interventions')]
    const { container } = await render(<MemoryRouter><FieldAgentTabBar /></MemoryRouter>)
    const labels = [...container.querySelectorAll('a')].map((a) => a.textContent)
    expect(labels).toEqual(['Ma journée', 'Permis de Travail', 'Interventions'])
  })

  it('shows nothing the matrix does not grant, and never more than four tabs', async () => {
    menu.items = [1, 2, 3, 4, 5, 6].map((i) => node(i, `Menu ${i}`, `/m${i}`))
    const { container } = await render(<MemoryRouter><FieldAgentTabBar /></MemoryRouter>)
    expect(container.querySelectorAll('a')).toHaveLength(4)
  })
})
