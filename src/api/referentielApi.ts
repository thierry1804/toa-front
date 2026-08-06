import api from '@/lib/axios'
import type { Site, ImportKmzSite, KmzImportResponse, SiteGeoJsonFeature, CategorieRisque, CategorieRisqueInput, CategorieRisqueListResponse, InstallationEquipement, InstallationEquipementInput, InstallationEquipementListResponse } from '@/types/referentiel'
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

  listCategoriesRisque: (params?: { page?: number; limit?: number; search?: string }): Promise<CategorieRisqueListResponse> =>
    api.get<CategorieRisqueListResponse>('/api/referentiel/categories-risque-list', { params }).then((r) => r.data),

  getAllCategoriesRisque: (): Promise<CategorieRisqueListResponse> =>
    api.get<CategorieRisqueListResponse>('/api/referentiel/categories-risque-all').then((r) => r.data),

  createCategorieRisque: (data: CategorieRisqueInput): Promise<CategorieRisque> =>
    api.post<CategorieRisque>('/api/referentiel/categories-risque', data).then((r) => r.data),

  updateCategorieRisque: (id: string, data: CategorieRisqueInput): Promise<CategorieRisque> =>
    api.patch<CategorieRisque>(`/api/referentiel/categories-risque/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  deleteCategorieRisque: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/categories-risque/${id}`).then(() => undefined),

  listInstallationsEquipements: (params?: { page?: number; limit?: number; search?: string }): Promise<InstallationEquipementListResponse> =>
    api.get<InstallationEquipementListResponse>('/api/referentiel/installations-equipements-list', { params }).then((r) => r.data),

  getAllInstallationsEquipements: (): Promise<InstallationEquipementListResponse> =>
    api.get<InstallationEquipementListResponse>('/api/referentiel/installations-equipements-all').then((r) => r.data),

  createInstallationEquipement: (data: InstallationEquipementInput): Promise<InstallationEquipement> =>
    api.post<InstallationEquipement>('/api/referentiel/installations-equipements', data).then((r) => r.data),

  updateInstallationEquipement: (id: string, data: InstallationEquipementInput): Promise<InstallationEquipement> =>
    api.patch<InstallationEquipement>(`/api/referentiel/installations-equipements/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  deleteInstallationEquipement: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/installations-equipements/${id}`).then(() => undefined),
}
