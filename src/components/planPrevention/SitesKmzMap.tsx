import { useCallback, useRef, useState } from 'react'
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api'
import type { SitePrevention } from '@/types/planPrevention'

const DEFAULT_COLOR = '#FF6B35'
const ANTANANARIVO = { lat: -18.9137, lng: 47.5361 }

interface SitesKmzMapProps {
  sites: SitePrevention[]
  height?: string
  readonly?: boolean
  onDeleteSite?: (siteId: string) => Promise<void>
}

function getBarycenter(sites: SitePrevention[]): { lat: number; lng: number } {
  if (sites.length === 0) return ANTANANARIVO
  return {
    lat: sites.reduce((sum, s) => sum + s.latitude, 0) / sites.length,
    lng: sites.reduce((sum, s) => sum + s.longitude, 0) / sites.length,
  }
}

function makeSvgMarkerUrl(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40"><path fill="${color}" stroke="#fff" stroke-width="2" d="M14 0C6.3 0 0 6.3 0 14c0 9.9 14 26 14 26S28 23.9 28 14C28 6.3 21.7 0 14 0z"/><circle fill="#fff" cx="14" cy="14" r="5"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export default function SitesKmzMap({
  sites,
  height = '400px',
  readonly = false,
  onDeleteSite,
}: SitesKmzMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined

  const { isLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: apiKey ?? '',
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const center = getBarycenter(sites)
  const selectedSite = sites.find((s) => s.id === selectedId) ?? null

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  const handleResetView = useCallback(() => {
    if (!mapRef.current) return
    mapRef.current.setCenter(center)
    mapRef.current.setZoom(sites.length > 1 ? 10 : 13)
  }, [center, sites.length])

  const handleDelete = async (siteId: string) => {
    if (!onDeleteSite) return
    setDeletingId(siteId)
    try {
      await onDeleteSite(siteId)
      if (selectedId === siteId) setSelectedId(null)
    } finally {
      setDeletingId(null)
    }
  }

  if (!apiKey) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-700"
        style={{ height }}
      >
        VITE_GOOGLE_MAPS_API_KEY non configurée
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

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50"
        style={{ height }}
      >
        <svg className="h-5 w-5 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
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
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={sites.length > 1 ? 10 : 13}
          onLoad={onMapLoad}
          options={{ streetViewControl: false, mapTypeControl: false }}
        >
          {sites.map((site) => (
            <Marker
              key={site.id}
              position={{ lat: site.latitude, lng: site.longitude }}
              icon={makeSvgMarkerUrl(site.couleurMarqueur ?? DEFAULT_COLOR)}
              onClick={() => setSelectedId(site.id)}
            />
          ))}

          {selectedSite && (
            <InfoWindow
              position={{ lat: selectedSite.latitude, lng: selectedSite.longitude }}
              onCloseClick={() => setSelectedId(null)}
            >
              <div className="min-w-[180px] space-y-1.5 p-1 text-sm">
                <p className="font-semibold text-gray-900">{selectedSite.nom}</p>
                {selectedSite.description && (
                  <p className="text-xs text-gray-600">{selectedSite.description}</p>
                )}
                <p className="font-mono text-xs text-gray-500">
                  {selectedSite.latitude.toFixed(6)}, {selectedSite.longitude.toFixed(6)}
                </p>
                {selectedSite.altitude != null && (
                  <p className="text-xs text-gray-500">
                    Altitude : {selectedSite.altitude.toFixed(0)} m
                  </p>
                )}
                {!readonly && onDeleteSite && (
                  <button
                    type="button"
                    onClick={() => void handleDelete(selectedSite.id)}
                    disabled={deletingId === selectedSite.id}
                    className="mt-2 w-full rounded bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId === selectedSite.id ? 'Suppression...' : 'Supprimer ce site'}
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  )
}
