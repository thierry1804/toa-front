import JSZip from 'jszip'
import type { SitePrevention } from '@/types/planPrevention'

export interface KmzExtendedData {
  fokontany?: string
  commune?: string
  district?: string
}

// querySelector fails on KML default namespace — getElementsByTagName is namespace-agnostic
function getText(el: Element, tag: string): string {
  return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? ''
}

export async function parseKmzFile(
  file: File,
): Promise<{ sites: SitePrevention[]; metadata: Record<string, KmzExtendedData> }> {
  const zip = await JSZip.loadAsync(file)

  const kmlEntry = Object.values(zip.files).find((f) => f.name.endsWith('.kml'))
  if (!kmlEntry) return { sites: [], metadata: {} }

  const kmlText = await kmlEntry.async('string')
  const doc = new DOMParser().parseFromString(kmlText, 'application/xml')

  const sites: SitePrevention[] = []
  const metadata: Record<string, KmzExtendedData> = {}

  Array.from(doc.getElementsByTagName('Placemark')).forEach((placemark) => {
    const name = getText(placemark, 'name') || 'Site'

    const coordEl = placemark.getElementsByTagName('coordinates')[0]
    if (!coordEl) return

    const parts = coordEl.textContent?.trim().split(',') ?? []
    const lng = parseFloat(parts[0])
    const lat = parseFloat(parts[1])
    const alt = parts[2] ? parseFloat(parts[2]) : null

    if (isNaN(lng) || isNaN(lat)) return

    const ext: KmzExtendedData = {}
    Array.from(placemark.getElementsByTagName('Data')).forEach((node) => {
      const key = node.getAttribute('name')
      const val = node.getElementsByTagName('value')[0]?.textContent?.trim()
      if (!key || !val) return
      if (key === 'Fokontany') ext.fokontany = val
      else if (key === 'Commune') ext.commune = val
      else if (key === 'District') ext.district = val
    })

    if (ext.fokontany || ext.commune || ext.district) {
      metadata[name] = ext
    }

    sites.push({
      id: crypto.randomUUID(),
      nom: name,
      latitude: lat,
      longitude: lng,
      altitude: alt != null && !isNaN(alt) ? alt : null,
      sourceKmz: true,
      fokontany: ext.fokontany ?? null,
      commune: ext.commune ?? null,
      district: ext.district ?? null,
    })
  })

  return { sites, metadata }
}
