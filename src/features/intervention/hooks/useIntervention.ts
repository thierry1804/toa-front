import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { interventionApi } from '@/api/interventionApi'
import { INTERVENTION_KEY, PERMIT_TRAVAIL_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type { EvaluationRisqueInput, Intervention } from '@/types/intervention'

export function useInterventionDetail(id: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, id],
    queryFn: () => interventionApi.getById(id),
    enabled: !!id,
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
