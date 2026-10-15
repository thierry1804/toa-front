import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Camera, Loader2 } from 'lucide-react'
import { useUiStore } from '@/store/ui.store'
import { resolveCapturedAt, type CaptureSource } from '@/utils/capturedAt'
import { compressImage } from '@/utils/imageCompression'
import { checkUploadFile } from '@/utils/uploadLimits'

export interface CapturedFile {
  file: File
  capturedAt: string
}

interface CaptureButtonsProps {
  onCapture: (item: CapturedFile) => void | Promise<void>
  uploading?: boolean
  hasPhotos?: boolean
  multiple?: boolean
}

export default function CaptureButtons({
  onCapture,
  uploading = false,
  hasPhotos = false,
  multiple = false,
}: CaptureButtonsProps) {
  const { t } = useTranslation()
  const addToast = useUiStore((s) => s.addToast)
  const cameraRef = useRef<HTMLInputElement | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const handle = async (source: CaptureSource, files: FileList | null, input: HTMLInputElement | null) => {
    try {
      if (!files) return
      for (const original of Array.from(files)) {
        // Photos de téléphone souvent > 10 Mo : on les réduit avant contrôle et envoi (aussi en file hors-ligne).
        const file = await compressImage(original)
        const problem = checkUploadFile(file)
        if (problem) {
          addToast({ message: t(`documents.uploadErrors.${problem}`, { name: file.name }), type: 'error' })
          continue
        }
        try {
          await onCapture({ file, capturedAt: resolveCapturedAt(source, original) })
        } catch {
          // API failures are already toasted by the upload hooks and an offline-queued upload counts as sent; keep going with the next file.
        }
      }
    } finally {
      if (input) input.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraRef}
        className="hidden"
        onChange={(e) => void handle('camera', e.target.files, cameraRef.current)}
      />
      <input
        type="file"
        multiple={multiple}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        ref={fileRef}
        className="hidden"
        onChange={(e) => void handle('file', e.target.files, fileRef.current)}
      />
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        disabled={uploading}
        className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
        {uploading ? t('documents.sending') : hasPhotos ? t('documents.addPhoto') : t('documents.takePhoto')}
      </button>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex min-h-11 items-center rounded-lg px-2 text-sm text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-9"
      >
        {t('documents.importFile')}
      </button>
    </div>
  )
}
