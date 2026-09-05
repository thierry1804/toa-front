import { useEffect, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Blob already fetched by the caller, or a function fetching it lazily on open. */
  blob: Blob | (() => Promise<Blob>) | null
  filename?: string
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  title,
  blob,
  filename,
}: DocumentViewerModalProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [mimeType, setMimeType] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen || !blob) return
    let cancelled = false
    let url: string | null = null
    setError(false)
    setLoading(true)

    const resolveBlob = typeof blob === 'function' ? blob() : Promise.resolve(blob)
    resolveBlob
      .then((resolved) => {
        if (cancelled) return
        url = URL.createObjectURL(resolved)
        setObjectUrl(url)
        setMimeType(resolved.type)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
      setObjectUrl(null)
    }
  }, [isOpen, blob])

  const isImage = mimeType.startsWith('image/')
  const isPdf = mimeType === 'application/pdf'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="flex min-h-[60vh] items-center justify-center">
        {loading && <Loader2 className="h-8 w-8 animate-spin text-gray-400" />}

        {!loading && error && (
          <p className="text-sm text-red-600">
            Impossible de charger le document.
          </p>
        )}

        {!loading && !error && objectUrl && isImage && (
          <img
            src={objectUrl}
            alt={filename ?? title}
            className="max-h-[75vh] w-auto max-w-full object-contain"
          />
        )}

        {!loading && !error && objectUrl && isPdf && (
          <iframe
            src={objectUrl}
            title={filename ?? title}
            className="h-[75vh] w-full rounded-md border border-gray-200"
          />
        )}

        {!loading && !error && objectUrl && !isImage && !isPdf && (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-gray-600">
              Aperçu non disponible pour ce type de fichier.
            </p>
            <a href={objectUrl} download={filename}>
              <Button type="button" variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </a>
          </div>
        )}
      </div>
    </Modal>
  )
}
