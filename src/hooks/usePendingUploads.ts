import { useEffect, useState } from 'react'
import { syncQueue, type FormPart, type SyncItem } from '@/offline/syncQueue'
import { getBlob } from '@/offline/blobStore'

export type PendingUpload = {
  id: string
  url: string
  type?: string
  filename?: string
  mimeType?: string
  previewUrl?: string
}

function textField(parts: FormPart[] | undefined, name: string): string | undefined {
  return parts?.find((part) => part.kind === 'text' && part.name === name)?.value
}

function filePart(parts: FormPart[] | undefined): FormPart | undefined {
  return parts?.find((part) => part.kind === 'file')
}

function matchesUrl(item: SyncItem, urlMatch: string): boolean {
  return item.url.includes(urlMatch)
}

export function usePendingUploads(urlMatch: string | undefined): PendingUpload[] {
  const [items, setItems] = useState<PendingUpload[]>([])

  useEffect(() => {
    if (!urlMatch) {
      setItems([])
      return
    }

    let cancelled = false
    let objectUrls: string[] = []

    const refresh = async () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
      objectUrls = []
      const queued = (await syncQueue.getAll()).filter(
        (item) => matchesUrl(item, urlMatch) && Boolean(item.formParts?.length),
      )
      const next: PendingUpload[] = []
      for (const item of queued) {
        const file = filePart(item.formParts)
        let previewUrl: string | undefined
        if (file?.blobId && (file.mimeType ?? '').startsWith('image/')) {
          const stored = await getBlob(file.blobId)
          if (stored && !cancelled) {
            previewUrl = URL.createObjectURL(stored.blob)
            objectUrls.push(previewUrl)
          }
        }
        next.push({
          id: item.id,
          url: item.url,
          type: textField(item.formParts, 'type'),
          filename: file?.filename,
          mimeType: file?.mimeType,
          previewUrl,
        })
      }
      if (!cancelled) setItems(next)
    }

    void refresh()
    const unsubscribe = syncQueue.subscribe(() => {
      void refresh()
    })

    return () => {
      cancelled = true
      unsubscribe()
      objectUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [urlMatch])

  return items
}
