import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, click, render } from '@/test/renderHelpers'
import { ClickableCard } from './ClickableCard'

const navigate = vi.hoisted(() => vi.fn())
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }))

afterEach(() => {
  cleanup()
  navigate.mockClear()
})

describe('ClickableCard', () => {
  it('opens the dossier when the card surface is touched', async () => {
    const { container } = await render(
      <ClickableCard to="/permits-travail/1" label="Ouvrir"><p id="text">Permis 0035</p></ClickableCard>,
    )
    await click(container.querySelector('#text')!)
    expect(navigate).toHaveBeenCalledWith('/permits-travail/1')
  })

  it('leaves inner action buttons alone', async () => {
    const onDelete = vi.fn()
    const { container } = await render(
      <ClickableCard to="/planning/1" label="Ouvrir"><button type="button" onClick={onDelete}>Supprimer</button></ClickableCard>,
    )
    await click(container.querySelector('button')!)
    expect(onDelete).toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('is reachable and operable with the keyboard', async () => {
    const { container } = await render(<ClickableCard to="/x" label="Ouvrir">Contenu</ClickableCard>)
    const card = container.querySelector('[role="link"]') as HTMLElement
    expect(card.tabIndex).toBe(0)
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    expect(navigate).toHaveBeenCalledWith('/x')
  })
})
