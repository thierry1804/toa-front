import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { menusApi } from '@/api/menusApi'
import type { MenuCreate, MenuUpdate } from '@/types'
import { MENUS_KEY } from '@/data/constant/query'

export function useMenus() {
  return useQuery({
    queryKey: MENUS_KEY,
    queryFn: () => menusApi.list(),
    select: (data) => Array.isArray(data) ? data : data.member ?? [],
  })
}

export function useMenu(id: number) {
  return useQuery({
    queryKey: [...MENUS_KEY, id],
    queryFn: () => menusApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateMenu() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: MenuCreate) => menusApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
      navigate('/menus')
    },
  })
}

export function useUpdateMenu() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MenuUpdate }) =>
      menusApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
      navigate('/menus')
    },
  })
}

export function useDeleteMenu() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => menusApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENUS_KEY })
    },
  })
}
