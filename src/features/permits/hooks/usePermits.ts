import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permitsApi } from '@/api/permitsApi'
import type { Permit } from '@/types'

const PERMITS_KEY = ['permits'] as const

export function usePermits(params?: Record<string, string>) {
  return useQuery({
    queryKey: [...PERMITS_KEY, params],
    queryFn: () => permitsApi.list(params),
  })
}

export function usePermit(id: string) {
  return useQuery({
    queryKey: [...PERMITS_KEY, id],
    queryFn: () => permitsApi.getById(id),
    enabled: !!id,
  })
}

export function useCreatePermit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permitsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMITS_KEY })
    },
  })
}

export function useUpdatePermit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Permit> }) =>
      permitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMITS_KEY })
    },
  })
}

export function useDeletePermit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: permitsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMITS_KEY })
    },
  })
}

export function useValidatePermit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'chef' | 'hse' }) =>
      permitsApi.validate(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMITS_KEY })
    },
  })
}

export function useRejectPermit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      permitsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PERMITS_KEY })
    },
  })
}
