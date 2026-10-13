import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '@/api/usersApi'
import type { UserCreate, UserUpdate } from '@/types'
import { USERS_KEY } from '@/data/constant/query'

export function useUsers(page: number = 1, itemsPerPage: number = 10, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...USERS_KEY, { page, itemsPerPage }],
    queryFn: () => usersApi.list({ page, itemsPerPage }),
    enabled: options?.enabled ?? true,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    retry: false,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: UserCreate) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      navigate('/users')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) =>
      usersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      navigate('/users')
    },
  })
}

export function useUploadSignature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) =>
      usersApi.uploadSignature(id, file),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [...USERS_KEY, id] })
    },
  })
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, actif }: { id: number; actif: boolean }) =>
      usersApi.patch(id, { isActive: actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}
