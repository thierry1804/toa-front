import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permitTravailApi } from '@/api/permitTravailApi'
import { PERMIT_TRAVAIL_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type { PermitTravail, PermitTravailInput } from '@/types/permitTravail'

export function usePermitsTravail(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, params],
    queryFn: () => permitTravailApi.list(params),
    select: (data) => data.member,
  })
}

export function usePermitTravailDetail(id: string) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, id],
    queryFn: () => permitTravailApi.getById(id),
    enabled: !!id,
  })
}

export function usePermitTravail() {
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)

  const createMutation = useMutation({
    mutationFn: (data: PermitTravailInput) => permitTravailApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la création du permis', type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PermitTravailInput> }) =>
      permitTravailApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la mise à jour du permis', type: 'error' })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, type, file }: { id: string; type: string; file: File }) =>
      permitTravailApi.uploadDocument(id, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Document téléversé avec succès', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors du téléversement du document', type: 'error' })
    },
  })

  const soumettresMutation = useMutation({
    mutationFn: (id: string) => permitTravailApi.soumettre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Permis soumis avec succès', type: 'success' })
    },
  })

  const validerMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      permitTravailApi.valider(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Permis validé avec succès', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la validation du permis', type: 'error' })
    },
  })

  const refuserMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire: string }) =>
      permitTravailApi.refuser(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Permis refusé', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors du refus du permis', type: 'error' })
    },
  })

  const createPermit = async (data: PermitTravailInput): Promise<PermitTravail> => {
    return createMutation.mutateAsync(data)
  }

  const updatePermit = async (id: string, data: Partial<PermitTravailInput>) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const uploadDocument = async (id: string, type: string, file: File) => {
    return uploadMutation.mutateAsync({ id, type, file })
  }

  const validerPermit = async (id: string, commentaire?: string): Promise<PermitTravail> => {
    return validerMutation.mutateAsync({ id, commentaire })
  }

  const refuserPermit = async (id: string, commentaire: string): Promise<void> => {
    await refuserMutation.mutateAsync({ id, commentaire })
  }

  const soumettrePermit = async (id: string): Promise<void> => {
    try {
      await soumettresMutation.mutateAsync(id)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('Plan de prévention validé requis') || detail.includes('plan_prevention_requis')) {
        addToast({ message: 'Plan de prévention validé requis', type: 'error' })
        throw Object.assign(new Error('plan_prevention_required'), { detail })
      }
      if (detail.includes('Engagement obligatoire') || detail.includes('engagement_obligatoire')) {
        addToast({ message: 'Engagement obligatoire', type: 'error' })
        throw Object.assign(new Error('engagement_required'), { detail })
      }
      if (detail.includes('2 permis requis') || detail.includes('deux_permis_requis')) {
        addToast({ message: '2 permis requis pour un nouveau site', type: 'error' })
        throw Object.assign(new Error('deux_permis_requis'), { detail })
      }
      addToast({ message: 'Erreur lors de la soumission du permis', type: 'error' })
      throw err
    }
  }

  return {
    createPermit,
    updatePermit,
    uploadDocument,
    soumettrePermit,
    validerPermit,
    refuserPermit,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
    isSubmitting: soumettresMutation.isPending,
    isValidating: validerMutation.isPending,
    isRefusing: refuserMutation.isPending,
  }
}
