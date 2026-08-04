import api from '@/lib/axios'
import type { Site, ImportKmzSite, KmzImportResponse, SiteGeoJsonFeature } from '@/types/referentiel'
import type { HydraCollection } from '@/types'
import type { FeatureCollection, Point } from 'geojson'

export const referentielApi = {
  importKmzSites: (file: File): Promise<KmzImportResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<KmzImportResponse>('/api/referentiel/sites/import-kmz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  listImportKmz: (): Promise<{ member: ImportKmzSite[]; totalItems: number }> =>
    api.get('/api/referentiel/import-kmz').then((r) => r.data),

  deleteImportKmz: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/import-kmz/${id}`).then((r) => r.data),

  listSites: (page = 1): Promise<HydraCollection<Site>> =>
    api.get<HydraCollection<Site>>(`/api/referentiel/sites?page=${page}`).then((r) => r.data),

  fetchSitesGeoJson: (): Promise<FeatureCollection<Point, SiteGeoJsonFeature>> =>
    api
      .get<FeatureCollection<Point, SiteGeoJsonFeature>>('/api/referentiel/sites/geojson')
      .then((r) => r.data),

  fetchSiteByCode: (code: string): Promise<{ codeSite: string; nomSite: string }> =>
    api
      .get<{ codeSite: string; nomSite: string }>(`/api/referentiel/sites/by-code/${encodeURIComponent(code)}`)
      .then((r) => r.data),

  fetchSiteSearch: (q: string, limit = 10): Promise<{ codeSite: string; nomSite: string }[]> =>
    api
      .get<{ codeSite: string; nomSite: string }[]>('/api/referentiel/sites/search', {
        params: { q, limit },
      })
      .then((r) => r.data),
}
