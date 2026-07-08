import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { rolesApi } from '@/api/rolesApi'
import type { RoleCreate, RoleUpdate } from '@/types'
import { ROLES_KEY } from '@/data/constant/query'

export function useRoles(page: number = 1, itemsPerPage: number = 30) {
  return useQuery({
    queryKey: [...ROLES_KEY, { page, itemsPerPage }],
    queryFn: () => rolesApi.list({ page, itemsPerPage }),
  })
}

export function useRole(id: number) {
  return useQuery({
    queryKey: [...ROLES_KEY, id],
    queryFn: () => rolesApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateRole() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: RoleCreate) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY })
      navigate('/roles')
    },
  })
}

export function useUpdateRole() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RoleUpdate }) =>
      rolesApi.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY })
      navigate('/roles')
    },
  })
}

export function useDeleteRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_KEY })
    },
  })
}
