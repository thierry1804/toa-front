import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'

interface DocumentThumbProps {
  mimeType: string
  loadBlob: () => Promise<Blob>
}

export default function DocumentThumb({ mimeType, loadBlob }: DocumentThumbProps) {
  const [src, setSrc] = useState<string | null>(null)
  const isImage = mimeType.startsWith('image/')

  useEffect(() => {
    if (!isImage) return
    let cancelled = false
    let objectUrl: string | null = null
    loadBlob()
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setSrc(null)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isImage])

  if (isImage && src) {
    return <img src={src} alt="" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
  }
  return (
    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded bg-gray-100">
      <FileText className="h-5 w-5 text-gray-400" />
    </div>
  )
}
