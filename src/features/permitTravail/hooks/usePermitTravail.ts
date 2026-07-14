import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permitTravailApi } from '@/api/permitTravailApi'
import { PERMIT_TRAVAIL_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type { PermitTravail, PermitTravailInput, StatutPermitTravailPdf, VersionPermitTravail } from '@/types/permitTravail'

const PDF_POLL_INTERVAL_MS = 2_000
const PDF_POLL_TIMEOUT_MS  = 60_000

export function usePermitTravailPdf(permitId: string, opts?: { enabled?: boolean }) {
  const hookEnabled = opts?.enabled ?? true
  const addToast = useUiStore((s) => s.addToast)

  const [pdfStatut, setPdfStatut]   = useState<StatutPermitTravailPdf | null>(null)
  const [pdfMeta, setPdfMeta]       = useState<{ genereAt?: string; tailleFichier?: number } | null>(null)
  const [pollError, setPollError]   = useState<string | null>(null)
  const [isPolling, setIsPolling]   = useState(false)

  const pollingRef    = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPollingRef  = useRef(false)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const { data: initialStatus } = useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, permitId, 'pdf-status'],
    queryFn: () => permitTravailApi.getPdfStatus(permitId),
    enabled: !!permitId && hookEnabled,
    retry: false,
    staleTime: 30_000,
  })

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null }
    isPollingRef.current = false
    setIsPolling(false)
  }

  const startPolling = () => {
    if (isPollingRef.current) return
    isPollingRef.current = true
    setIsPolling(true)

    timeoutRef.current = setTimeout(() => {
      stopPolling()
      setPdfStatut('ERREUR')
      setPollError('Génération trop longue, réessayez')
      addToast({ message: 'Génération trop longue, réessayez', type: 'error' })
    }, PDF_POLL_TIMEOUT_MS)

    pollingRef.current = setInterval(() => {
      void (async () => {
        try {
          const status = await permitTravailApi.getPdfStatus(permitId)
          setPdfStatut(status.statut)
          if (status.genereAt) {
            setPdfMeta({
              genereAt: status.genereAt ?? undefined,
              tailleFichier: status.tailleFichier ?? undefined,
            })
          }
          if (status.statut === 'GENERE') {
            stopPolling()
            addToast({ message: 'PDF généré avec succès', type: 'success' })
          } else if (status.statut === 'ERREUR') {
            stopPolling()
            setPollError('Erreur lors de la génération du PDF')
            addToast({ message: 'Erreur lors de la génération du PDF', type: 'error' })
          }
        } catch {
          // silent — keep polling
        }
      })()
    }, PDF_POLL_INTERVAL_MS)
  }

  useEffect(() => {
    if (!initialStatus || isPollingRef.current) return
    setPdfStatut(initialStatus.statut)
    if (initialStatus.genereAt) {
      setPdfMeta({
        genereAt: initialStatus.genereAt ?? undefined,
        tailleFichier: initialStatus.tailleFichier ?? undefined,
      })
    }
    if (initialStatus.statut === 'EN_COURS') {
      startPolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus])

  const generatePdf = async () => {
    setPdfStatut('EN_COURS')
    setPollError(null)
    try {
      await permitTravailApi.generatePdf(permitId)
      startPolling()
    } catch {
      setPdfStatut('ERREUR')
      setPollError('Erreur lors de la génération du PDF')
      addToast({ message: 'Erreur lors de la génération du PDF', type: 'error' })
    }
  }

  const downloadPdf = async () => {
    try {
      await permitTravailApi.downloadPdf(permitId)
    } catch {
      addToast({ message: 'Erreur lors du téléchargement du PDF', type: 'error' })
    }
  }

  return { pdfStatut, isPolling, pdfMeta, pollError, generatePdf, downloadPdf }
}

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

export function usePermitTravailVersions(id: string) {
  return useQuery<VersionPermitTravail[]>({
    queryKey: [...PERMIT_TRAVAIL_KEY, id, 'versions'],
    queryFn: () => permitTravailApi.getVersions(id),
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

  const resoumettresMutation = useMutation({
    mutationFn: ({ id, motif }: { id: string; motif?: string }) =>
      permitTravailApi.resoumettre(id, motif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Permis resoumis — équipe HSE notifiée', type: 'success' })
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

  const resoumettrePermit = async (id: string, motif?: string): Promise<PermitTravail> => {
    return resoumettresMutation.mutateAsync({ id, motif })
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
    resoumettrePermit,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
    isSubmitting: soumettresMutation.isPending,
    isValidating: validerMutation.isPending,
    isRefusing: refuserMutation.isPending,
    isResoumitting: resoumettresMutation.isPending,
  }
}
