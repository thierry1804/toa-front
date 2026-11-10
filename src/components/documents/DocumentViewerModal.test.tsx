import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DocumentViewerModal from './DocumentViewerModal'

afterEach(() => {
  document.body.innerHTML = ''
})

async function mount(root: Root, element: Parameters<Root['render']>[0]) {
  await act(async () => {
    root.render(element)
  })
}

describe('DocumentViewerModal', () => {
  it('fetches the blob once even if the parent passes a new blob getter on every re-render', async () => {
    // Régression : `blob` est systématiquement une fonction recréée par l'appelant
    // (`blob={() => api.getDocumentBlob(...)}`). La mettre dans les deps du
    // useEffect relançait le chargement — et révoquait l'URL blob en cours —
    // à chaque rendu du parent, provoquant net::ERR_FILE_NOT_FOUND côté navigateur.
    const container = document.createElement('div')
    document.body.appendChild(container)
    const root = createRoot(container)
    const blobFetcher = vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' }))

    await mount(
      root,
      <DocumentViewerModal isOpen title="Doc" blob={() => blobFetcher()} onClose={() => {}} />,
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(blobFetcher).toHaveBeenCalledTimes(1)
    const firstSrc = container.querySelector('img')?.getAttribute('src')
    expect(firstSrc).toMatch(/^blob:/)

    // Nouveau rendu du parent : nouvelle fonction `blob`, même document ouvert.
    await mount(
      root,
      <DocumentViewerModal isOpen title="Doc" blob={() => blobFetcher()} onClose={() => {}} />,
    )
    await act(async () => {
      await Promise.resolve()
    })

    expect(blobFetcher).toHaveBeenCalledTimes(1)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(firstSrc)

    act(() => root.unmount())
    container.remove()
  })
})
