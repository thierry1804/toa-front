import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'

interface DocumentThumbProps {
  mimeType: string
  loadBlob: () => Promise<Blob>
  /** Classes de taille (défaut : 48 px). */
  sizeClass?: string
}

export default function DocumentThumb({ mimeType, loadBlob, sizeClass = 'h-12 w-12' }: DocumentThumbProps) {
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
    return <img src={src} alt="" className={`${sizeClass} flex-shrink-0 rounded-md object-cover`} />
  }
  return (
    <div className={`flex ${sizeClass} flex-shrink-0 items-center justify-center rounded-md bg-gray-100`}>
      <FileText className="h-5 w-5 text-gray-400" />
    </div>
  )
}
