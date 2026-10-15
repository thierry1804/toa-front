import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, click, render } from '@/test/renderHelpers'
import DocumentTypeRow, { type TypedDocument } from './DocumentTypeRow'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
  }),
}))
vi.mock('@/components/documents/DocumentThumb', () => ({ default: () => null }))

const doc = (id: string, extra: Partial<TypedDocument> = {}): TypedDocument => ({
  id,
  mimeType: 'image/jpeg',
  uploadedAt: '2026-09-15T10:00:00.000Z',
  ...extra,
})

const baseProps = {
  label: 'Trousse de secours',
  pending: [],
  missing: true,
  disabled: false,
  loadBlob: vi.fn().mockResolvedValue(new Blob()),
  onView: vi.fn(),
  onCapture: vi.fn().mockResolvedValue(undefined),
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

describe('DocumentTypeRow', () => {
  afterEach(() => cleanup())

  it('shows the photo count and hides the camera once the row is marked N/A', async () => {
    const { container } = await render(<DocumentTypeRow {...baseProps} docs={[doc('1'), doc('2')]} />)
    expect(container.textContent).toContain('documents.photoCount')
    expect(container.querySelectorAll('input[type="file"]').length).toBe(2)

    cleanup()
    const na = await render(<DocumentTypeRow {...baseProps} docs={[doc('n', { nonApplicable: true })]} />)
    expect(na.container.textContent).toContain('documents.notApplicableDone')
    expect(na.container.querySelectorAll('input[type="file"]').length).toBe(0)
  })

  it('opens the document when its row is touched, with no separate "view" button', async () => {
    const onView = vi.fn()
    const { container } = await render(<DocumentTypeRow {...baseProps} onView={onView} docs={[doc('1')]} />)

    expect([...container.querySelectorAll('button')].some((b) => b.textContent?.includes('documents.view'))).toBe(false)
    await click(container.querySelector('[role="link"]')!)
    expect(onView).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }))
  })

  it('keeps the extra action (download) and the delete button from opening the document', async () => {
    const onView = vi.fn()
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const { container } = await render(
      <DocumentTypeRow {...baseProps} onView={onView} onDelete={onDelete} docs={[doc('1')]} renderExtra={() => <button type="button">Télécharger</button>} />,
    )

    await click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Télécharger')!)
    await click(container.querySelector('button[title="documents.delete"]')!)
    expect(onView).not.toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('deletes a photo and re-enables the button afterwards', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)
    const { container } = await render(<DocumentTypeRow {...baseProps} docs={[doc('1')]} onDelete={onDelete} />)

    await click(container.querySelector('button[title="documents.delete"]')!)

    expect(onDelete).toHaveBeenCalledWith('1')
    expect((container.querySelector('button[title="documents.delete"]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('survives a failing delete (already toasted by the hook) without an unhandled rejection', async () => {
    const onDelete = vi.fn().mockRejectedValue(new Error('403'))
    const { container } = await render(<DocumentTypeRow {...baseProps} docs={[doc('1')]} onDelete={onDelete} />)
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)

    await click(container.querySelector('button[title="documents.delete"]')!)
    await settle()
    process.off('unhandledRejection', unhandled)

    expect(onDelete).toHaveBeenCalledTimes(1)
    expect(unhandled).not.toHaveBeenCalled()
    expect((container.querySelector('button[title="documents.delete"]') as HTMLButtonElement).disabled).toBe(false)
  })

  it('toggles N/A and survives a failing toggle', async () => {
    const onToggle = vi.fn().mockRejectedValueOnce(new Error('500')).mockResolvedValue(undefined)
    const { container } = await render(
      <DocumentTypeRow {...baseProps} docs={[]} onToggleNotApplicable={onToggle} />,
    )
    const checkbox = () => container.querySelector('input[type="checkbox"]') as HTMLInputElement

    await click(checkbox())
    await settle()
    expect(onToggle).toHaveBeenNthCalledWith(1, true)

    await click(checkbox())
    expect(onToggle).toHaveBeenCalledTimes(2)
  })

  it('offers no photo action when the row is read-only', async () => {
    const { container } = await render(
      <DocumentTypeRow {...baseProps} docs={[doc('1')]} disabled onDelete={vi.fn()} />,
    )
    expect(container.querySelector('button[title="documents.delete"]')).toBeNull()
    expect(container.querySelectorAll('input[type="file"]').length).toBe(0)
  })
})
