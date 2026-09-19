import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OfflineQueuedError } from '@/offline/offlineError'
import { useUiStore } from '@/store/ui.store'
import { MAX_UPLOAD_BYTES } from '@/utils/uploadLimits'
import { cleanup, render, selectFiles } from '@/test/renderHelpers'
import CaptureButtons from './CaptureButtons'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => (opts ? `${key} ${JSON.stringify(opts)}` : key),
  }),
}))

const jpeg = (name: string, size = 1024) => {
  const file = new File(['x'], name, { type: 'image/jpeg' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('CaptureButtons', () => {
  const addToast = vi.fn()

  beforeEach(() => {
    addToast.mockReset()
    useUiStore.setState({ addToast })
  })

  afterEach(() => cleanup())

  async function setup(onCapture: (item: { file: File; capturedAt: string }) => Promise<void> | void) {
    const { container } = await render(<CaptureButtons onCapture={onCapture} multiple />)
    const [camera, filePicker] = Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[]
    return { camera, filePicker }
  }

  it('sends every selected file with an ISO capturedAt', async () => {
    const onCapture = vi.fn().mockResolvedValue(undefined)
    const { filePicker } = await setup(onCapture)

    await selectFiles(filePicker, [jpeg('a.jpg'), jpeg('b.jpg')])

    expect(onCapture).toHaveBeenCalledTimes(2)
    expect(onCapture.mock.calls[0][0].file.name).toBe('a.jpg')
    expect(onCapture.mock.calls[0][0].capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T.*Z$/)
    expect(addToast).not.toHaveBeenCalled()
  })

  it('keeps sending the next files when one upload fails', async () => {
    const onCapture = vi
      .fn()
      .mockRejectedValueOnce(new Error('422'))
      .mockResolvedValue(undefined)
    const { camera } = await setup(onCapture)

    await selectFiles(camera, [jpeg('a.jpg'), jpeg('b.jpg'), jpeg('c.jpg')])

    expect(onCapture).toHaveBeenCalledTimes(3)
  })

  it('treats an offline-queued upload as sent and carries on', async () => {
    const onCapture = vi
      .fn()
      .mockRejectedValueOnce(new OfflineQueuedError())
      .mockResolvedValue(undefined)
    const { camera } = await setup(onCapture)

    await selectFiles(camera, [jpeg('a.jpg'), jpeg('b.jpg')])

    expect(onCapture).toHaveBeenCalledTimes(2)
  })

  it('rejects unsupported types with a visible message and skips them', async () => {
    const onCapture = vi.fn().mockResolvedValue(undefined)
    const { filePicker } = await setup(onCapture)
    const heic = new File(['x'], 'photo.heic', { type: 'image/heic' })

    await selectFiles(filePicker, [heic, jpeg('ok.jpg')])

    expect(onCapture).toHaveBeenCalledTimes(1)
    expect(onCapture.mock.calls[0][0].file.name).toBe('ok.jpg')
    expect(addToast).toHaveBeenCalledTimes(1)
    expect(addToast.mock.calls[0][0]).toMatchObject({ type: 'error' })
    expect(addToast.mock.calls[0][0].message).toContain('documents.uploadErrors.unsupportedType')
    expect(addToast.mock.calls[0][0].message).toContain('photo.heic')
  })

  it('rejects files over the size limit with a visible message', async () => {
    const onCapture = vi.fn().mockResolvedValue(undefined)
    const { camera } = await setup(onCapture)

    await selectFiles(camera, [jpeg('huge.jpg', MAX_UPLOAD_BYTES + 1)])

    expect(onCapture).not.toHaveBeenCalled()
    expect(addToast.mock.calls[0][0].message).toContain('documents.uploadErrors.tooLarge')
  })
})
