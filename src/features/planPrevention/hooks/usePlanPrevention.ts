import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { planPreventionApi } from '@/api/planPreventionApi'
import { PLAN_PREVENTION_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type {
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

  const addRisque = async (id: string, data: RisquePreventionInput) => {
    return addRisqueMutation.mutateAsync({ id, data })
  }

  return {
    createPlan,
    updatePlan,
    uploadDocument,
    importKmz,
    soumettrePlan,
    examinerPlan,
    addRisque,
    missingDocuments,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
    isImportingKmz: importKmzMutation.isPending,
    isSubmitting: soumettresMutation.isPending,
    isExamining: examinerMutation.isPending,
  }
}
