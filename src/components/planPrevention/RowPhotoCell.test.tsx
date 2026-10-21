import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, click, render, selectFiles } from '@/test/renderHelpers'
import RowPhotoCell from './RowPhotoCell'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/imageCompression', () => ({ compressImage: async (file: File) => file }))
vi.mock('@/api/planPreventionApi', () => ({
  planPreventionApi: { getDocumentBlob: vi.fn(async () => new Blob(['x'], { type: 'image/jpeg' })) },
}))

afterEach(() => cleanup())

describe('RowPhotoCell (R-09)', () => {
  it('shows N/A when the photo is not required', async () => {
    const { container } = await render(<RowPhotoCell planId="p1" required={false} onUpload={vi.fn()} />)
    expect(container.textContent).toBe('N/A')
  })

  it('offers capture when required and uploads the chosen photo', async () => {
    const onUpload = vi.fn(async () => undefined)
    const { container } = await render(<RowPhotoCell planId="p1" required onUpload={onUpload} missing />)
    expect(container.textContent).toContain('Photo obligatoire')

    const input = container.querySelector('input[type="file"]:not([capture])') as HTMLInputElement
    await selectFiles(input, [new File(['x'], 'photo.jpg', { type: 'image/jpeg' })])

    expect(onUpload).toHaveBeenCalledTimes(1)
  })

  it('shows the linked photo with a remove action', async () => {
    const onRemove = vi.fn(async () => undefined)
    const { container } = await render(
      <RowPhotoCell planId="p1" photoDocumentId="d1" required onUpload={vi.fn()} onRemove={onRemove} />,
    )
    const remove = container.querySelector('button[title="Retirer la photo"]')!
    await click(remove)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('flags a missing required photo in read-only mode', async () => {
    const { container } = await render(<RowPhotoCell planId="p1" required readonly />)
    expect(container.textContent).toBe('Photo manquante')
  })
})
