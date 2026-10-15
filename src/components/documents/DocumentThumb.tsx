import { useEffect, useState } from 'react'
import { FileText, Maximize2 } from 'lucide-react'

interface DocumentThumbProps {
  mimeType: string
  loadBlob: () => Promise<Blob>
  /** Classes de taille (défaut : 48 px). */
  sizeClass?: string
  /** Affiche une pastille « agrandir » sur la vignette : elle ouvre le document. */
  openHint?: boolean
}

export default function DocumentThumb({ mimeType, loadBlob, sizeClass = 'h-12 w-12', openHint = false }: DocumentThumbProps) {
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

  return (
    <div className={`relative ${sizeClass} flex-shrink-0 overflow-hidden rounded-lg bg-gray-100`}>
      {isImage && src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <FileText className="h-6 w-6 text-gray-400" aria-hidden />
        </div>
      )}
      {/* Liseré intérieur : détache la photo du fond sans ajouter de cadre. */}
      <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-black/10" aria-hidden />
      {openHint && (
        <span className="pointer-events-none absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-md bg-gray-900/70 text-white" aria-hidden>
          <Maximize2 className="h-3 w-3" />
        </span>
      )}
    </div>
  )
}
