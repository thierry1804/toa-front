import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referentielApi } from '@/api/referentielApi'
import {
  REFERENTIEL_IMPORT_KMZ_KEY,
  REFERENTIEL_SITES_KEY,
  REFERENTIEL_SITES_GEOJSON_KEY,
} from '@/data/constant/query'

export function useImportKmzList() {
  return useQuery({
    queryKey: REFERENTIEL_IMPORT_KMZ_KEY,
    queryFn: referentielApi.listImportKmz,
    select: (data) => data.member,
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

export function useSiteList(page = 1) {
  return useQuery({
    queryKey: [...REFERENTIEL_SITES_KEY, page],
    queryFn: () => referentielApi.listSites(page),
  })
}

export function useSitesGeoJson() {
  return useQuery({
    queryKey: REFERENTIEL_SITES_GEOJSON_KEY,
    queryFn: referentielApi.fetchSitesGeoJson,
    staleTime: 60 * 1000,
  })
}
