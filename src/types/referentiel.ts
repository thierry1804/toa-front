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
  typeSite: string | null
  zone: string | null
  typePylone: string | null
  hauteurPylone: number | null
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

export interface CategorieRisque {
  id: string
  nom: string
  typePermis?: 'ELECTRIQUE' | 'HAUTEUR' | null
  createdAt: string
  updatedAt: string | null
}

export interface CategorieRisqueInput {
  nom: string
  typePermis?: 'ELECTRIQUE' | 'HAUTEUR' | null
}

export interface InstallationEquipement {
  id: string
  nom: string
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

export interface InstallationEquipementInput {
  nom: string
}

export interface InstallationEquipementListResponse {
  member: InstallationEquipement[]
  totalItems: number
}

export interface CategorieRisqueListResponse {
  member: CategorieRisque[]
  totalItems: number
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
    typeSite: string | null
    zone: string | null
    typePylone: string | null
    hauteurPylone: number | null
  }>
}
