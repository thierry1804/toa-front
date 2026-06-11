import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { usersApi } from '@/api/usersApi'
import type { UserCreate, UserUpdate } from '@/types'

const USERS_KEY = ['users'] as const

export function useUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => usersApi.list(),
    select: (data) => data.member,
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
