import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { SitePrevention } from '@/types/planPrevention'

const DEFAULT_COLOR = '#FF6B35'
const ANTANANARIVO: [number, number] = [47.5361, -18.9137]
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined

interface SitesKmzMapProps {
  sites: SitePrevention[]
  height?: string
  readonly?: boolean
  onDeleteSite?: (siteId: string) => Promise<void>
}

function getBarycenter(sites: SitePrevention[]): [number, number] {
  if (sites.length === 0) return ANTANANARIVO
  const lng = sites.reduce((sum, s) => sum + s.longitude, 0) / sites.length
  const lat = sites.reduce((sum, s) => sum + s.latitude, 0) / sites.length
  return [lng, lat]
}

function buildPopupEl(
  site: SitePrevention,
  readonly: boolean,
  onDeleteSite: ((id: string) => Promise<void>) | undefined,
): HTMLElement {
  const wrap = document.createElement('div')
  wrap.style.cssText = 'min-width:180px;padding:4px;font-size:13px;line-height:1.5'

  const name = document.createElement('p')
  name.style.cssText = 'font-weight:600;color:#111;margin:0 0 4px'
  name.textContent = site.nom
  wrap.appendChild(name)

  if (site.description) {
    const desc = document.createElement('p')
    desc.style.cssText = 'color:#555;font-size:11px;margin:0 0 4px'
    desc.textContent = site.description
    wrap.appendChild(desc)
  }

  const coords = document.createElement('p')
  coords.style.cssText = 'font-family:monospace;font-size:11px;color:#777;margin:0 0 4px'
  coords.textContent = `${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}`
  wrap.appendChild(coords)

  if (site.altitude != null) {
    const alt = document.createElement('p')
    alt.style.cssText = 'font-size:11px;color:#777;margin:0 0 4px'
    alt.textContent = `Altitude : ${site.altitude.toFixed(0)} m`
    wrap.appendChild(alt)
  }

  if (!readonly && onDeleteSite) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = 'Supprimer ce site'
    btn.style.cssText =
      'margin-top:6px;width:100%;padding:3px 8px;font-size:11px;font-weight:500;' +
      'color:#dc2626;background:#fef2f2;border:1px solid #fecaca;border-radius:4px;cursor:pointer'
    btn.addEventListener('mouseover', () => { btn.style.background = '#fee2e2' })
    btn.addEventListener('mouseout', () => { btn.style.background = '#fef2f2' })
    btn.addEventListener('click', async () => {
      btn.disabled = true
      btn.textContent = 'Suppression...'
      try {
        await onDeleteSite(site.id)
      } finally {
        btn.disabled = false
        btn.textContent = 'Supprimer ce site'
      }
    })
    wrap.appendChild(btn)
  }

  return wrap
}

export default function SitesKmzMap({
  sites,
  height = '400px',
  readonly = false,
  onDeleteSite,
}: SitesKmzMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const popupRef = useRef<maplibregl.Popup | null>(null)
  const onDeleteRef = useRef(onDeleteSite)
  const readonlyRef = useRef(readonly)

  useEffect(() => { onDeleteRef.current = onDeleteSite }, [onDeleteSite])
  useEffect(() => { readonlyRef.current = readonly }, [readonly])

  // Initialize map once on mount
  useEffect(() => {
    if (!containerRef.current || !MAPTILER_KEY) return

    const center = getBarycenter(sites)
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center,
      zoom: sites.length > 1 ? 10 : 13,
      attributionControl: false,
    })
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    mapRef.current = map

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync markers whenever sites change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const syncMarkers = () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      popupRef.current?.remove()
      popupRef.current = null

      sites.forEach((site) => {
        const marker = new maplibregl.Marker({ color: site.couleurMarqueur ?? DEFAULT_COLOR })
          .setLngLat([site.longitude, site.latitude])
          .addTo(map)

        marker.getElement().style.cursor = 'pointer'
        marker.getElement().addEventListener('click', () => {
          popupRef.current?.remove()
          const popup = new maplibregl.Popup({ offset: 35, closeButton: true, maxWidth: '260px' })
            .setLngLat([site.longitude, site.latitude])
            .setDOMContent(buildPopupEl(site, readonlyRef.current, onDeleteRef.current))
            .addTo(map)
          popupRef.current = popup
        })

        markersRef.current.push(marker)
      })

      if (sites.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        sites.forEach((s) => bounds.extend([s.longitude, s.latitude]))
        map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
      } else if (sites.length === 1) {
        map.setCenter([sites[0].longitude, sites[0].latitude])
        map.setZoom(13)
      }
    }

    if (map.loaded()) {
      syncMarkers()
    } else {
      map.once('load', syncMarkers)
    }
  }, [sites])

  const handleResetView = () => {
    const map = mapRef.current
    if (!map) return
    if (sites.length > 1) {
      const bounds = new maplibregl.LngLatBounds()
      sites.forEach((s) => bounds.extend([s.longitude, s.latitude]))
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 })
    } else if (sites.length === 1) {
      map.flyTo({ center: [sites[0].longitude, sites[0].latitude], zoom: 13 })
    }
  }

  if (!MAPTILER_KEY) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700"
        style={{ height }}
      >
        VITE_MAPTILER_KEY non configurée
      </div>
    )
  }

  if (sites.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-400 italic"
        style={{ height }}
      >
        Aucun site importé — importez un fichier KMZ
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">
          {sites.length} site{sites.length > 1 ? 's' : ''} affiché{sites.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          onClick={handleResetView}
          className="text-xs text-blue-600 hover:underline"
        >
          Réinitialiser la vue
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200" style={{ height }}>
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
