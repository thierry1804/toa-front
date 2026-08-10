import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { entrepriseApi, type EntrepriseCreate, type EntrepriseUpdate } from '@/api/entrepriseApi'
import { ENTREPRISES_KEY } from '@/data/constant/query'

export function useEntreprises() {
  return useQuery({
    queryKey: ENTREPRISES_KEY,
    queryFn: entrepriseApi.list,
    select: (data) => data.member,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCreateEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: EntrepriseCreate) => entrepriseApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ENTREPRISES_KEY })
    },
  })
}

export function useUpdateEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntrepriseUpdate }) =>
      entrepriseApi.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ENTREPRISES_KEY })
    },
  })
}

export function useDeleteEntreprise() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => entrepriseApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ENTREPRISES_KEY })
    },
  })
}
