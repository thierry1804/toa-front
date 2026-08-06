import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { referentielApi } from '@/api/referentielApi'
import type { InstallationEquipementInput } from '@/types/referentiel'
import { REFERENTIEL_INSTALLATIONS_KEY } from '@/data/constant/query'

export function useInstallationsEquipements(page = 1, search = '') {
  return useQuery({
    queryKey: [...REFERENTIEL_INSTALLATIONS_KEY, { page, search }],
    queryFn: () => referentielApi.listInstallationsEquipements({ page, limit: 20, search: search || undefined }),
  })
}

export function useCreateInstallationEquipement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: InstallationEquipementInput) => referentielApi.createInstallationEquipement(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_INSTALLATIONS_KEY })
    },
  })
}

export function useUpdateInstallationEquipement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: InstallationEquipementInput }) =>
      referentielApi.updateInstallationEquipement(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_INSTALLATIONS_KEY })
    },
  })
}

export function useDeleteInstallationEquipement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => referentielApi.deleteInstallationEquipement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: REFERENTIEL_INSTALLATIONS_KEY })
    },
  })
}
