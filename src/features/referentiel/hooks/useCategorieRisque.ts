import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referentielApi } from '@/api/referentielApi'
import type { CategorieRisqueInput } from '@/types/referentiel'
import { REFERENTIEL_CATEGORIES_RISQUE_KEY } from '@/data/constant/query'

export function useCategoriesRisqueAll() {
  return useQuery({
    queryKey: [...REFERENTIEL_CATEGORIES_RISQUE_KEY, 'all'],
    queryFn: () => referentielApi.getAllCategoriesRisque(),
    staleTime: 5 * 60 * 1000,
  })
}

export function useCategoriesRisque(page = 1, search = '') {
  return useQuery({
    queryKey: [...REFERENTIEL_CATEGORIES_RISQUE_KEY, { page, search }],
    queryFn: () => referentielApi.listCategoriesRisque({ page, limit: 20, search: search || undefined }),
  })
}

export function useCreateCategorieRisque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CategorieRisqueInput) => referentielApi.createCategorieRisque(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_CATEGORIES_RISQUE_KEY })
    },
  })
}

export function useUpdateCategorieRisque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CategorieRisqueInput }) =>
      referentielApi.updateCategorieRisque(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_CATEGORIES_RISQUE_KEY })
    },
  })
}

export function useDeleteCategorieRisque() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => referentielApi.deleteCategorieRisque(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_CATEGORIES_RISQUE_KEY })
    },
  })
}
