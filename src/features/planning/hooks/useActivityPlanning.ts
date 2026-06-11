import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { activityPlanningApi } from '@/api/activityPlanningApi'
import type { ActivityPlanningCreate, ActivityPlanningUpdate, HydraCollection } from '@/types'
import { PLANNING_KEY } from '@/data/constant/query'

export function useActivityPlannings(page: number = 1, itemsPerPage: number = 10) {
  return useQuery({
    queryKey: [...PLANNING_KEY, { page, itemsPerPage }],
    queryFn: () => activityPlanningApi.list({ page, itemsPerPage }),
  })
}

export function useActivityPlanning(id: number) {
  return useQuery({
    queryKey: [...PLANNING_KEY, id],
    queryFn: () => activityPlanningApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateActivityPlanning() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (data: ActivityPlanningCreate) => activityPlanningApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANNING_KEY })
      navigate('/planning')
    },
  })
}

export function useUpdateActivityPlanning() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ActivityPlanningUpdate }) =>
      activityPlanningApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANNING_KEY })
      navigate('/planning')
    },
  })
}

export function useDeleteActivityPlanning() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => activityPlanningApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PLANNING_KEY })
    },
  })
}
