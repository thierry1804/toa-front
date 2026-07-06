import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { planPreventionApi } from '@/api/planPreventionApi'
import { PLAN_PREVENTION_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type {
  PlanPrevention,
  PlanPreventionInput,
  RisquePreventionInput,
} from '@/types/planPrevention'

function parseMissingDocuments(errorMessage: string): string[] {
  const match = errorMessage.match(/documents_manquants:\s*(.+)/)
  if (!match) return []
  return match[1].split(',').map((s) => s.trim())
}

export function usePlanPreventions(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PLAN_PREVENTION_KEY, params],
    queryFn: () => planPreventionApi.list(params),
    select: (data) => data.member,
  })
}

export function usePlanPreventionDetail(id: string) {
  return useQuery({
    queryKey: [...PLAN_PREVENTION_KEY, id],
    queryFn: () => planPreventionApi.getById(id),
    enabled: !!id,
  })
}

export function usePlanPrevention() {
  const queryClient = useQueryClient()
  const addToast = useUiStore((s) => s.addToast)
  const { t } = useTranslation()
  const [missingDocuments, setMissingDocuments] = useState<string[]>([])

  const createMutation = useMutation({
    mutationFn: (data: PlanPreventionInput) => planPreventionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la création du plan', type: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PlanPreventionInput> }) =>
      planPreventionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la mise à jour du plan', type: 'error' })
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ id, type, file }: { id: string; type: string; file: File }) =>
      planPreventionApi.uploadDocument(id, type, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      addToast({ message: 'Document téléversé avec succès', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors du téléversement du document', type: 'error' })
    },
  })

  const importKmzMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      planPreventionApi.importKmz(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      addToast({ message: 'Import KMZ réussi', type: 'success' })
    },
    onError: () => {
      addToast({ message: "Erreur lors de l'import KMZ", type: 'error' })
    },
  })

  const soumettresMutation = useMutation({
    mutationFn: (id: string) => planPreventionApi.soumettre(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      setMissingDocuments([])
      addToast({ message: 'Plan soumis avec succès', type: 'success' })
    },
  })

  const examinerMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      planPreventionApi.examiner(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      addToast({ message: 'Plan examiné avec succès', type: 'success' })
    },
  })

  const validerMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      planPreventionApi.valider(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
  })

  const refuserMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire: string }) =>
      planPreventionApi.refuser(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      addToast({ message: t('planPrevention.toast.refused'), type: 'success' })
    },
  })

  const resoumettresMutation = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif?: string }) =>
      planPreventionApi.resoumettre(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
      setMissingDocuments([])
      addToast({ message: 'Plan resoumis — équipe HSE notifiée', type: 'success' })
    },
  })

  const addRisqueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: RisquePreventionInput }) =>
      planPreventionApi.addRisque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
    onError: () => {
      addToast({ message: "Erreur lors de l'ajout du risque", type: 'error' })
    },
  })

  const updateRisqueMutation = useMutation({
    mutationFn: ({
      planId,
      risqueId,
      data,
    }: {
      planId: string
      risqueId: string
      data: RisquePreventionInput
    }) => planPreventionApi.updateRisque(planId, risqueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la mise à jour du risque', type: 'error' })
    },
  })

  const deleteRisqueMutation = useMutation({
    mutationFn: ({ planId, risqueId }: { planId: string; risqueId: string }) =>
      planPreventionApi.deleteRisque(planId, risqueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLAN_PREVENTION_KEY })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la suppression du risque', type: 'error' })
    },
  })

  const createPlan = async (data: PlanPreventionInput) => {
    return createMutation.mutateAsync(data)
  }

  const updatePlan = async (id: string, data: Partial<PlanPreventionInput>) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const uploadDocument = async (id: string, type: string, file: File) => {
    return uploadMutation.mutateAsync({ id, type, file })
  }

  const importKmz = async (id: string, file: File) => {
    return importKmzMutation.mutateAsync({ id, file })
  }

  const soumettrePlan = async (id: string) => {
    try {
      return await soumettresMutation.mutateAsync(id)
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      const missing = parseMissingDocuments(detail)
      setMissingDocuments(missing)
      if (missing.length > 0) {
        addToast({
          message: `Documents manquants : ${missing.join(', ')}`,
          type: 'error',
        })
      } else {
        addToast({ message: 'Erreur lors de la soumission du plan', type: 'error' })
      }
      throw err
    }
  }

  const examinerPlan = async (id: string, commentaire?: string): Promise<void> => {
    try {
      await examinerMutation.mutateAsync({ id, commentaire })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('Statut invalide')) {
        throw new Error('Statut invalide pour examen')
      }
      addToast({ message: "Erreur lors de l'examen du plan", type: 'error' })
      throw err
    }
  }

  const validerPlan = async (id: string, commentaire?: string): Promise<PlanPrevention> => {
    try {
      return await validerMutation.mutateAsync({ id, commentaire })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('Plan non examiné')) {
        throw new Error('Plan non examiné par Chef de Projet')
      }
      if (detail.includes('documents_manquants')) {
        const missing = parseMissingDocuments(detail)
        throw Object.assign(new Error('documents_manquants'), { missingDocuments: missing })
      }
      addToast({ message: t('planPrevention.toast.errorValidate'), type: 'error' })
      throw err
    }
  }

  const resoumettreplan = async (id: string, motif?: string): Promise<PlanPrevention> => {
    try {
      return await resoumettresMutation.mutateAsync({ id, motif })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('documents_manquants')) {
        const missing = parseMissingDocuments(detail)
        setMissingDocuments(missing)
        addToast({ message: `Documents manquants : ${missing.join(', ')}`, type: 'error' })
        throw Object.assign(new Error('documents_manquants'), { missingDocuments: missing })
      }
      if (detail.includes('statut_not_brouillon') || detail.includes('no_previous_refus')) {
        addToast({ message: 'Ce plan ne peut pas être resoumis', type: 'error' })
      } else {
        addToast({ message: 'Erreur lors de la resoumission du plan', type: 'error' })
      }
      throw err
    }
  }

  const refuserPlan = async (id: string, commentaire: string): Promise<void> => {
    try {
      await refuserMutation.mutateAsync({ id, commentaire })
    } catch (err: unknown) {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? ''
      if (detail.includes('Plan non examiné')) {
        throw new Error('Plan non examiné')
      }
      if (detail.includes('Commentaire obligatoire')) {
        throw new Error('Commentaire obligatoire en cas de refus')
      }
      addToast({ message: t('planPrevention.toast.errorRefuse'), type: 'error' })
      throw err
    }
  }

  const addRisque = async (id: string, data: RisquePreventionInput) => {
    return addRisqueMutation.mutateAsync({ id, data })
  }

  const updateRisque = async (
    planId: string,
    risqueId: string,
    data: RisquePreventionInput,
  ) => {
    return updateRisqueMutation.mutateAsync({ planId, risqueId, data })
  }

  const deleteRisque = async (planId: string, risqueId: string) => {
    return deleteRisqueMutation.mutateAsync({ planId, risqueId })
  }

  return {
    createPlan,
    updatePlan,
    uploadDocument,
    importKmz,
    soumettrePlan,
    resoumettreplan,
    examinerPlan,
    validerPlan,
    refuserPlan,
    addRisque,
    updateRisque,
    deleteRisque,
    missingDocuments,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
    isImportingKmz: importKmzMutation.isPending,
    isSubmitting: soumettresMutation.isPending,
    isResoumetting: resoumettresMutation.isPending,
    isExamining: examinerMutation.isPending,
    isValidating: validerMutation.isPending,
    isRefusing: refuserMutation.isPending,
    isUpdatingRisque: updateRisqueMutation.isPending,
    isDeletingRisque: deleteRisqueMutation.isPending,
  }
}
