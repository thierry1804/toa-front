import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referentielApi } from '@/api/referentielApi'
import { sortByDateDesc } from '@/lib/listOrder'
import {
  REFERENTIEL_IMPORT_KMZ_KEY,
  REFERENTIEL_IMPORT_SPREADSHEET_KEY,
  REFERENTIEL_SITES_KEY,
  REFERENTIEL_SITES_GEOJSON_KEY,
} from '@/data/constant/query'

export function useImportKmzList() {
  return useQuery({
    queryKey: REFERENTIEL_IMPORT_KMZ_KEY,
    queryFn: referentielApi.listImportKmz,
    select: (data) => sortByDateDesc(data.member, (item) => item.importedAt),
  })
}

export function usePreviewKmzImport() {
  return useMutation({
    mutationFn: (file: File) => referentielApi.previewKmzImport(file),
  })
}

export function useImportKmz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => referentielApi.importKmzSites(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_IMPORT_KMZ_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_GEOJSON_KEY })
    },
  })
}

export function useDeleteImportKmz() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => referentielApi.deleteImportKmz(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_IMPORT_KMZ_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_GEOJSON_KEY })
    },
  })
}

export function useImportSpreadsheetList() {
  return useQuery({
    queryKey: REFERENTIEL_IMPORT_SPREADSHEET_KEY,
    queryFn: referentielApi.listImportSpreadsheet,
    select: (data) => sortByDateDesc(data.member, (item) => item.importedAt),
  })
}

export function usePreviewSpreadsheetImport() {
  return useMutation({
    mutationFn: (file: File) => referentielApi.previewSpreadsheetImport(file),
  })
}

export function useImportSpreadsheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => referentielApi.importSpreadsheetSites(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_IMPORT_SPREADSHEET_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_GEOJSON_KEY })
    },
  })
}

export function useDeleteImportSpreadsheet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => referentielApi.deleteImportSpreadsheet(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_IMPORT_SPREADSHEET_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_KEY })
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_SITES_GEOJSON_KEY })
    },
  })
}

export function useSiteList(page = 1) {
  return useQuery({
    queryKey: [...REFERENTIEL_SITES_KEY, page],
    queryFn: () => referentielApi.listSites(page),
  })
}

export function useSitesGeoJson(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: REFERENTIEL_SITES_GEOJSON_KEY,
    queryFn: referentielApi.fetchSitesGeoJson,
    staleTime: 60 * 1000,
    enabled: options?.enabled !== false,
    retry: false,
  })
}
