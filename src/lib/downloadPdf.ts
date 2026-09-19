import api from '@/lib/axios'
import { triggerBlobDownload } from '@/lib/downloadBlob'
import { withCachedDocumentBlob } from '@/offline/docCache'

/**
 * Télécharge un PDF généré par le serveur. En ligne : réseau (le fichier est aussi mis en cache local) ;
 * hors-ligne : copie locale préchargée avec le snapshot ou téléchargée précédemment.
 */
export async function downloadCachedPdf(path: string, fallbackFilename: string): Promise<void> {
  let filename = fallbackFilename
  const blob = await withCachedDocumentBlob(
    path,
    async () => {
      const res = await api.get<Blob>(path, { responseType: 'blob', _skipOfflineQueue: true })
      const disposition = String(res.headers?.['content-disposition'] ?? '')
      filename = disposition.match(/filename="?([^";]+)"?/)?.[1] ?? fallbackFilename
      return res.data
    },
    { filename: fallbackFilename },
  )
  triggerBlobDownload(blob, filename)
}
