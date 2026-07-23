import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { INTERVENTION_KEY, PERMIT_TRAVAIL_KEY, SUIVI_JOURNALIER_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type {
  EvaluationRisqueInput,
  Intervention,
  SuiviJournalierInput,
  SuiviJournalierUpdateInput,
  InterventionSuiviFilters,
} from '@/types/intervention'

const SUIVI_REFETCH_MS = 60_000

export function useInterventionDashboard(filters?: InterventionSuiviFilters) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, 'dashboard', filters],
    queryFn: () => interventionApi.getDashboard(filters),
    staleTime: SUIVI_REFETCH_MS,
    refetchInterval: SUIVI_REFETCH_MS,
  })
}

export function useInterventionSuiviHse(id: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, id, 'suivi-hse'],
    queryFn: () => interventionApi.getSuiviHse(id),
    enabled: !!id,
  })
}

export function useInterventionStatsJournalieres(codeSite?: string, date?: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, 'stats-journalieres', codeSite, date],
    queryFn: () => interventionApi.getStatsJournalieres(codeSite!, date),
    enabled: !!codeSite,
    staleTime: SUIVI_REFETCH_MS,
    refetchInterval: SUIVI_REFETCH_MS,
  })
}

export function useInterventionDetail(id: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, id],
    queryFn: () => interventionApi.getById(id),
    enabled: !!id,
  })
}

export function useInterventionSuivis(interventionId: string) {
  return useQuery({
    queryKey: [...SUIVI_JOURNALIER_KEY, interventionId],
    queryFn: () => interventionApi.getSuivis(interventionId),
    enabled: !!interventionId,
    select: (data) => [...(data.member ?? [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    ),
  })
}

export function useInterventionRisques(interventionId: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, interventionId, 'risques'],
    queryFn: () => interventionApi.getRisques(interventionId),
    enabled: !!interventionId,
    select: (data) => data.member,
  })
}

export function useIntervention() {
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)

  const createMutation = useMutation({
    mutationFn: (permitTravailId: string) => interventionApi.create(permitTravailId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: INTERVENTION_KEY })
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      return data
    },
    onError: () => {
      addToast({ message: "Erreur lors de la création de l'évaluation", type: 'error' })
    },
  })

  const updateRisqueMutation = useMutation({
    mutationFn: ({
      interventionId,
      risqueId,
      data,
    }: {
      interventionId: string
      risqueId: string
      data: EvaluationRisqueInput
    }) => interventionApi.updateRisque(interventionId, risqueId, data),
    onSuccess: (_, { interventionId }) => {
      queryClient.invalidateQueries({ queryKey: [...INTERVENTION_KEY, interventionId] })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la mise à jour du risque', type: 'error' })
    },
  })

  const validerMutation = useMutation({
    mutationFn: (id: string) => interventionApi.validerEvaluation(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...INTERVENTION_KEY, data.id] })
      addToast({ message: 'Évaluation validée avec succès', type: 'success' })
      return data
    },
  })

  const createIntervention = async (permitTravailId: string): Promise<Intervention> => {
    return createMutation.mutateAsync(permitTravailId)
  }

  const updateRisque = async (
    interventionId: string,
    risqueId: string,
    data: EvaluationRisqueInput,
  ) => {
    return updateRisqueMutation.mutateAsync({ interventionId, risqueId, data })
  }

  const validerEvaluation = async (id: string): Promise<Intervention> => {
    try {
      return await validerMutation.mutateAsync(id)
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { detail?: string; violations?: { risqueId: string; description: string }[] } } })
        ?.response?.data
      const detail = response?.detail ?? ''
      if (detail.includes('risques non réévalués') || detail.includes('non_reevalues')) {
        addToast({ message: 'Certains risques ne sont pas encore réévalués', type: 'error' })
      } else {
        addToast({ message: "Erreur lors de la validation de l'évaluation", type: 'error' })
      }
      throw err
    }
  }

  return {
    createIntervention,
    updateRisque,
    validerEvaluation,
    isCreating: createMutation.isPending,
    isUpdatingRisque: updateRisqueMutation.isPending,
    isValidating: validerMutation.isPending,
  }
}

export function useSuiviJournalier(interventionId: string) {
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)

  const suiviKey = [...SUIVI_JOURNALIER_KEY, interventionId]

  const createMutation = useMutation({
    mutationFn: (data: SuiviJournalierInput) => interventionApi.createSuivi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suiviKey })
      addToast({ message: 'Suivi journalier enregistré', type: 'success' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SuiviJournalierUpdateInput }) =>
      interventionApi.updateSuivi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suiviKey })
      addToast({ message: 'Suivi mis à jour', type: 'success' })
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ suiviId, file }: { suiviId: string; file: File }) =>
      interventionApi.uploadSuiviDocument(suiviId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suiviKey })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de l\'upload du document', type: 'error' })
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: ({ suiviId, docId }: { suiviId: string; docId: string }) =>
      interventionApi.deleteSuiviDocument(suiviId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: suiviKey })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la suppression du document', type: 'error' })
    },
  })

  return {
    createSuivi: (data: SuiviJournalierInput) => createMutation.mutateAsync(data),
    updateSuivi: (id: string, data: SuiviJournalierUpdateInput) =>
      updateMutation.mutateAsync({ id, data }),
    uploadSuiviDocument: (suiviId: string, file: File) =>
      uploadDocumentMutation.mutateAsync({ suiviId, file }),
    deleteSuiviDocument: (suiviId: string, docId: string) =>
      deleteDocumentMutation.mutateAsync({ suiviId, docId }),
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
  }
}
