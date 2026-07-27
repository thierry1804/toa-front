import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permitTravailApi } from '@/api/permitTravailApi'
import { interventionApi } from '@/api/interventionApi'
import { PERMIT_TRAVAIL_KEY, INTERVENTION_KEY, DASHBOARD_KEY } from '@/data/constant/query'
import { useUiStore } from '@/store/ui.store'
import type {
  PermitTravail,
  PermitTravailInput,
  StatutPermitTravailPdf,
  StatutPvReceptionPdf,
  VersionPermitTravail,
  PermitTravailSuiviFilters,
  DecisionCdpPvReception,
} from '@/types/permitTravail'

const SUIVI_REFETCH_MS = 60_000

export function useKpisIntervention(codeSite?: string, periode?: string) {
  return useQuery({
    queryKey: [...INTERVENTION_KEY, 'kpis', codeSite, periode],
    queryFn: () => interventionApi.getKpis(codeSite, periode),
    staleTime: SUIVI_REFETCH_MS,
    refetchInterval: SUIVI_REFETCH_MS,
  })
}

export function usePermitTravailSuivi(filters?: PermitTravailSuiviFilters) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, 'suivi', filters],
    queryFn: () => permitTravailApi.getSuivi(filters),
    staleTime: SUIVI_REFETCH_MS,
    refetchInterval: SUIVI_REFETCH_MS,
  })
}

export function usePermitTravailLogs(permitId: string, date?: string) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, permitId, 'logs', date ?? 'today'],
    queryFn: () => permitTravailApi.getLogs(permitId, date),
    enabled: !!permitId,
    select: (data) => data.member,
  })
}

export function usePermitTravailStatsJournalieres(
  date?: string,
  codeSite?: string,
  typePermis?: string,
) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, 'stats-journalieres', date, codeSite, typePermis],
    queryFn: () => permitTravailApi.getStatsJournalieres(date, codeSite, typePermis),
    staleTime: SUIVI_REFETCH_MS,
    refetchInterval: SUIVI_REFETCH_MS,
  })
}

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

const PV_POLL_INTERVAL_MS = 2_000
const PV_POLL_TIMEOUT_MS  = 60_000

export function usePvReceptionPdf(permitId: string, opts?: { enabled?: boolean }) {
  const hookEnabled = opts?.enabled ?? true
  const addToast = useUiStore((s) => s.addToast)

  const [pvStatut, setPvStatut]   = useState<StatutPvReceptionPdf | null>(null)
  const [pvMeta, setPvMeta]       = useState<{ genereAt?: string; tailleFichier?: number } | null>(null)
  const [pollError, setPollError]   = useState<string | null>(null)
  const [isPolling, setIsPolling]   = useState(false)

  const pollingRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPollingRef = useRef(false)

  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const { data: initialStatus } = useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, permitId, 'pv-status'],
    queryFn: () => permitTravailApi.getPvStatus(permitId),
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
      setPvStatut('ERREUR')
      setPollError('Génération trop longue, réessayez')
      addToast({ message: 'Génération du PV trop longue, réessayez', type: 'error' })
    }, PV_POLL_TIMEOUT_MS)

    pollingRef.current = setInterval(() => {
      void (async () => {
        try {
          const status = await permitTravailApi.getPvStatus(permitId)
          setPvStatut(status.statut)
          if (status.genereAt) {
            setPvMeta({
              genereAt: status.genereAt ?? undefined,
              tailleFichier: status.tailleFichier ?? undefined,
            })
          }
          if (status.statut === 'GENERE') {
            stopPolling()
            addToast({ message: 'PV de réception généré avec succès', type: 'success' })
          } else if (status.statut === 'ERREUR') {
            stopPolling()
            setPollError('Erreur lors de la génération du PV')
            addToast({ message: 'Erreur lors de la génération du PV de réception', type: 'error' })
          }
        } catch {
          // silent — keep polling
        }
      })()
    }, PV_POLL_INTERVAL_MS)
  }

  useEffect(() => {
    if (!initialStatus || isPollingRef.current) return
    setPvStatut(initialStatus.statut)
    if (initialStatus.genereAt) {
      setPvMeta({
        genereAt: initialStatus.genereAt ?? undefined,
        tailleFichier: initialStatus.tailleFichier ?? undefined,
      })
    }
    if (initialStatus.statut === 'EN_COURS') {
      startPolling()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialStatus])

  const downloadPv = async () => {
    try {
      await permitTravailApi.downloadPv(permitId)
    } catch {
      addToast({ message: 'Erreur lors du téléchargement du PV', type: 'error' })
    }
  }

  return { pvStatut, isPolling, pvMeta, pollError, downloadPv, startPolling }
}

export function usePermitTravailCloture(permitId: string) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, permitId, 'cloture'],
    queryFn: () => permitTravailApi.getCloture(permitId),
    enabled: !!permitId,
    retry: false,
    staleTime: 60_000,
  })
}

export function usePvDecision(permitId: string, opts?: { enabled?: boolean }) {
  return useQuery<DecisionCdpPvReception[]>({
    queryKey: [...PERMIT_TRAVAIL_KEY, permitId, 'pv-decision'],
    queryFn: () => permitTravailApi.getPvDecision(permitId),
    enabled: !!permitId && (opts?.enabled ?? true),
    retry: false,
    staleTime: 30_000,
  })
}

export function usePermitsTravail(params?: Record<string, string | string[]>) {
  return useQuery({
    queryKey: [...PERMIT_TRAVAIL_KEY, params],
    queryFn: () => permitTravailApi.list(params),
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

  const cloturerMutation = useMutation({
    mutationFn: ({ id, commentaire, accordClient }: { id: string; commentaire?: string; accordClient?: boolean }) =>
      permitTravailApi.cloturerPermit(id, { commentaire, accordClient }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'Permis clôturé — PV de réception en cours de génération', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la clôture du permis', type: 'error' })
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

  const validerPvMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire?: string }) =>
      permitTravailApi.validerPv(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      queryClient.invalidateQueries({ queryKey: [...INTERVENTION_KEY, 'kpis'] })
      queryClient.invalidateQueries({ queryKey: DASHBOARD_KEY })
      addToast({ message: 'PV de réception validé avec succès', type: 'success' })
      addToast({ message: 'HSE notifié pour archivage', type: 'info' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors de la validation du PV', type: 'error' })
    },
  })

  const refuserPvMutation = useMutation({
    mutationFn: ({ id, commentaire }: { id: string; commentaire: string }) =>
      permitTravailApi.refuserPv(id, commentaire),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMIT_TRAVAIL_KEY })
      addToast({ message: 'PV de réception refusé — prestataire notifié', type: 'success' })
    },
    onError: () => {
      addToast({ message: 'Erreur lors du refus du PV', type: 'error' })
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

  const cloturerPermit = async (id: string, commentaire?: string, accordClient?: boolean) => {
    return cloturerMutation.mutateAsync({ id, commentaire, accordClient })
  }

  const validerPv = async (id: string, commentaire?: string): Promise<{ signatureElectronique?: string }> => {
    await validerPvMutation.mutateAsync({ id, commentaire })
    try {
      const decisions = await permitTravailApi.getPvDecision(id)
      return { signatureElectronique: decisions.at(-1)?.signatureElectronique }
    } catch {
      return {}
    }
  }

  const refuserPv = async (id: string, commentaire: string): Promise<void> => {
    await refuserPvMutation.mutateAsync({ id, commentaire })
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
    cloturerPermit,
    validerPv,
    refuserPv,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isUploading: uploadMutation.isPending,
    isSubmitting: soumettresMutation.isPending,
    isValidating: validerMutation.isPending,
    isRefusing: refuserMutation.isPending,
    isResoumitting: resoumettresMutation.isPending,
    isCloturer: cloturerMutation.isPending,
    isValiderPv: validerPvMutation.isPending,
    isRefuserPv: refuserPvMutation.isPending,
  }
}
