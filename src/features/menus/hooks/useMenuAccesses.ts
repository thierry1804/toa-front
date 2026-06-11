import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { menuAccessesApi } from '@/api/menuAccessesApi'
import type { MenuAccessCreate, MenuAccessUpdate } from '@/types'

const ACCESSES_KEY = ['menu-accesses'] as const

export function useMenuAccesses() {
  return useQuery({
    queryKey: ACCESSES_KEY,
    queryFn: () => menuAccessesApi.list(),
    select: (data) => Array.isArray(data) ? data : data.member ?? [],
  })
}

export function useMenuAccess(id: number) {
  return useQuery({
    queryKey: [...ACCESSES_KEY, id],
    queryFn: () => menuAccessesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateMenuAccess() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: MenuAccessCreate) => menuAccessesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCESSES_KEY })
      navigate('/menu-accesses')
    },
  })
}

export function useUpdateMenuAccess() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MenuAccessUpdate }) =>
      menuAccessesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCESSES_KEY })
      navigate('/menu-accesses')
    },
  })
}

export function useDeleteMenuAccess() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => menuAccessesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCESSES_KEY })
    },
  })
}
