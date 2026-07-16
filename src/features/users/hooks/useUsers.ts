import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '@/api/usersApi'
import type { UserCreate, UserUpdate } from '@/types'
import { USERS_KEY } from '@/data/constant/query'

export function useUsers(page: number = 1, itemsPerPage: number = 10) {
  return useQuery({
    queryKey: [...USERS_KEY, { page, itemsPerPage }],
    queryFn: () => usersApi.list({ page, itemsPerPage }),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: [...USERS_KEY, id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
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

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
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
    mutationFn: async ({ id, actif }: { id: number; actif: boolean }) => {
      return usersApi.patch(id, { roles: undefined, ...(actif ? {} : {}) })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}
