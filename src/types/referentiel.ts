export interface ImportKmzSite {
  id: string
  nomFichier: string
  originalFilename: string | null
  importedAt: string
  nombreSites: number
}

export interface Site {
  id: string
  codeSite: string
  nomSite: string
  latitude: number
  longitude: number
  altitude: number | null
  description: string | null
  couleurMarqueur: string | null
  region: string | null
  fokontany: string | null
  commune: string | null
  district: string | null
  situation: string | null
  sourceKmz: boolean
  createdAt: string
  updatedAt: string
  importKmz: Pick<ImportKmzSite, 'id' | 'nomFichier'> | null
}

export interface SiteGeoJsonFeature {
  id: string
  n: string
  a: number | null
  c: string | null
  fok: string | null
  com: string | null
  dis: string | null
}

export interface KmzImportResponse {
  importId: string
  nomFichier: string
  nombreSites: number
  sitesIgnores: number
  sites: Array<{
    id: string
    codeSite: string
    nomSite: string
    latitude: number
    longitude: number
    altitude: number | null
    fokontany: string | null
    commune: string | null
    district: string | null
    couleurMarqueur: string | null
  }>
}
