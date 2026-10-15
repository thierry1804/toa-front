import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, click, render } from '@/test/renderHelpers'
import { CollapsibleSection } from './CollapsibleSection'

const mobile = vi.hoisted(() => ({ isDesktop: false }))
vi.mock('@/hooks/useMediaQuery', () => ({ useMediaQuery: () => mobile.isDesktop }))

afterEach(() => {
  cleanup()
  mobile.isDesktop = false
})

describe('CollapsibleSection', () => {
  it('is an accordion on mobile: closed by default, summary visible, opens on touch', async () => {
    const { container } = await render(
      <CollapsibleSection title="Documents" summary="3 documents"><p id="body">Contenu</p></CollapsibleSection>,
    )
    const button = container.querySelector('button')!
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(container.textContent).toContain('3 documents')
    expect((container.querySelector('#body')!.parentElement as HTMLElement).hidden).toBe(true)
    await click(button)
    expect(button.getAttribute('aria-expanded')).toBe('true')
    expect((container.querySelector('#body')!.parentElement as HTMLElement).hidden).toBe(false)
  })

  it('opens at load when asked to', async () => {
    const { container } = await render(<CollapsibleSection title="Infos" defaultOpen><p id="body">x</p></CollapsibleSection>)
    expect((container.querySelector('#body')!.parentElement as HTMLElement).hidden).toBe(false)
  })

  it('is always unfolded on desktop, without a toggle button', async () => {
    mobile.isDesktop = true
    const { container } = await render(<CollapsibleSection title="Infos"><p id="body">x</p></CollapsibleSection>)
    expect(container.querySelector('button')).toBeNull()
    expect((container.querySelector('#body')!.parentElement as HTMLElement).hidden).toBe(false)
  })
})
