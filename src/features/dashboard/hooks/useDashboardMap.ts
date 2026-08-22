import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { activityPlanningApi } from '@/api/activityPlanningApi'
import { useSitesGeoJson } from '@/features/referentiel/hooks/useReferentiel'
import type { FeatureCollection, Point } from 'geojson'
import type { SiteGeoJsonFeature } from '@/types/referentiel'

export function useDashboardMap(
  filterProvider: string,
  filterProcess: string,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false
  const geoJsonQuery = useSitesGeoJson({ enabled })

  const planningsQuery = useQuery({
    queryKey: ['activity_plannings', 'dashboard_map'],
    queryFn: () => activityPlanningApi.list({ itemsPerPage: 1000 }),
    select: (d) => d.member,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: false,
  })

  const plannings = planningsQuery.data ?? []

  const prestataires = useMemo(
    () => [...new Set(plannings.map((p) => p.provider).filter(Boolean))].sort(),
    [plannings],
  )

  const processTypes = useMemo(
    () => [...new Set(plannings.map((p) => p.process).filter(Boolean))].sort(),
    [plannings],
  )

  const filteredGeoJson = useMemo((): FeatureCollection<Point, SiteGeoJsonFeature> | null => {
    const gj = geoJsonQuery.data
    if (!gj) return null
    if (!filterProvider && !filterProcess) return gj

    const matchingCodes = new Set(
      plannings
        .filter(
          (p) =>
            (!filterProvider || p.provider === filterProvider) &&
            (!filterProcess || p.process === filterProcess),
        )
        .map((p) => p.siteCode),
    )

    return {
      ...gj,
      features: gj.features.filter((f) => matchingCodes.has(f.properties.cs)),
    }
  }, [geoJsonQuery.data, plannings, filterProvider, filterProcess])

  return {
    filteredGeoJson,
    prestataires,
    processTypes,
    isLoading: geoJsonQuery.isLoading || planningsQuery.isLoading,
  }
}
