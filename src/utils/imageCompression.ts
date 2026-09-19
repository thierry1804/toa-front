const COMPRESSIBLE_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

// En dessous, la photo est déjà légère : on ne la retouche pas (évite une perte de qualité inutile).
export const COMPRESS_THRESHOLD_BYTES = 1.5 * 1024 * 1024
// Grand côté maximal : 2560 px reste très lisible pour des photos de chantier / de pièces.
export const MAX_IMAGE_EDGE = 2560
const QUALITIES = [0.82, 0.65, 0.5]
// Objectif de taille : nettement sous la limite serveur (10 Mo) et léger pour la file hors-ligne (80 Mo au total).
const TARGET_BYTES = 3 * 1024 * 1024

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality))
}

/**
 * Réduit une photo (JPEG/PNG/WebP) avant envoi : redimensionnement + ré-encodage JPEG. Les PDF, les petites
 * images et tout cas d'échec (navigateur sans support, image illisible) renvoient le fichier d'origine :
 * la compression ne doit jamais empêcher un envoi. `lastModified` est conservé (date de prise de vue).
 */
export async function compressImage(file: File): Promise<File> {
  if (!COMPRESSIBLE_MIME.includes(file.type)) return file
  if (file.size <= COMPRESS_THRESHOLD_BYTES) return file
  if (typeof createImageBitmap !== 'function') return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      bitmap.close?.()
      return file
    }
    // Fond blanc : un PNG transparent ne doit pas devenir noir en JPEG.
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()

    let best: Blob | null = null
    for (const quality of QUALITIES) {
      const blob = await canvasToBlob(canvas, quality)
      if (!blob) break
      best = blob
      if (blob.size <= TARGET_BYTES) break
    }
    if (!best || best.size >= file.size) return file

    const name = `${file.name.replace(/\.[^.]+$/, '') || 'photo'}.jpg`
    return new File([best], name, { type: 'image/jpeg', lastModified: file.lastModified })
  } catch {
    return file
  }
}
