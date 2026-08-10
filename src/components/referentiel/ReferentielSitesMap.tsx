import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import type { FeatureCollection, Point } from 'geojson'
import type { SiteGeoJsonFeature } from '@/types/referentiel'

const ANTANANARIVO: [number, number] = [47.5361, -18.9137]
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY as string | undefined
const SOURCE_ID = 'sites-source'
const EMPTY_GEOJSON: FeatureCollection<Point, SiteGeoJsonFeature> = {
  type: 'FeatureCollection',
  features: [],
}

interface ReferentielSitesMapProps {
  geoJson: FeatureCollection<Point, SiteGeoJsonFeature> | null | undefined
  height?: string
}

function buildPopupHtml(props: SiteGeoJsonFeature): string {
  const badges = [props.fok, props.com, props.dis].filter(Boolean) as string[]
  const badgeHtml = badges
    .map(
      (b) =>
        `<span style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:4px;padding:1px 6px;font-size:11px;color:#1d4ed8">${b}</span>`,
    )
    .join('')

  return `
    <div style="min-width:180px;padding:4px;font-size:13px;line-height:1.5">
      <p style="font-weight:600;color:#111;margin:0 0 4px">${props.n}</p>
      ${badges.length > 0 ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin:0 0 6px">${badgeHtml}</div>` : ''}
      ${props.a != null ? `<p style="font-size:11px;color:#777;margin:0">Altitude : ${props.a.toFixed(0)} m</p>` : ''}
    </div>`
}

export default function ReferentielSitesMap({
  geoJson,
  height = '420px',
}: ReferentielSitesMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const popupRef = useRef<maplibregl.Popup | null>(null)

  useEffect(() => {
    if (!containerRef.current || !MAPTILER_KEY) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`,
      center: ANTANANARIVO,
      zoom: 5,
      attributionControl: false,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    map.on('load', () => {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: EMPTY_GEOJSON,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#60a5fa',
            100,
            '#3b82f6',
            500,
            '#1d4ed8',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 18, 100, 24, 500, 32],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      })

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#fff' },
      })

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['coalesce', ['get', 'c'], '#3b82f6'],
          'circle-radius': 6,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      })

      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        if (!features.length) return
        const clusterId = features[0].properties?.cluster_id as number
        const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const coords = (features[0].geometry as Point).coordinates as [number, number]
          map.easeTo({ center: coords, zoom: zoom ?? 10 })
        }).catch(() => {})
      })

      map.on('click', 'unclustered-point', (e) => {
        if (!e.features?.length) return
        const f = e.features[0]
        const coords = (f.geometry as Point).coordinates as [number, number]
        const props = f.properties as SiteGeoJsonFeature

        popupRef.current?.remove()
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(buildPopupHtml(props))
          .addTo(map)
      })

      map.on('mouseenter', 'clusters', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'clusters', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('mouseenter', 'unclustered-point', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'unclustered-point', () => {
        map.getCanvas().style.cursor = ''
      })
    })

    mapRef.current = map

    return () => {
      popupRef.current?.remove()
      popupRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const data = geoJson ?? EMPTY_GEOJSON

    const apply = () => {
      const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined
      if (!source) return
      source.setData(data)

      if (data.features.length === 0) {
        map.flyTo({ center: ANTANANARIVO, zoom: 5 })
        return
      }

      if (data.features.length === 1) {
        const coords = data.features[0].geometry.coordinates as [number, number]
        map.flyTo({ center: coords, zoom: 12 })
        return
      }

      const bounds = new maplibregl.LngLatBounds()
      data.features.forEach((f) => {
        bounds.extend(f.geometry.coordinates as [number, number])
      })
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 })
    }

    if (map.loaded()) apply()
    else map.once('load', apply)
  }, [geoJson])

  const siteCount = geoJson?.features?.length ?? 0

  const handleResetView = () => {
    const map = mapRef.current
    if (!map || !geoJson?.features?.length) return
    if (geoJson.features.length === 1) {
      const coords = geoJson.features[0].geometry.coordinates as [number, number]
      map.flyTo({ center: coords, zoom: 12 })
    } else {
      const bounds = new maplibregl.LngLatBounds()
      geoJson.features.forEach((f) => bounds.extend(f.geometry.coordinates as [number, number]))
      map.fitBounds(bounds, { padding: 60, maxZoom: 13 })
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {siteCount > 0
            ? `${siteCount} site${siteCount > 1 ? 's' : ''} affiché${siteCount > 1 ? 's' : ''}`
            : 'Aucun site — importez un fichier KMZ'}
        </span>
        {siteCount > 0 && (
          <button
            type="button"
            onClick={handleResetView}
            className="text-xs text-blue-600 hover:underline"
          >
            Centrer la vue
          </button>
        )}
      </div>

      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height }}>
        {siteCount === 0 && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 text-sm text-gray-400 italic pointer-events-none">
            Aucun site importé
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}
