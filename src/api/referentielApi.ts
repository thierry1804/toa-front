import api from '@/lib/axios'
import { withNewestFirst } from '@/lib/listOrder'
import { withSnapshotFallback } from '@/offline/withSnapshotFallback'
import { snapshotList, snapshotSitesGeoJson, snapshotSiteByCode, snapshotSiteSearch } from '@/offline/snapshotRead'
import type { Site, ImportKmzSite, ImportSpreadsheetSite, SiteImportResponse, SiteImportPreview, SiteGeoJsonFeature, CategorieRisque, CategorieRisqueInput, CategorieRisqueListResponse, InstallationEquipement, InstallationEquipementInput, InstallationEquipementListResponse } from '@/types/referentiel'
import type { HydraCollection } from '@/types'
import type { FeatureCollection, Point } from 'geojson'

export const referentielApi = {
  importKmzSites: (file: File): Promise<SiteImportResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<SiteImportResponse>('/api/referentiel/sites/import-kmz', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  previewKmzImport: (file: File): Promise<SiteImportPreview> => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<SiteImportPreview>('/api/referentiel/sites/import-kmz/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  listImportKmz: (): Promise<{ member: ImportKmzSite[]; totalItems: number }> =>
    api.get('/api/referentiel/import-kmz').then((r) => r.data),

  deleteImportKmz: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/import-kmz/${id}`).then((r) => r.data),

  importSpreadsheetSites: (file: File): Promise<SiteImportResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<SiteImportResponse>('/api/referentiel/sites/import-spreadsheet', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  previewSpreadsheetImport: (file: File): Promise<SiteImportPreview> => {
    const formData = new FormData()
    formData.append('file', file)
    return api
      .post<SiteImportPreview>('/api/referentiel/sites/import-spreadsheet/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },

  listImportSpreadsheet: (): Promise<{ member: ImportSpreadsheetSite[]; totalItems: number }> =>
    api.get('/api/referentiel/import-spreadsheet').then((r) => r.data),

  deleteImportSpreadsheet: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/import-spreadsheet/${id}`).then((r) => r.data),

  listSites: (page = 1): Promise<HydraCollection<Site>> =>
    withSnapshotFallback(
      () =>
        api
          .get<HydraCollection<Site>>('/api/referentiel/sites', {
            params: withNewestFirst({ page }),
          })
          .then((r) => r.data),
      () => snapshotList<Site>('sites', { page, itemsPerPage: 30 }),
    ),

  fetchSitesGeoJson: (): Promise<FeatureCollection<Point, SiteGeoJsonFeature>> =>
    withSnapshotFallback(
      () =>
        api
          .get<FeatureCollection<Point, SiteGeoJsonFeature>>('/api/referentiel/sites/geojson')
          .then((r) => r.data),
      () => snapshotSitesGeoJson(),
    ),

  fetchSiteByCode: (code: string): Promise<{ codeSite: string; nomSite: string }> =>
    withSnapshotFallback(
      () =>
        api
          .get<{ codeSite: string; nomSite: string }>(
            `/api/referentiel/sites/by-code/${encodeURIComponent(code)}`,
          )
          .then((r) => r.data),
      () => snapshotSiteByCode(code),
    ),

  fetchSiteSearch: (q: string, limit = 10): Promise<{ codeSite: string; nomSite: string }[]> =>
    withSnapshotFallback(
      () =>
        api
          .get<{ codeSite: string; nomSite: string }[]>('/api/referentiel/sites/search', {
            params: { q, limit },
          })
          .then((r) => r.data),
      () => snapshotSiteSearch(q, limit),
    ),

  listCategoriesRisque: (params?: { page?: number; limit?: number; search?: string }): Promise<CategorieRisqueListResponse> =>
    withSnapshotFallback(
      () =>
        api
          .get<CategorieRisqueListResponse>('/api/referentiel/categories-risque-list', { params: withNewestFirst(params) })
          .then((r) => r.data),
      () => snapshotList<CategorieRisque>('categoriesRisque', params),
    ),

  getAllCategoriesRisque: (): Promise<CategorieRisqueListResponse> =>
    withSnapshotFallback(
      () =>
        api
          .get<CategorieRisqueListResponse>('/api/referentiel/categories-risque-all', { params: withNewestFirst() })
          .then((r) => r.data),
      () => snapshotList<CategorieRisque>('categoriesRisque'),
    ),

  createCategorieRisque: (data: CategorieRisqueInput): Promise<CategorieRisque> =>
    api.post<CategorieRisque>('/api/referentiel/categories-risque', data).then((r) => r.data),

  updateCategorieRisque: (id: string, data: CategorieRisqueInput): Promise<CategorieRisque> =>
    api.patch<CategorieRisque>(`/api/referentiel/categories-risque/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  deleteCategorieRisque: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/categories-risque/${id}`).then(() => undefined),

  listInstallationsEquipements: (params?: { page?: number; limit?: number; search?: string }): Promise<InstallationEquipementListResponse> =>
    withSnapshotFallback(
      () =>
        api
          .get<InstallationEquipementListResponse>('/api/referentiel/installations-equipements-list', {
            params: withNewestFirst(params),
          })
          .then((r) => r.data),
      () => snapshotList<InstallationEquipement>('installationsEquipements', params),
    ),

  getAllInstallationsEquipements: (): Promise<InstallationEquipementListResponse> =>
    withSnapshotFallback(
      () =>
        api
          .get<InstallationEquipementListResponse>('/api/referentiel/installations-equipements-all')
          .then((r) => r.data),
      () => snapshotList<InstallationEquipement>('installationsEquipements'),
    ),

  createInstallationEquipement: (data: InstallationEquipementInput): Promise<InstallationEquipement> =>
    api.post<InstallationEquipement>('/api/referentiel/installations-equipements', data).then((r) => r.data),

  updateInstallationEquipement: (id: string, data: InstallationEquipementInput): Promise<InstallationEquipement> =>
    api.patch<InstallationEquipement>(`/api/referentiel/installations-equipements/${id}`, data, {
      headers: { 'Content-Type': 'application/merge-patch+json' },
    }).then((r) => r.data),

  deleteInstallationEquipement: (id: string): Promise<void> =>
    api.delete(`/api/referentiel/installations-equipements/${id}`).then(() => undefined),
}
